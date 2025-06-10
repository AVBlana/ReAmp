import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const SPOTIFY_CLIENT_ID = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.REACT_APP_SPOTIFY_API_KEY;
const REDIRECT_URI =
  process.env.REACT_APP_PUBLIC_REDIRECT_URI ||
  "http://localhost:3000/api/spotify/callback";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

// Add a function to get the origin page from cookies
function getOriginPage() {
  const origin = cookies().get("spotify_auth_origin")?.value;
  return origin || "/spotify"; // Default to /spotify if no origin is set
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    console.error("No authorization code received");
    const originPage = getOriginPage();
    return NextResponse.redirect(`${BASE_URL}${originPage}?error=no_code`);
  }

  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    console.error("Missing Spotify credentials");
    const originPage = getOriginPage();
    return NextResponse.redirect(
      `${BASE_URL}${originPage}?error=missing_credentials`
    );
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
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Failed to get tokens:", data);
      const originPage = getOriginPage();
      return NextResponse.redirect(
        `${BASE_URL}${originPage}?error=token_error`
      );
    }

    // Store both tokens in cookies
    cookies().set("spotify_refresh_token", data.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    cookies().set("spotify_access_token", data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60, // 1 hour
    });

    // Get the origin page and clear the origin cookie
    const originPage = getOriginPage();
    cookies().delete("spotify_auth_origin");

    // Create a response that will set the token in localStorage and redirect to the origin page
    const html = `
      <html>
        <body>
          <script>
            localStorage.setItem('spotify_token', '${data.access_token}');
            window.location.href = '${BASE_URL}${originPage}';
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
    console.error("Error getting tokens:", error);
    const originPage = getOriginPage();
    return NextResponse.redirect(`${BASE_URL}${originPage}?error=token_error`);
  }
}
