/**
 * Connect flow: one callback URL; on localhost we use 127.0.0.1 + session-bridge so the
 * session cookie ends up on localhost (NEXTAUTH_URL is 127 in dev so OAuth callback runs on 127).
 */

export type ConnectProvider = "spotify" | "google";

/** Where to land after OAuth (e.g. "/?connected=spotify"). */
export function connectCallbackUrl(
  provider: ConnectProvider,
  origin: string = typeof window !== "undefined" ? window.location.origin : ""
): string {
  return `${origin}/?connected=${provider}`;
}

function isOnLocalhost(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.origin === `http://localhost:${window.location.port || "3000"}`;
}

/**
 * When user is on localhost, OAuth runs on 127.0.0.1 (NEXTAUTH_URL in dev), so the session
 * cookie is set on 127. We redirect via session-bridge so the cookie is set on localhost too.
 * Returns full URL to open, or null when not on localhost (use signIn with callbackUrl instead).
 */
export function connectUrlWhenOnLocalhost(provider: ConnectProvider): string | null {
  if (typeof window === "undefined" || !isOnLocalhost()) return null;
  const port = window.location.port || "3000";
  const then = `http://localhost:${port}/?connected=${provider}`;
  const base127 = `http://127.0.0.1:${port}`;
  const callback = `${base127}/api/auth/session-bridge?then=${encodeURIComponent(then)}`;
  return `${base127}/api/auth/signin/${provider}?callbackUrl=${encodeURIComponent(callback)}`;
}

/** Full URL to open to connect a provider (for window.location.href). Uses session-bridge on localhost for both. */
export function getConnectUrl(provider: ConnectProvider): string {
  const bridge = connectUrlWhenOnLocalhost(provider);
  if (bridge) return bridge;
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/api/auth/signin/${provider}?callbackUrl=${encodeURIComponent(connectCallbackUrl(provider, origin))}`;
}
