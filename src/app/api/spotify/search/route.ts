import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get Spotify access token from session (NextAuth handles refresh automatically)
    let spotifyToken = session.providers?.spotify?.accessToken;

    if (!spotifyToken) {
      // Fallback: try to get token directly from database if session doesn't have it
      console.log("🎵 No token in session, trying database fallback");
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

      spotifyToken = spotifyAccount.access_token;
      console.log("🎵 Using Spotify token from database fallback");
    } else {
      console.log("🎵 Using Spotify token from session");
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const type = searchParams.get("type") || "track";
    const limit = searchParams.get("limit") || "10";

    if (!query) {
      return NextResponse.json(
        { error: "Query parameter is required" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(
        query
      )}&type=${type}&limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${spotifyToken}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("Spotify API error:", error);

      // Check if it's an authentication error (token revoked/expired)
      if (response.status === 401) {
        return NextResponse.json(
          {
            error:
              "Spotify authentication failed - please reconnect your Spotify account",
          },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { error: "Spotify API error" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error searching Spotify:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
