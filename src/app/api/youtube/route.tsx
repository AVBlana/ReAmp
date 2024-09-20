import { NextResponse } from "next/server";
import axios from "axios";

const API_KEY = process.env.REACT_APP_YOUTUBE_API_KEY;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const pageToken = searchParams.get("pageToken");

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
          pageToken: pageToken || undefined,
        },
      }
    );

    return NextResponse.json({
      items: response.data.items,
      nextPageToken: response.data.nextPageToken,
    });
  } catch (error) {
    console.error("YouTube API error:", error);

    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const message = error.response?.data?.error?.message || error.message;
      return NextResponse.json(
        { error: "YouTube API error", details: message },
        { status }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch YouTube data" },
      { status: 500 }
    );
  }
}
