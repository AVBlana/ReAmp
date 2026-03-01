import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Next.js route signature
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get Spotify account from database
    const spotifyAccount = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        provider: "spotify",
      },
    });

    if (!spotifyAccount?.access_token) {
      return NextResponse.json(
        { error: "Spotify not connected" },
        { status: 400 }
      );
    }

    // Check if token is expired
    const isExpired = spotifyAccount.expires_at
      ? Date.now() / 1000 > spotifyAccount.expires_at - 300 // 5 minute buffer
      : false;

    if (isExpired && spotifyAccount.refresh_token) {
      // TODO: Implement token refresh logic
      console.log("🔄 Spotify token expired, refresh needed");
      return NextResponse.json(
        { error: "Spotify token expired, please reconnect" },
        { status: 401 }
      );
    }

    // Call Spotify Web API to get current playback
    const spotifyResponse = await fetch(
      "https://api.spotify.com/v1/me/player",
      {
        headers: {
          Authorization: `Bearer ${spotifyAccount.access_token}`,
        },
      }
    );

    if (!spotifyResponse.ok) {
      const error = await spotifyResponse.json();
      console.error("Spotify current playback API error:", error);
      return NextResponse.json(
        { error: "Failed to get current playback from Spotify" },
        { status: spotifyResponse.status }
      );
    }

    const data = await spotifyResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error getting current Spotify playback:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
