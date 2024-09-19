export interface YoutubeVideo {
  id: { kind: string; videoId: string };
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      default: { url: string; width: number; height: number };
      medium: { url: string; width: number; height: number };
      high: { url: string; width: number; height: number };
    };
    channelTitle: string;
    publishTime: string;
  };
}

const PLAYLIST_STORAGE_KEY = "youtube_playlist";

export const getYouTubeVideos = async (
  searchQuery: string
): Promise<YoutubeVideo[]> => {
  try {
    const response = await fetch(
      `/api/youtube?q=${encodeURIComponent(searchQuery)}`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch YouTube data");
    }
    const data = await response.json();
    return data.items;
  } catch (error) {
    console.error("Error fetching YouTube videos:", error);
    throw error;
  }
};

export const getPlaylist = (): YoutubeVideo[] => {
  const playlistJson = localStorage.getItem(PLAYLIST_STORAGE_KEY);
  return playlistJson ? JSON.parse(playlistJson) : [];
};

export const removeFromPlaylist = (videoId: string): void => {
  const playlist = getPlaylist();
  const updatedPlaylist = playlist.filter(
    (item) => item.id.videoId !== videoId
  );
  localStorage.setItem(PLAYLIST_STORAGE_KEY, JSON.stringify(updatedPlaylist));
};
