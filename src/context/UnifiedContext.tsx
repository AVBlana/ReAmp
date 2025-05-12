"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { YoutubeVideo } from "@/app/components/Services/YtService";
import { Song } from "@/types/playerTypes";
import { DropResult } from "@hello-pangea/dnd";

// Storage keys
const STORAGE_KEYS = {
  YOUTUBE: {
    PLAYLIST: "youtube_playlist",
    PLAYLIST_NAME: "youtube_playlist_name",
    SAVED_PLAYLISTS: "youtube_saved_playlists",
  },
  SPOTIFY: {
    PLAYLIST: "spotify_playlist",
    PLAYLIST_NAME: "spotify_playlist_name",
    TOKEN: "spotify_token",
    SAVED_PLAYLISTS: "spotify_saved_playlists",
  },
} as const;

// Helper function to safely handle localStorage operations
const safeLocalStorage = {
  get: (key: string) => {
    if (typeof window === "undefined") return null;
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error(`Error reading from localStorage (${key}):`, error);
      return null;
    }
  },
  set: (key: string, value: string) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error(`Error writing to localStorage (${key}):`, error);
    }
  },
  remove: (key: string) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing from localStorage (${key}):`, error);
    }
  },
};

// Update SavedPlaylist interface to be generic
interface SavedPlaylist<T> {
  id: string;
  name: string;
  songs: T[];
  createdAt: string;
}

interface UnifiedContextType {
  // YouTube state
  youtube: {
    searchResults: YoutubeVideo[];
    setSearchResults: React.Dispatch<React.SetStateAction<YoutubeVideo[]>>;
    playlist: YoutubeVideo[];
    setPlaylist: React.Dispatch<React.SetStateAction<YoutubeVideo[]>>;
    playlistName: string;
    setPlaylistName: React.Dispatch<React.SetStateAction<string>>;
    selectedVideo: string | null;
    setSelectedVideo: React.Dispatch<React.SetStateAction<string | null>>;
    nextPageToken: string | undefined;
    setNextPageToken: React.Dispatch<React.SetStateAction<string | undefined>>;
    currentSearchTerm: string;
    setCurrentSearchTerm: React.Dispatch<React.SetStateAction<string>>;
    addToPlaylist: (video: YoutubeVideo) => void;
    removeFromPlaylist: (videoId: string) => void;
    savedPlaylists: SavedPlaylist<YoutubeVideo>[];
    setSavedPlaylists: React.Dispatch<
      React.SetStateAction<SavedPlaylist<YoutubeVideo>[]>
    >;
  };

  // Spotify state
  spotify: {
    searchResults: Song[];
    setSearchResults: React.Dispatch<React.SetStateAction<Song[]>>;
    playlist: Song[];
    setPlaylist: React.Dispatch<React.SetStateAction<Song[]>>;
    currentSong: Song | null;
    setCurrentSong: React.Dispatch<React.SetStateAction<Song | null>>;
    playlistName: string;
    setPlaylistName: React.Dispatch<React.SetStateAction<string>>;
    refreshToken: () => Promise<void>;
    logout: () => Promise<void>;
    addToPlaylist: (song: Song) => void;
    removeFromPlaylist: (songId: string) => void;
    savedPlaylists: SavedPlaylist<Song>[];
    setSavedPlaylists: React.Dispatch<
      React.SetStateAction<SavedPlaylist<Song>[]>
    >;
  };

  // Drag and Drop
  onDragEnd: (result: DropResult) => void;
}

const UnifiedContext = createContext<UnifiedContextType | undefined>(undefined);

export const UnifiedProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // YouTube state
  const [searchResults, setSearchResults] = useState<YoutubeVideo[]>([]);
  const [youtubePlaylist, setYoutubePlaylist] = useState<YoutubeVideo[]>(() => {
    const saved = safeLocalStorage.get(STORAGE_KEYS.YOUTUBE.PLAYLIST);
    return saved ? JSON.parse(saved) : [];
  });
  const [youtubePlaylistName, setYoutubePlaylistName] = useState<string>(
    "My YouTube Playlist"
  );

  // Initialize YouTube playlist name from localStorage on client side
  useEffect(() => {
    const savedName = safeLocalStorage.get(STORAGE_KEYS.YOUTUBE.PLAYLIST_NAME);
    if (savedName) {
      setYoutubePlaylistName(savedName);
    }
  }, []);

  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(
    undefined
  );
  const [currentSearchTerm, setCurrentSearchTerm] = useState<string>("");

  // Add saved playlists state for YouTube
  const [youtubeSavedPlaylists, setYoutubeSavedPlaylists] = useState<
    SavedPlaylist<YoutubeVideo>[]
  >(() => {
    const saved = safeLocalStorage.get(STORAGE_KEYS.YOUTUBE.SAVED_PLAYLISTS);
    return saved ? JSON.parse(saved) : [];
  });

  // Add saved playlists state for Spotify
  const [spotifySavedPlaylists, setSpotifySavedPlaylists] = useState<
    SavedPlaylist<Song>[]
  >(() => {
    const saved = safeLocalStorage.get(STORAGE_KEYS.SPOTIFY.SAVED_PLAYLISTS);
    return saved ? JSON.parse(saved) : [];
  });

  // Save YouTube playlists whenever they change
  useEffect(() => {
    if (youtubeSavedPlaylists.length > 0) {
      safeLocalStorage.set(
        STORAGE_KEYS.YOUTUBE.SAVED_PLAYLISTS,
        JSON.stringify(youtubeSavedPlaylists)
      );
    }
  }, [youtubeSavedPlaylists]);

  // Save Spotify playlists whenever they change
  useEffect(() => {
    if (spotifySavedPlaylists.length > 0) {
      safeLocalStorage.set(
        STORAGE_KEYS.SPOTIFY.SAVED_PLAYLISTS,
        JSON.stringify(spotifySavedPlaylists)
      );
    }
  }, [spotifySavedPlaylists]);

  // Spotify state
  const [spotifySearchResults, setSpotifySearchResults] = useState<Song[]>([]);
  const [spotifyPlaylist, setSpotifyPlaylist] = useState<Song[]>(() => {
    const saved = safeLocalStorage.get(STORAGE_KEYS.SPOTIFY.PLAYLIST);
    return saved ? JSON.parse(saved) : [];
  });
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [spotifyPlaylistName, setSpotifyPlaylistName] = useState<string>(
    "My Spotify Playlist"
  );

  // Initialize playlist name from localStorage on client side
  useEffect(() => {
    const savedName = safeLocalStorage.get(STORAGE_KEYS.SPOTIFY.PLAYLIST_NAME);
    if (savedName) {
      setSpotifyPlaylistName(savedName);
    }
  }, []);

  // Restore playlist on mount
  useEffect(() => {
    const savedPlaylist = safeLocalStorage.get(STORAGE_KEYS.SPOTIFY.PLAYLIST);
    if (savedPlaylist) {
      try {
        const parsedPlaylist = JSON.parse(savedPlaylist);
        setSpotifyPlaylist(parsedPlaylist);
      } catch (error) {
        console.error("Error parsing saved playlist:", error);
      }
    }
  }, []);

  // Memoized handlers for YouTube playlist
  const handleYoutubePlaylistChange = useCallback(
    (value: React.SetStateAction<YoutubeVideo[]>) => {
      setYoutubePlaylist(value);
      const newPlaylist =
        typeof value === "function" ? value(youtubePlaylist) : value;
      if (newPlaylist.length > 0) {
        safeLocalStorage.set(
          STORAGE_KEYS.YOUTUBE.PLAYLIST,
          JSON.stringify(newPlaylist)
        );
      } else {
        safeLocalStorage.remove(STORAGE_KEYS.YOUTUBE.PLAYLIST);
      }
    },
    [youtubePlaylist]
  );

  const handleYoutubePlaylistNameChange = useCallback(
    (value: React.SetStateAction<string>) => {
      setYoutubePlaylistName(value);
      const newName =
        typeof value === "function" ? value(youtubePlaylistName) : value;
      safeLocalStorage.set(STORAGE_KEYS.YOUTUBE.PLAYLIST_NAME, newName);
    },
    [youtubePlaylistName]
  );

  const addToYoutubePlaylist = useCallback((video: YoutubeVideo) => {
    setYoutubePlaylist((prevPlaylist) => {
      const isAlreadyInPlaylist = prevPlaylist.some(
        (item) => item.id.videoId === video.id.videoId
      );
      if (!isAlreadyInPlaylist) {
        const newPlaylist = [...prevPlaylist, video];
        safeLocalStorage.set(
          STORAGE_KEYS.YOUTUBE.PLAYLIST,
          JSON.stringify(newPlaylist)
        );
        return newPlaylist;
      }
      return prevPlaylist;
    });
  }, []);

  const removeFromYoutubePlaylist = useCallback((videoId: string) => {
    setYoutubePlaylist((prevPlaylist) => {
      const newPlaylist = prevPlaylist.filter(
        (item) => item.id.videoId !== videoId
      );
      if (newPlaylist.length > 0) {
        safeLocalStorage.set(
          STORAGE_KEYS.YOUTUBE.PLAYLIST,
          JSON.stringify(newPlaylist)
        );
      } else {
        safeLocalStorage.remove(STORAGE_KEYS.YOUTUBE.PLAYLIST);
      }
      return newPlaylist;
    });
  }, []);

  // Memoized handlers for Spotify playlist
  const handleSpotifyPlaylistChange = useCallback(
    (value: React.SetStateAction<Song[]>) => {
      setSpotifyPlaylist(value);
      const newPlaylist =
        typeof value === "function" ? value(spotifyPlaylist) : value;
      safeLocalStorage.set(
        STORAGE_KEYS.SPOTIFY.PLAYLIST,
        JSON.stringify(newPlaylist)
      );
    },
    [spotifyPlaylist]
  );

  const handleSpotifyPlaylistNameChange = useCallback(
    (value: React.SetStateAction<string>) => {
      setSpotifyPlaylistName(value);
      const newName =
        typeof value === "function" ? value(spotifyPlaylistName) : value;
      safeLocalStorage.set(STORAGE_KEYS.SPOTIFY.PLAYLIST_NAME, newName);
    },
    [spotifyPlaylistName]
  );

  const addToSpotifyPlaylist = useCallback((song: Song) => {
    setSpotifyPlaylist((prevPlaylist) => {
      const isAlreadyInPlaylist = prevPlaylist.some(
        (item) => item.id === song.id
      );
      if (!isAlreadyInPlaylist) {
        const newPlaylist = [...prevPlaylist, song];
        safeLocalStorage.set(
          STORAGE_KEYS.SPOTIFY.PLAYLIST,
          JSON.stringify(newPlaylist)
        );
        return newPlaylist;
      }
      return prevPlaylist;
    });
  }, []);

  const removeFromSpotifyPlaylist = useCallback((songId: string) => {
    setSpotifyPlaylist((prevPlaylist) => {
      const newPlaylist = prevPlaylist.filter((item) => item.id !== songId);
      safeLocalStorage.set(
        STORAGE_KEYS.SPOTIFY.PLAYLIST,
        JSON.stringify(newPlaylist)
      );
      return newPlaylist;
    });
  }, []);

  // Spotify token management
  const refreshSpotifyToken = useCallback(async () => {
    try {
      const response = await fetch("/api/spotify/refresh");
      if (!response.ok) {
        throw new Error("Failed to refresh token");
      }
      const data = await response.json();
      if (typeof window !== "undefined") {
        localStorage.setItem("spotify_token", data.access_token);
        // Restore playlist after token refresh
        const savedPlaylist = safeLocalStorage.get(
          STORAGE_KEYS.SPOTIFY.PLAYLIST
        );
        if (savedPlaylist) {
          setSpotifyPlaylist(JSON.parse(savedPlaylist));
        }
      }
    } catch (error) {
      console.error("Error refreshing token:", error);
    }
  }, []);

  const handleSpotifyLogout = useCallback(async () => {
    try {
      // Save current playlist before clearing
      const currentPlaylist = spotifyPlaylist;
      safeLocalStorage.set(
        STORAGE_KEYS.SPOTIFY.PLAYLIST,
        JSON.stringify(currentPlaylist)
      );

      // Clear state
      setSpotifyPlaylist([]);
      setSpotifyPlaylistName("My Spotify Playlist");
      setCurrentSong(null);
      setSpotifySearchResults([]);

      // Clear cookies
      await fetch("/api/spotify/logout", { method: "POST" });
    } catch (error) {
      console.error("Error logging out:", error);
    }
  }, [spotifyPlaylist]);

  // Drag and drop handler
  const onDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) return;

      // Handle dropping to Spotify player
      if (result.destination.droppableId === "spotify-player") {
        // Handle both list and slider item IDs
        const songId = result.draggableId
          .replace("spotify-list-", "")
          .replace("spotify-slider-", "");
        const song = spotifyPlaylist.find((s) => s.id === songId);
        if (song) {
          setCurrentSong(song);
          // The SpotifyPlayer component will handle playback when currentSong changes
        }
        return;
      }

      // Handle reordering within Spotify playlist
      if (
        result.destination.droppableId === "playlist-list" &&
        result.source.droppableId === "playlist-list"
      ) {
        const items = Array.from(spotifyPlaylist);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);
        handleSpotifyPlaylistChange(items);
      }

      // Handle dropping from search results to playlist
      if (
        result.destination.droppableId === "playlist-list" &&
        result.source.droppableId === "search-results"
      ) {
        const songId = result.draggableId;
        const song = spotifySearchResults.find((s) => s.id === songId);
        if (song) {
          addToSpotifyPlaylist(song);
        }
      }
    },
    [
      spotifyPlaylist,
      spotifySearchResults,
      handleSpotifyPlaylistChange,
      setCurrentSong,
      addToSpotifyPlaylist,
    ]
  );

  return (
    <UnifiedContext.Provider
      value={{
        youtube: {
          searchResults,
          setSearchResults,
          playlist: youtubePlaylist,
          setPlaylist: handleYoutubePlaylistChange,
          playlistName: youtubePlaylistName,
          setPlaylistName: handleYoutubePlaylistNameChange,
          selectedVideo,
          setSelectedVideo,
          nextPageToken,
          setNextPageToken,
          currentSearchTerm,
          setCurrentSearchTerm,
          addToPlaylist: addToYoutubePlaylist,
          removeFromPlaylist: removeFromYoutubePlaylist,
          savedPlaylists: youtubeSavedPlaylists,
          setSavedPlaylists: setYoutubeSavedPlaylists,
        },
        spotify: {
          searchResults: spotifySearchResults,
          setSearchResults: setSpotifySearchResults,
          playlist: spotifyPlaylist,
          setPlaylist: handleSpotifyPlaylistChange,
          currentSong,
          setCurrentSong,
          playlistName: spotifyPlaylistName,
          setPlaylistName: handleSpotifyPlaylistNameChange,
          refreshToken: refreshSpotifyToken,
          logout: handleSpotifyLogout,
          addToPlaylist: addToSpotifyPlaylist,
          removeFromPlaylist: removeFromSpotifyPlaylist,
          savedPlaylists: spotifySavedPlaylists,
          setSavedPlaylists: setSpotifySavedPlaylists,
        },
        onDragEnd,
      }}
    >
      {children}
    </UnifiedContext.Provider>
  );
};

export const useUnifiedContext = () => {
  const context = useContext(UnifiedContext);
  if (context === undefined) {
    throw new Error("useUnifiedContext must be used within a UnifiedProvider");
  }
  return context;
};

// Convenience hooks for specific features
export const useYoutube = () => {
  const context = useUnifiedContext();
  return context.youtube;
};

export const useSpotify = () => {
  const context = useUnifiedContext();
  return context.spotify;
};

export const useDragDrop = () => {
  const context = useUnifiedContext();
  return { onDragEnd: context.onDragEnd };
};
