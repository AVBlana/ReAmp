import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const { deviceId } = body;

    // Call Spotify Web API to resume playback
    const spotifyResponse = await fetch(
      `https://api.spotify.com/v1/me/player/play${
        deviceId ? `?device_id=${deviceId}` : ""
      }`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${spotifyAccount.access_token}`,
        },
      }
    );

    if (!spotifyResponse.ok) {
      const error = await spotifyResponse.json();
      console.error("Spotify resume API error:", error);
      return NextResponse.json(
        { error: "Failed to resume Spotify playback" },
        { status: spotifyResponse.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error resuming Spotify playback:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
