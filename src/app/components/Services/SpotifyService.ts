import { Song } from "@/app/types/playerTypes";

interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ id: string; name: string }>;
  album: {
    id: string;
    name: string;
    images: Array<{ url: string; width: number; height: number }>;
  };
  duration_ms: number;
  uri: string;
}

export interface SpotifySearchResponse {
  items: Song[];
  nextPageToken: string | null;
}

export async function searchSpotify(
  query: string,
  offset?: string
): Promise<SpotifySearchResponse> {
  try {
    const url = new URL("/api/spotify/search", window.location.origin);
    url.searchParams.append("q", query);
    url.searchParams.append("type", "track");
    url.searchParams.append("limit", "20");

    if (offset) {
      url.searchParams.append("offset", offset);
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("authentication failed");
      }
      if (response.status === 400) {
        // Check if it's a "Spotify not connected" error
        const errorData = await response.json().catch(() => ({}));
        if (errorData.error === "Spotify not connected") {
          throw new Error(
            "Spotify not connected - please connect your Spotify account first"
          );
        }
      }
      throw new Error(`Spotify API error: ${response.status}`);
    }

    const data = await response.json();

    const items: Song[] = data.tracks.items.map((track: SpotifyTrack) => ({
      id: track.id,
      title: track.name,
      artist: {
        id: track.artists[0]?.id || "",
        name: track.artists[0]?.name || "Unknown Artist",
      },
      album: {
        id: track.album?.id || "",
        name: track.album?.name || "Unknown Album",
      },
      artwork: {
        small: { url: track.album?.images?.[2]?.url || "" },
        medium: { url: track.album?.images?.[1]?.url || "" },
        large: { url: track.album?.images?.[0]?.url || "" },
      },
      duration: track.duration_ms,
      uri: track.uri,
      type: "spotify" as const,
    }));

    const nextPageToken = data.tracks.next
      ? (data.tracks.offset + data.tracks.limit).toString()
      : null;

    return {
      items,
      nextPageToken,
    };
  } catch (error) {
    console.error("Error searching Spotify:", error);
    throw error;
  }
}
