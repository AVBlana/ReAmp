import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * In-memory one-time tickets for session bridge (localhost <-> 127.0.0.1).
 * Only used in development when user on localhost connects Spotify (redirect_uri must be 127.0.0.1).
 * TTL 60s; cleared after use.
 */
const ticketStore = new Map<
  string,
  { sessionToken: string; expiresAt: number }
>();
const TICKET_TTL_MS = 60_000;
const SESSION_COOKIE_NAME =
  process.env.NODE_ENV === "production"
    ? "__Secure-next-auth.session-token"
    : "next-auth.session-token";

function cleanupExpired() {
  const now = Date.now();
  for (const [id, data] of ticketStore.entries()) {
    if (data.expiresAt < now) ticketStore.delete(id);
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const ticket = searchParams.get("ticket");
  const then = searchParams.get("then");
  const host = request.headers.get("host") ?? "";
  const is127 = host.startsWith("127.0.0.1");

  // Only allow in development
  if (process.env.NODE_ENV === "production") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  cleanupExpired();

  // 1) Consume ticket on localhost: set session cookie and redirect to then
  if (ticket) {
    const data = ticketStore.get(ticket);
    ticketStore.delete(ticket);
    if (!data || data.expiresAt < Date.now()) {
      return NextResponse.redirect(new URL("/?error=SessionBridgeExpired", request.url));
    }
    const redirectUrl = then ? decodeURIComponent(then) : "/";
    const res = NextResponse.redirect(new URL(redirectUrl, request.url));
    res.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: data.sessionToken,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 30 * 24 * 60 * 60,
    });
    return res;
  }

  // 2) On 127.0.0.1 after OAuth: create ticket and redirect to localhost with it
  if (is127) {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const port = request.nextUrl.port || "3000";
    const localhostOrigin = `http://localhost:${port}`;
    if (!sessionToken) {
      // Redirect to localhost with error if user came from localhost (then param), so they land where they started
      const thenParam = searchParams.get("then");
      const errorUrl =
        thenParam && thenParam.startsWith("http://localhost:")
          ? `${localhostOrigin}/?error=SessionBridgeNoSession`
          : new URL("/?error=SessionBridgeNoSession", request.url).toString();
      return NextResponse.redirect(errorUrl);
    }
    const ticketId = crypto.randomUUID();
    ticketStore.set(ticketId, {
      sessionToken,
      expiresAt: Date.now() + TICKET_TTL_MS,
    });
    const thenParam = then ? `&then=${encodeURIComponent(then)}` : "";
    const bridgeUrl = `${localhostOrigin}/api/auth/session-bridge?ticket=${ticketId}${thenParam}`;
    return NextResponse.redirect(bridgeUrl);
  }

  return NextResponse.redirect(new URL("/", request.url));
}
