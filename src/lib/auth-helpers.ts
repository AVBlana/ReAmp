/**
 * Single source of truth for OAuth connect URLs.
 * Use this everywhere we need to redirect to Spotify or Google sign-in.
 */
export type ConnectProvider = "spotify" | "google";

export function getConnectUrl(
  provider: ConnectProvider,
  origin: string = typeof window !== "undefined" ? window.location.origin : ""
): string {
  const callbackUrl = `${origin}/?connected=${provider}`;
  const path = provider === "spotify" ? "spotify" : "google";
  return `/api/auth/signin/${path}?callbackUrl=${encodeURIComponent(callbackUrl)}`;
}

/** Callback URL only (for signIn(callbackUrl)). */
export function getConnectCallbackUrl(
  provider: ConnectProvider,
  origin: string = typeof window !== "undefined" ? window.location.origin : ""
): string {
  return `${origin}/?connected=${provider}`;
}
