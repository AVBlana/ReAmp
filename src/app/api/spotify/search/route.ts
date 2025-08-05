import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const SPOTIFY_CLIENT_ID = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.REACT_APP_SPOTIFY_API_KEY;

async function refreshAccessToken(refreshToken: string) {
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(
        `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`
      ).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to refresh token");
  }

  const data = await response.json();
  return data.access_token;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const offset = searchParams.get("offset");
  const cookieStore = await cookies();
  let accessToken = cookieStore.get("spotify_access_token")?.value;
  const refreshToken = cookieStore.get("spotify_refresh_token")?.value;

  if (!query) {
    return NextResponse.json(
      { error: "Query parameter is required" },
      { status: 400 }
    );
  }

  if (!accessToken && !refreshToken) {
    return NextResponse.json({ error: "No access token" }, { status: 401 });
  }

  try {
    // Try to search with current access token
    let response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(
        query
      )}&type=track&limit=10${offset ? `&offset=${offset}` : ""}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    // If token is expired, refresh it and try again
    if (response.status === 401 && refreshToken) {
      accessToken = await refreshAccessToken(refreshToken);

      // Store the new access token
      if (accessToken) {
        cookieStore.set("spotify_access_token", accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60, // 1 hour
        });
      }

      // Retry the search with new token
      response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(
          query
        )}&type=track&limit=10${offset ? `&offset=${offset}` : ""}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
    }

    if (!response.ok) {
      throw new Error("Failed to fetch from Spotify API");
    }

    const data = await response.json();

    // Add hasMore flag to the response
    const hasMore =
      data.tracks.total > data.tracks.offset + data.tracks.items.length;
    const responseData = {
      ...data,
      tracks: {
        ...data.tracks,
        hasMore,
        nextOffset: hasMore
          ? data.tracks.offset + data.tracks.items.length
          : null,
      },
    };

    // Log the first track to see its structure
    if (data.tracks?.items?.[0]) {
      console.log(
        "First track data:",
        JSON.stringify(data.tracks.items[0], null, 2)
      );
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Spotify search error:", error);
    return NextResponse.json(
      { error: "Failed to search Spotify" },
      { status: 500 }
    );
  }
}
