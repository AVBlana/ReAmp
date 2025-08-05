import { Song } from "@/app/types/playerTypes";

export interface SpotifySearchResponse {
  items: Song[];
  nextPageToken: string | null;
}

export async function searchSpotify(
  query: string,
  token: string,
  offset?: string
): Promise<SpotifySearchResponse> {
  try {
    const url = new URL("https://api.spotify.com/v1/search");
    url.searchParams.append("q", query);
    url.searchParams.append("type", "track");
    url.searchParams.append("limit", "20");

    if (offset) {
      url.searchParams.append("offset", offset);
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("authentication failed");
      }
      throw new Error(`Spotify API error: ${response.status}`);
    }

    const data = await response.json();

    const items: Song[] = data.tracks.items.map((track: any) => ({
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
