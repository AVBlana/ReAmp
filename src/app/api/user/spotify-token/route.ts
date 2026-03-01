import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/**
 * Returns the current user's Spotify access token from the server session.
 * Use this when the client session might not include providers (e.g. stale or database session shape).
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = (session as { providers?: { spotify?: { accessToken: string | null } } })
      ?.providers?.spotify?.accessToken;

    if (!token) {
      return NextResponse.json(
        { error: "No Spotify token; connect Spotify in account settings." },
        { status: 401 }
      );
    }

    return NextResponse.json({ accessToken: token });
  } catch (e) {
    console.error("[spotify-token]", e);
    return NextResponse.json(
      { error: "Failed to get Spotify token" },
      { status: 500 }
    );
  }
}
