import { NextResponse } from "next/server";
import axios from "axios";

const API_KEY = process.env.REACT_APP_YOUTUBE_API_KEY;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json(
      { error: "Query parameter is required" },
      { status: 400 }
    );
  }

  if (!API_KEY) {
    console.error("YouTube API key is not configured");
    return NextResponse.json(
      { error: "YouTube API key is not configured" },
      { status: 500 }
    );
  }

  try {
    const response = await axios.get(
      "https://www.googleapis.com/youtube/v3/search",
      {
        params: {
          part: "snippet",
          maxResults: 5,
          q: query,
          type: "video",
          key: API_KEY,
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error) {
    console.error("YouTube API error:", error);

    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const message = error.response?.data?.error?.message || error.message;
      const details =
        error.response?.data?.error?.errors?.[0]?.reason || "Unknown error";
      console.error(
        `YouTube API error details: Status ${status}, Message: ${message}, Details: ${details}`
      );
      return NextResponse.json(
        { error: "YouTube API error", message, details },
        { status }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to fetch YouTube data",
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
