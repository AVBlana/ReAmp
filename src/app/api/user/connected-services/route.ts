import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    console.log("[connected-services] === DEBUG START ===");
    console.log("[connected-services] timestamp:", new Date().toISOString());

    const session = await auth();
    console.log("[connected-services] session result:", {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      providers: session?.providers,
    });

    if (!session?.user?.id) {
      console.log("[connected-services] No valid session found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all connected accounts for the user
    const accounts = await prisma.account.findMany({
      where: { userId: session.user.id },
      select: {
        provider: true,
        access_token: true,
        refresh_token: true,
        expires_at: true,
      },
    });

    console.log(
      "📊 Database accounts found:",
      accounts.map((acc) => ({
        provider: acc.provider,
        hasAccessToken: !!acc.access_token,
        hasRefreshToken: !!acc.refresh_token,
        expiresAt: acc.expires_at,
        isExpired: acc.expires_at
          ? Date.now() / 1000 > acc.expires_at - 300
          : false,
      }))
    );

    // Check which services are connected and have valid tokens
    const connectedServices = {
      spotify: false,
      youtube: false, // Changed from 'google' to 'youtube' for consistency
    };

    // First check database accounts
    for (const account of accounts) {
      if (account.provider === "spotify") {
        // Consider Spotify connected if we have either a valid access token or a refresh token
        const hasValidToken =
          account.access_token &&
          account.expires_at &&
          Date.now() / 1000 <= account.expires_at - 300;
        const hasRefreshToken = !!account.refresh_token;

        // Check if session has Spotify (meaning token refresh worked)
        const sessionHasSpotify = !!session.providers?.spotify;

        // Only mark as connected if we have a valid token OR (refresh token AND session has Spotify)
        connectedServices.spotify =
          hasValidToken || (hasRefreshToken && sessionHasSpotify);
        console.log(
          `🎵 Spotify account: ${
            hasValidToken
              ? "VALID_TOKEN"
              : hasRefreshToken && sessionHasSpotify
              ? "REFRESHABLE"
              : hasRefreshToken
              ? "REFRESH_TOKEN_REVOKED"
              : "INVALID"
          }`
        );
      } else if (account.provider === "google") {
        // Google OAuth grants YouTube API access
        // Consider YouTube connected if we have either a valid access token or a refresh token
        const hasValidToken =
          account.access_token &&
          account.expires_at &&
          Date.now() / 1000 <= account.expires_at - 300;
        const hasRefreshToken = !!account.refresh_token;

        connectedServices.youtube = hasValidToken || hasRefreshToken;
        console.log(
          `📺 YouTube account: ${
            hasValidToken
              ? "VALID_TOKEN"
              : hasRefreshToken
              ? "REFRESHABLE"
              : "INVALID"
          }`
        );
      }
    }

    // Also check session providers as fallback
    if (session.providers) {
      console.log("🔄 Checking session providers:", session.providers);

      // If database didn't find Spotify but session has it, use session data
      if (!connectedServices.spotify && session.providers.spotify) {
        connectedServices.spotify = true;
        console.log("🎵 Spotify session provider: AVAILABLE");
      }

      // If database didn't find YouTube but session has it, use session data
      if (!connectedServices.youtube && session.providers.google) {
        connectedServices.youtube = true;
        console.log("📺 YouTube session provider: AVAILABLE");
      }
    }

    console.log("📊 Final connected services:", connectedServices);
    console.log("[connected-services] === DEBUG END ===");

    return NextResponse.json({
      user: {
        id: session.user.id,
        email: session.user.email,
        providers: connectedServices,
      },
    });
  } catch (error) {
    console.error("Error fetching connected services:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
