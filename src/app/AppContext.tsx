"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { YoutubeVideo } from "./components/Services/YtService";
import { Song } from "@/types/playerTypes";
import { DropResult } from "@hello-pangea/dnd";

// Storage keys
const STORAGE_KEYS = {
  YOUTUBE: {
    PLAYLIST: "youtube_playlist",
    PLAYLIST_NAME: "youtube_playlist_name",
  },
  SPOTIFY: {
    PLAYLIST: "spotify_playlist",
    PLAYLIST_NAME: "spotify_playlist_name",
  },
} as const;

interface AppContextType {
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
  };

  // Spotify state
  spotify: {
    playlist: Song[];
    setPlaylist: React.Dispatch<React.SetStateAction<Song[]>>;
    currentSong: Song | null;
    setCurrentSong: React.Dispatch<React.SetStateAction<Song | null>>;
    playlistName: string;
    setPlaylistName: React.Dispatch<React.SetStateAction<string>>;
  };

  // Drag and Drop
  onDragEnd: (result: DropResult) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

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

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // YouTube state
  const [searchResults, setSearchResults] = useState<YoutubeVideo[]>([]);
  const [youtubePlaylist, setYoutubePlaylist] = useState<YoutubeVideo[]>(() => {
    const saved = safeLocalStorage.get(STORAGE_KEYS.YOUTUBE.PLAYLIST);
    return saved ? JSON.parse(saved) : [];
  });
  const [youtubePlaylistName, setYoutubePlaylistName] = useState<string>(() => {
    return (
      safeLocalStorage.get(STORAGE_KEYS.YOUTUBE.PLAYLIST_NAME) ||
      "My YouTube Playlist"
    );
  });
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(
    undefined
  );
  const [currentSearchTerm, setCurrentSearchTerm] = useState<string>("");

  // Spotify state
  const [spotifyPlaylist, setSpotifyPlaylist] = useState<Song[]>(() => {
    const saved = safeLocalStorage.get(STORAGE_KEYS.SPOTIFY.PLAYLIST);
    return saved ? JSON.parse(saved) : [];
  });
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [spotifyPlaylistName, setSpotifyPlaylistName] = useState<string>(() => {
    return (
      safeLocalStorage.get(STORAGE_KEYS.SPOTIFY.PLAYLIST_NAME) ||
      "My Spotify Playlist"
    );
  });

  // Memoized handlers for playlist updates
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

  const handleSpotifyPlaylistChange = useCallback(
    (value: React.SetStateAction<Song[]>) => {
      setSpotifyPlaylist(value);
      const newPlaylist =
        typeof value === "function" ? value(spotifyPlaylist) : value;
      if (newPlaylist.length > 0) {
        safeLocalStorage.set(
          STORAGE_KEYS.SPOTIFY.PLAYLIST,
          JSON.stringify(newPlaylist)
        );
      } else {
        safeLocalStorage.remove(STORAGE_KEYS.SPOTIFY.PLAYLIST);
      }
    },
    [spotifyPlaylist]
  );

  // Memoized handlers for playlist name updates
  const handleYoutubePlaylistNameChange = useCallback(
    (value: React.SetStateAction<string>) => {
      setYoutubePlaylistName(value);
      const newName =
        typeof value === "function" ? value(youtubePlaylistName) : value;
      safeLocalStorage.set(STORAGE_KEYS.YOUTUBE.PLAYLIST_NAME, newName);
    },
    [youtubePlaylistName]
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

  // Drag and drop handler
  const onDragEnd = useCallback((result: DropResult) => {
    // Implement your drag and drop logic here
    console.log("Drag end result:", result);
  }, []);

  return (
    <AppContext.Provider
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
        },
        spotify: {
          playlist: spotifyPlaylist,
          setPlaylist: handleSpotifyPlaylistChange,
          currentSong,
          setCurrentSong,
          playlistName: spotifyPlaylistName,
          setPlaylistName: handleSpotifyPlaylistNameChange,
        },
        onDragEnd,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
