import { type NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import SpotifyProvider from "next-auth/providers/spotify";
import { prisma } from "./prisma";
import { getServerSession } from "next-auth";

// Normalize base URL: no trailing slash; in dev use 127.0.0.1 so Spotify redirect_uri is accepted
function normalizeBaseUrl(url: string | undefined): string {
  if (!url || typeof url !== "string") return "";
  let base = url.trim().replace(/\/+$/, "");
  if (process.env.NODE_ENV === "production") {
    if (base && !base.startsWith("https://")) base = base.replace(/^http:\/\//i, "https://");
  } else {
    base = base.replace(/^https?:\/\/localhost(:\d+)?(\/|$)/i, "http://127.0.0.1$1$2");
  }
  return base;
}

const rawUrl = process.env.NEXTAUTH_URL ?? process.env.AUTH_URL ?? "";
const baseUrl = normalizeBaseUrl(rawUrl);
if (baseUrl) {
  process.env.NEXTAUTH_URL = baseUrl;
  process.env.AUTH_URL = baseUrl;
}

const requiredEnv = {
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  SPOTIFY_CLIENT_ID: process.env.SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
};

const missing = Object.entries(requiredEnv).filter(([, v]) => !v).map(([k]) => k);
if (missing.length > 0) {
  throw new Error(`Missing env: ${missing.join(", ")}`);
}

const baseUrlForCallbacks = requiredEnv.NEXTAUTH_URL!.replace(/\/+$/, "");
const googleRedirectUri = `${baseUrlForCallbacks}/api/auth/callback/google`;
const spotifyRedirectUri = `${baseUrlForCallbacks}/api/auth/callback/spotify`;
if (process.env.NODE_ENV === "development") {
  console.log("[NextAuth] Add these exact redirect URIs in your OAuth apps:");
  console.log("[NextAuth] Google Cloud Console → Credentials → Your OAuth client → Authorized redirect URIs:");
  console.log("[NextAuth]   ", googleRedirectUri);
  console.log("[NextAuth] Spotify Dashboard → App → Redirect URIs:");
  console.log("[NextAuth]   ", spotifyRedirectUri);
}

async function refreshSpotifyToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${requiredEnv.SPOTIFY_CLIENT_ID}:${requiredEnv.SPOTIFY_CLIENT_SECRET}`).toString("base64")}`,
    },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken }),
  });
  if (!res.ok) throw new Error(`Spotify refresh failed: ${res.status}`);
  return res.json();
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    SpotifyProvider({
      clientId: requiredEnv.SPOTIFY_CLIENT_ID!,
      clientSecret: requiredEnv.SPOTIFY_CLIENT_SECRET!,
      authorization: {
        params: {
          scope:
            "user-read-email user-read-private user-read-playback-state user-modify-playback-state user-read-currently-playing playlist-read-private playlist-read-collaborative playlist-modify-public playlist-modify-private streaming",
          show_dialog: "true",
        },
      },
      profile(profile: { id: string; display_name?: string; email?: string; images?: { url: string }[] }) {
        return {
          id: profile.id,
          name: profile.display_name ?? null,
          email: profile.email ?? null,
          image: profile.images?.[0]?.url ?? null,
        };
      },
      allowDangerousEmailAccountLinking: true,
    }),
    GoogleProvider({
      clientId: requiredEnv.GOOGLE_CLIENT_ID!,
      clientSecret: requiredEnv.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  pages: {
    signIn: "/",
    error: "/auth/error",
  },
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async signIn() {
      return true;
    },
    async redirect({ url, baseUrl }) {
      if (url.includes("error=")) {
        const u = new URL(url);
        const err = u.searchParams.get("error");
        const desc = (u.searchParams.get("error_description") ?? "").toLowerCase();
        if (desc.includes("redirect_uri") || desc.includes("redirect uri") || err === "redirect_uri_mismatch") {
          return `${baseUrl}/auth/error?error=Configuration`;
        }
        if (err === "OAuthAccountNotLinked") return `${baseUrl}?error=account-not-linked`;
        if (err === "OAuthCallbackError") return `${baseUrl}?error=oauth-callback-error`;
        if (err === "AccessDenied") return `${baseUrl}?error=access-denied`;
        if (err === "Verification") return `${baseUrl}?error=verification-failed`;
        return `${baseUrl}?error=oauth-error`;
      }
      if (url.includes("/api/auth/session-bridge")) return url;
      if (url.includes("connected=") || url.includes("callbackUrl=")) return baseUrl;
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      try {
        const u = new URL(url);
        if (u.origin === baseUrl) return url;
      } catch {
        // ignore
      }
      return baseUrl;
    },
    async session({ session, user }) {
      if (user) (session.user as { id: string }).id = user.id;
      (session as { providers?: { spotify?: { accessToken: string | null; expiresAt?: number | null }; google?: { accessToken: string | null; expiresAt?: number | null } } }).providers = {
        spotify: undefined,
        google: undefined,
      };

      if (!user?.id) return session;

      try {
        const accounts = await prisma.account.findMany({
          where: { userId: user.id },
          select: { provider: true, providerAccountId: true, access_token: true, refresh_token: true, expires_at: true },
        });

        for (const acc of accounts) {
          if (acc.provider === "spotify") {
            const valid =
              acc.access_token &&
              acc.expires_at &&
              Date.now() / 1000 <= acc.expires_at - 300;
            if (valid) {
              (session as { providers: { spotify?: { accessToken: string | null; expiresAt?: number | null } } }).providers.spotify = {
                accessToken: acc.access_token,
                expiresAt: acc.expires_at,
              };
            } else if (acc.refresh_token) {
              try {
                const refreshed = await refreshSpotifyToken(acc.refresh_token);
                const expiresAt = Math.floor(Date.now() / 1000) + refreshed.expires_in;
                await prisma.account.update({
                  where: { provider_providerAccountId: { provider: "spotify", providerAccountId: acc.providerAccountId } },
                  data: { access_token: refreshed.access_token, expires_at: expiresAt },
                });
                (session as { providers: { spotify?: { accessToken: string | null; expiresAt?: number | null } } }).providers.spotify = {
                  accessToken: refreshed.access_token,
                  expiresAt,
                };
              } catch (e) {
                if (e instanceof Error && (e.message.includes("invalid_grant") || e.message.toLowerCase().includes("revoked"))) {
                  await prisma.account.deleteMany({
                    where: { userId: user.id, provider: "spotify", providerAccountId: acc.providerAccountId },
                  });
                }
              }
            }
          } else if (acc.provider === "google") {
            const valid =
              acc.access_token &&
              acc.expires_at &&
              Date.now() / 1000 <= acc.expires_at - 300;
            if (valid || acc.refresh_token) {
              (session as { providers: { google?: { accessToken: string | null; expiresAt?: number | null } } }).providers.google = {
                accessToken: acc.access_token,
                expiresAt: acc.expires_at ?? undefined,
              };
            }
          }
        }
      } catch (e) {
        console.error("[nextauth] session callback error:", e);
      }
      return session;
    },
  },
  secret: requiredEnv.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

/** Get current session in API routes / server (NextAuth v4). */
export async function auth() {
  return getServerSession(authOptions);
}

