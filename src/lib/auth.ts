import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "./prisma";

// Function to refresh Spotify access token
async function refreshSpotifyToken(refreshToken: string): Promise<{
  access_token: string;
  expires_in: number;
}> {
  console.log("[nextauth] 🔄 Attempting Spotify token refresh...");
  console.log(
    "[nextauth] Client ID:",
    requiredEnvVars.SPOTIFY_CLIENT_ID ? "SET" : "NOT SET"
  );
  console.log(
    "[nextauth] Client Secret:",
    requiredEnvVars.SPOTIFY_CLIENT_SECRET ? "SET" : "NOT SET"
  );
  console.log("[nextauth] Refresh token length:", refreshToken.length);

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(
        `${requiredEnvVars.SPOTIFY_CLIENT_ID}:${requiredEnvVars.SPOTIFY_CLIENT_SECRET}`
      ).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  console.log("[nextauth] Spotify refresh response status:", response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[nextauth] Spotify refresh error response:", errorText);
    throw new Error(
      `Failed to refresh Spotify token: ${response.status} - ${errorText}`
    );
  }

  const result = await response.json();
  console.log("[nextauth] ✅ Spotify token refresh successful");
  return result;
}

// Validate environment variables
const requiredEnvVars = {
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  SPOTIFY_CLIENT_ID: process.env.SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
};

console.log("NextAuth Environment Variables:", {
  NEXTAUTH_URL: requiredEnvVars.NEXTAUTH_URL,
  NEXTAUTH_SECRET: requiredEnvVars.NEXTAUTH_SECRET ? "SET" : "NOT SET",
  SPOTIFY_CLIENT_ID: requiredEnvVars.SPOTIFY_CLIENT_ID ? "SET" : "NOT SET",
  SPOTIFY_CLIENT_SECRET: requiredEnvVars.SPOTIFY_CLIENT_SECRET
    ? "SET"
    : "NOT SET",
  GOOGLE_CLIENT_ID: requiredEnvVars.GOOGLE_CLIENT_ID ? "SET" : "NOT SET",
  GOOGLE_CLIENT_SECRET: requiredEnvVars.GOOGLE_CLIENT_SECRET
    ? "SET"
    : "NOT SET",
});

// Check for missing required environment variables
const missingVars = Object.entries(requiredEnvVars)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  console.error("❌ Missing required environment variables:", missingVars);
  throw new Error(
    `Missing required environment variables: ${missingVars.join(", ")}`
  );
}

// Token refresh is now handled automatically by NextAuth with database strategy
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  // Debug environment variables in development
  ...(process.env.NODE_ENV === "development" && {
    logger: {
      error: (error: Error) => {
        console.error("NextAuth Error:", error);
      },
      warn: (code: string) => {
        console.warn("NextAuth Warning:", code);
      },
      debug: (code: string, metadata?: unknown) => {
        console.log("NextAuth Debug:", code, metadata);
      },
    },
  }),
  providers: [
    {
      id: "spotify",
      name: "Spotify",
      type: "oauth",
      authorization: {
        url: "https://accounts.spotify.com/authorize",
        params: {
          scope:
            "user-read-email user-read-private user-read-playback-state user-modify-playback-state user-read-currently-playing playlist-read-private playlist-read-collaborative playlist-modify-public playlist-modify-private streaming",
          prompt: "consent", // Force re-authentication to get new scopes
          show_dialog: true, // Always show the permission dialog
        },
      },
      token: "https://accounts.spotify.com/api/token",
      userinfo: "https://api.spotify.com/v1/me",
      clientId: requiredEnvVars.SPOTIFY_CLIENT_ID!,
      clientSecret: requiredEnvVars.SPOTIFY_CLIENT_SECRET!,
      profile(profile) {
        console.log("🎵 Spotify profile received:", {
          id: profile.id,
          name: profile.display_name,
          email: profile.email,
          images: profile.images?.length || 0,
        });
        return {
          id: profile.id,
          name: profile.display_name,
          email: profile.email,
          image: profile.images?.[0]?.url,
        };
      },
      // Add debugging for provider initialization
      ...(process.env.NODE_ENV === "development" && {
        debug: true,
      }),
    },
    GoogleProvider({
      clientId: requiredEnvVars.GOOGLE_CLIENT_ID!,
      clientSecret: requiredEnvVars.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log("[nextauth] === SIGNIN CALLBACK START ===");
      console.log(
        "[nextauth] signIn account:",
        account?.provider,
        account?.providerAccountId
      );
      console.log("[nextauth] signIn user:", user?.email, user?.id);
      console.log("[nextauth] signIn profile:", profile?.email);
      console.log("[nextauth] === SIGNIN CALLBACK END ===");

      // Allow all sign-ins - let allowDangerousEmailAccountLinking handle the linking
      return true;
    },
    async redirect({ url, baseUrl }) {
      console.log("🔀 Redirect callback called:", { url, baseUrl });

      // Handle OAuth errors gracefully
      if (url.includes("error=")) {
        const urlObj = new URL(url);
        const error = urlObj.searchParams.get("error");
        const errorDescription = urlObj.searchParams.get("error_description");

        console.log("🔀 OAuth error detected:", error);
        console.log("🔀 OAuth error description:", errorDescription);
        console.log("🔀 Full error URL:", url);

        switch (error) {
          case "OAuthAccountNotLinked":
            return `${baseUrl}?error=account-not-linked`;
          case "OAuthCallbackError":
            return `${baseUrl}?error=oauth-callback-error`;
          case "AccessDenied":
            return `${baseUrl}?error=access-denied`;
          case "Verification":
            return `${baseUrl}?error=verification-failed`;
          default:
            return `${baseUrl}?error=oauth-error`;
        }
      }

      // Prevent redirect loops - always redirect to baseUrl after OAuth
      if (url.includes("connected=") || url.includes("callbackUrl=")) {
        console.log("🔀 OAuth callback detected, redirecting to base URL");
        return baseUrl;
      }

      // If relative path, make it absolute
      if (url.startsWith("/")) {
        console.log("🔀 Redirecting to relative URL:", `${baseUrl}${url}`);
        return `${baseUrl}${url}`;
      }

      // If same origin, allow it
      try {
        const urlObj = new URL(url);
        if (urlObj.origin === baseUrl) {
          console.log("🔀 Redirecting to same origin:", url);
          return url;
        }
      } catch (e) {
        console.log("🔀 Invalid URL, using baseUrl:", e);
      }

      // Default to baseUrl (landing page) to prevent loops
      console.log("🔀 Default redirect to landing page");
      return baseUrl;
    },
    async session({ session, user }) {
      console.log("[nextauth] === SESSION CALLBACK START ===");
      console.log("[nextauth] session user:", user?.email, user?.id);
      console.log(
        "[nextauth] session callback called at:",
        new Date().toISOString()
      );

      // Send properties to the client
      if (user) {
        session.user.id = user.id;
      }

      // Initialize providers object
      session.providers = {
        spotify: undefined,
        google: undefined,
      };

      // Fetch provider data from database if user exists
      if (user?.id) {
        try {
          const accounts = await prisma.account.findMany({
            where: { userId: user.id },
            select: {
              provider: true,
              providerAccountId: true,
              access_token: true,
              refresh_token: true,
              expires_at: true,
            },
          });

          console.log("[nextauth] found accounts:", accounts.length);

          for (const account of accounts) {
            if (account.provider === "spotify") {
              const hasValidToken =
                account.access_token &&
                account.expires_at &&
                Date.now() / 1000 <= account.expires_at - 300;
              const hasRefreshToken = !!account.refresh_token;

              if (hasValidToken) {
                // Token is still valid
                session.providers.spotify = {
                  accessToken: account.access_token,
                  expiresAt: account.expires_at,
                };
                console.log(
                  "[nextauth] ✅ Spotify provider added to session (valid token)"
                );
              } else if (hasRefreshToken) {
                // Token expired but we have refresh token - refresh it
                try {
                  console.log("[nextauth] 🔄 Refreshing expired Spotify token");
                  const refreshed = await refreshSpotifyToken(
                    account.refresh_token!
                  );

                  // Update the database with new token
                  const newExpiresAt =
                    Math.floor(Date.now() / 1000) + refreshed.expires_in;
                  await prisma.account.update({
                    where: {
                      provider_providerAccountId: {
                        provider: "spotify",
                        providerAccountId: account.providerAccountId,
                      },
                    },
                    data: {
                      access_token: refreshed.access_token,
                      expires_at: newExpiresAt,
                    },
                  });

                  session.providers.spotify = {
                    accessToken: refreshed.access_token,
                    expiresAt: newExpiresAt,
                  };
                  console.log(
                    "[nextauth] ✅ Spotify provider added to session (refreshed token)"
                  );
                } catch (error) {
                  console.error(
                    "[nextauth] ❌ Failed to refresh Spotify token:",
                    error
                  );

                  // Handle different types of refresh errors
                  if (error instanceof Error) {
                    const errorMessage = error.message.toLowerCase();

                    if (
                      errorMessage.includes("refresh token revoked") ||
                      errorMessage.includes("invalid_grant")
                    ) {
                      console.log(
                        "[nextauth] 🔄 Spotify token revoked/invalid, cleaning up account"
                      );

                      // Clean up the revoked account from database
                      try {
                        await prisma.account.deleteMany({
                          where: {
                            userId: user.id,
                            provider: "spotify",
                            providerAccountId: account.providerAccountId,
                          },
                        });
                        console.log(
                          "[nextauth] ✅ Revoked Spotify account cleaned up from database"
                        );
                      } catch (cleanupError) {
                        console.error(
                          "[nextauth] ❌ Failed to clean up revoked Spotify account:",
                          cleanupError
                        );
                      }

                      // Don't add provider to session - user needs to reconnect
                    } else if (
                      errorMessage.includes("network") ||
                      errorMessage.includes("timeout") ||
                      errorMessage.includes("fetch")
                    ) {
                      console.log(
                        "[nextauth] 🔄 Network error during token refresh, keeping account for retry"
                      );
                      // Don't clean up account for network errors - might be temporary
                    } else {
                      console.log(
                        "[nextauth] 🔄 Other refresh error, not adding provider:",
                        error.message
                      );
                    }
                  } else {
                    console.log(
                      "[nextauth] 🔄 Unknown refresh error, not adding provider"
                    );
                  }
                }
              }
            } else if (account.provider === "google") {
              const hasValidToken =
                account.access_token &&
                account.expires_at &&
                Date.now() / 1000 <= account.expires_at - 300;
              const hasRefreshToken = !!account.refresh_token;

              if (hasValidToken || hasRefreshToken) {
                session.providers.google = {
                  accessToken: account.access_token,
                  expiresAt: account.expires_at,
                };
                console.log("[nextauth] ✅ Google provider added to session");
              }
            }
          }
        } catch (error) {
          console.error(
            "[nextauth] ❌ Error fetching accounts in session callback:",
            error
          );
          console.error(
            "[nextauth] Error details:",
            error instanceof Error ? error.message : String(error),
            error instanceof Error ? error.stack : undefined
          );
          // Keep providers as undefined if there's an error
        }
      }

      console.log("[nextauth] session final providers:", session.providers);
      console.log("[nextauth] === SESSION CALLBACK END ===");

      return session;
    },
  },
  pages: {
    signIn: "/", // landing page is the sign-in hub
    error: "/auth/error",
  },
  session: {
    strategy: "database",
  },
  cookies: {
    // Use consistent cookie naming across environments
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-authjs.session-token"
          : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  secret: requiredEnvVars.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
  trustHost: true,
});
