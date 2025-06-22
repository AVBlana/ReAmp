import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const SPOTIFY_CLIENT_ID = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
const REDIRECT_URI =
  process.env.REACT_APP_PUBLIC_REDIRECT_URI ||
  "http://localhost:3000/api/spotify/callback";

export async function GET(request: Request) {
  // Get the origin page from the referer header, query params, or default to /spotify
  const referer = request.headers.get("referer");
  const { searchParams } = new URL(request.url);
  const originFromQuery = searchParams.get("origin");

  let originPage = "/spotify"; // Default to /spotify

  if (originFromQuery) {
    originPage = originFromQuery;
  } else if (referer) {
    const refererUrl = new URL(referer);
    // Only use referer if it's from our domain and not the root page
    if (refererUrl.pathname !== "/" && refererUrl.pathname !== "") {
      originPage = refererUrl.pathname;
    }
  }

  // Store the origin page in a cookie
  cookies().set("spotify_auth_origin", originPage, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 5, // 5 minutes should be enough for the auth flow
  });

  const scope = [
    "streaming",
    "user-read-email",
    "user-read-private",
    "user-read-playback-state",
    "user-modify-playback-state",
  ].join(" ");

  const params = new URLSearchParams({
    response_type: "code",
    client_id: SPOTIFY_CLIENT_ID!,
    scope,
    redirect_uri: REDIRECT_URI,
    show_dialog: "true",
  });

  return NextResponse.redirect(
    `https://accounts.spotify.com/authorize?${params.toString()}`
  );
}
