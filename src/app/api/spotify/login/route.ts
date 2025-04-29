import { NextResponse } from "next/server";

const SPOTIFY_CLIENT_ID = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
const REDIRECT_URI =
  process.env.REACT_APP_PUBLIC_REDIRECT_URI ||
  "http://localhost:3000/api/spotify/callback";

export async function GET() {
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
