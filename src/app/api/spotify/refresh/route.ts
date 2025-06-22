import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const SPOTIFY_CLIENT_ID = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.REACT_APP_SPOTIFY_API_KEY;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export async function GET() {
  const refreshToken = cookies().get("spotify_refresh_token")?.value;

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
          `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`
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
      cookies().delete("spotify_refresh_token");
      cookies().delete("spotify_access_token");

      // Store current page as origin for redirect after login
      cookies().set("spotify_auth_origin", "/spotify", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 5, // 5 minutes
      });

      return NextResponse.redirect(`${BASE_URL}/api/spotify/login`);
    }

    // Store the new access token in a cookie
    cookies().set("spotify_access_token", data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60, // 1 hour
    });

    // Create a response that will set the token in localStorage
    const html = `
      <html>
        <body>
          <script>
            localStorage.setItem('spotify_token', '${data.access_token}');
            window.location.reload();
          </script>
        </body>
      </html>
    `;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (error) {
    console.error("Error refreshing token:", error);

    // Clear cookies and redirect to login on error
    cookies().delete("spotify_refresh_token");
    cookies().delete("spotify_access_token");

    // Store current page as origin for redirect after login
    cookies().set("spotify_auth_origin", "/spotify", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 5, // 5 minutes
    });

    return NextResponse.redirect(`${BASE_URL}/api/spotify/login`);
  }
}
