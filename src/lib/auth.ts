import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import SpotifyProvider from "next-auth/providers/spotify";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "./prisma";

// Validate required environment variables
const requiredEnvVars = {
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  SPOTIFY_CLIENT_ID: process.env.SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  DATABASE_URL: process.env.DATABASE_URL,
};

// Check for missing environment variables
const missingEnvVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingEnvVars.length > 0) {
  console.error("Missing required environment variables:", missingEnvVars);
  throw new Error(
    `Missing required environment variables: ${missingEnvVars.join(", ")}`
  );
}

// Token refresh helpers
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function refreshSpotifyAccessToken(account: any) {
  try {
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
        ).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: account.refresh_token!,
      }),
    });

    const tokens = await response.json();

    if (!response.ok) {
      throw tokens;
    }

    return {
      ...account,
      access_token: tokens.access_token,
      expires_at: Math.floor(Date.now() / 1000) + tokens.expires_in,
      refresh_token: tokens.refresh_token ?? account.refresh_token,
    };
  } catch (error) {
    console.error("Error refreshing Spotify token:", error);
    return {
      ...account,
      error: "RefreshAccessTokenError",
    };
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function refreshGoogleAccessToken(account: any) {
  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: "refresh_token",
        refresh_token: account.refresh_token!,
      }),
    });

    const tokens = await response.json();

    if (!response.ok) {
      throw tokens;
    }

    return {
      ...account,
      access_token: tokens.access_token,
      expires_at: Math.floor(Date.now() / 1000) + tokens.expires_in,
      refresh_token: tokens.refresh_token ?? account.refresh_token,
    };
  } catch (error) {
    console.error("Error refreshing Google token:", error);
    return {
      ...account,
      error: "RefreshAccessTokenError",
    };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
      authorization: {
        params: {
          scope:
            "user-read-email user-read-private user-read-playback-state user-modify-playback-state user-read-currently-playing playlist-read-private playlist-read-collaborative playlist-modify-public playlist-modify-private",
        },
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/youtube.readonly",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, user }) {
      // Initial sign in
      if (account && user) {
        console.log("JWT callback - Initial sign in:", {
          provider: account.provider,
          hasToken: !!account.access_token,
        });
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: account.expires_at
            ? account.expires_at * 1000
            : undefined,
          provider: account.provider,
        };
      }

      // Return previous token if the access token has not expired yet
      if (token.accessTokenExpires && Date.now() < token.accessTokenExpires) {
        return token;
      }

      // Access token has expired, try to update it
      if (token.sub && token.provider) {
        const accountData = await prisma.account.findFirst({
          where: {
            userId: token.sub,
            provider: token.provider as string,
          },
        });

        if (accountData) {
          let refreshedToken;
          if (token.provider === "spotify") {
            refreshedToken = await refreshSpotifyAccessToken(accountData);
          } else if (token.provider === "google") {
            refreshedToken = await refreshGoogleAccessToken(accountData);
          }

          if (refreshedToken && !refreshedToken.error) {
            // Update the account in the database
            await prisma.account.update({
              where: { id: accountData.id },
              data: {
                access_token: refreshedToken.access_token,
                expires_at: refreshedToken.expires_at,
                refresh_token: refreshedToken.refresh_token,
              },
            });

            return {
              ...token,
              accessToken: refreshedToken.access_token,
              accessTokenExpires: refreshedToken.expires_at! * 1000,
              refreshToken: refreshedToken.refresh_token,
            };
          }
        }
      }

      return token;
    },
    async session({ session, token }) {
      console.log("Session callback:", {
        hasToken: !!token,
        hasUser: !!session.user,
      });

      // Send properties to the client
      session.user.id = token.sub!;
      session.accessToken = token.accessToken as string;
      session.provider = token.provider as string;

      // Skip database operations in middleware/edge runtime
      if (process.env.NEXT_RUNTIME === "edge") {
        session.providers = {};
      } else {
        try {
          // Get provider tokens from database
          const accounts = await prisma.account.findMany({
            where: { userId: token.sub! },
          });

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const providerTokens: any = {};

          for (const account of accounts) {
            if (account.provider === "spotify") {
              providerTokens.spotify = {
                accessToken: account.access_token,
                expiresAt: account.expires_at,
              };
            } else if (account.provider === "google") {
              providerTokens.google = {
                accessToken: account.access_token,
                expiresAt: account.expires_at,
              };
            }
          }

          session.providers = providerTokens;
        } catch (error) {
          console.warn(
            "Could not fetch provider tokens in session callback:",
            error
          );
          session.providers = {};
        }
      }

      console.log("Session callback - Final session:", {
        userId: session.user.id,
        provider: session.provider,
        hasProviders: !!session.providers,
      });

      return session;
    },
  },
  pages: {
    signIn: "/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
});
