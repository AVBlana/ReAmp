import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const NEXT_PUBLIC_SPOTIFY_CLIENT_ID = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
const NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET = process.env.REACT_APP_SPOTIFY_API_KEY;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export async function GET() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("spotify_refresh_token")?.value;

  if (!refreshToken) {
    // No refresh token, redirect to login
    return NextResponse.redirect(`${BASE_URL}/api/spotify/login`);
  }

  try {
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          `${NEXT_PUBLIC_SPOTIFY_CLIENT_ID}:${NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET}`
        ).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Refresh failed, clear cookies and redirect to login
      cookieStore.delete("spotify_refresh_token");
      cookieStore.delete("spotify_access_token");

      // Store current page as origin for redirect after login
      cookieStore.set("spotify_auth_origin", "/spotify", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 5, // 5 minutes
      });

      return NextResponse.redirect(`${BASE_URL}/api/spotify/login`);
    }

    // Store the new access token in a cookie
    cookieStore.set("spotify_access_token", data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60, // 1 hour
    });

    // Return JSON response with the new access token
    return NextResponse.json({
      access_token: data.access_token,
      expires_in: data.expires_in,
    });
  } catch (error) {
    console.error("Error refreshing token:", error);

    // Clear cookies and redirect to login on error
    cookieStore.delete("spotify_refresh_token");
    cookieStore.delete("spotify_access_token");

    // Store current page as origin for redirect after login
    cookieStore.set("spotify_auth_origin", "/spotify", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 5, // 5 minutes
    });

    return NextResponse.redirect(`${BASE_URL}/api/spotify/login`);
  }
}
