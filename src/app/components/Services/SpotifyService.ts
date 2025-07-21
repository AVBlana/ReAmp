import { ServiceType, Song } from "../../../types/playerTypes";

interface SpotifyTrack {
  id: string;
  name: string;
  duration_ms: number;
  artists: Array<{
    id: string;
    name: string;
  }>;
  album: {
    images: Array<{
      url: string;
      width: number;
      height: number;
    }>;
  };
}

interface SearchResponse {
  items: Song[];
  nextPageToken: string | null;
}

export const searchSpotify = async (
  searchTerm: string,
  token: string,
  offset?: string
): Promise<SearchResponse> => {
  try {
    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${searchTerm}&type=track&limit=10${
        offset ? `&offset=${offset}` : ""
      }`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to search Spotify");
    }

    const data = await response.json();
    const tracks = data.tracks.items as SpotifyTrack[];

    const songs: Song[] = tracks.map((track) => ({
      id: track.id,
      type: ServiceType.Spotify,
      title: track.name,
      artist: {
        id: track.artists[0].id,
        name: track.artists[0].name,
      },
      artwork: {
        small: {
          url: track.album.images[2]?.url || "",
          width: track.album.images[2]?.width || 64,
          height: track.album.images[2]?.height || 64,
        },
        medium: {
          url: track.album.images[1]?.url || "",
          width: track.album.images[1]?.width || 300,
          height: track.album.images[1]?.height || 300,
        },
        big: {
          url: track.album.images[0]?.url || "",
          width: track.album.images[0]?.width || 640,
          height: track.album.images[0]?.height || 640,
        },
      },
      duration: track.duration_ms,
    }));

    return {
      items: songs,
      nextPageToken: data.tracks.next ? data.tracks.offset + 10 : null,
    };
  } catch (error) {
    console.error("Error searching Spotify:", error);
    return {
      items: [],
      nextPageToken: null,
    };
  }
};
