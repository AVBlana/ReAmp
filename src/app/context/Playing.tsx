"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { Song } from "@/types/playerTypes";

interface PlayingContextType {
  currentSong: Song | null;
  setCurrentSong: (song: Song | null) => void;
  playlist: Song[];
  setPlaylist: (songs: Song[]) => void;
  playlistName: string;
  setPlaylistName: (name: string) => void;
}

const PLAYLIST_STORAGE_KEY = "spotify_playlist";
const PLAYLIST_NAME_KEY = "spotify_playlist_name";

// Initialize state from localStorage if available
const getInitialState = () => {
  if (typeof window === "undefined") {
    return {
      playlist: [],
      playlistName: "My Playlist",
    };
  }

  try {
    const savedPlaylist = localStorage.getItem(PLAYLIST_STORAGE_KEY);
    const savedName = localStorage.getItem(PLAYLIST_NAME_KEY);

    return {
      playlist: savedPlaylist ? JSON.parse(savedPlaylist) : [],
      playlistName: savedName || "My Playlist",
    };
  } catch (error) {
    console.error("Error loading initial state:", error);
    return {
      playlist: [],
      playlistName: "My Playlist",
    };
  }
};

const initialState = getInitialState();

const PlayingContext = createContext<PlayingContextType>({
  currentSong: null,
  setCurrentSong: () => {},
  playlist: initialState.playlist,
  setPlaylist: () => {},
  playlistName: initialState.playlistName,
  setPlaylistName: () => {},
});

export const usePlaying = () => {
  const context = useContext(PlayingContext);
  if (context === undefined) {
    throw new Error("usePlaying must be used within a PlayingProvider");
  }
  return context;
};

export const PlayingProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [playlist, setPlaylist] = useState<Song[]>(initialState.playlist);
  const [playlistName, setPlaylistName] = useState<string>(
    initialState.playlistName
  );

  // Create memoized setter for playlist name that ensures localStorage sync
  const handleSetPlaylistName = useCallback((name: string) => {
    setPlaylistName(name);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(PLAYLIST_NAME_KEY, name);
      } catch (error) {
        console.error("Error saving playlist name to localStorage:", error);
      }
    }
  }, []);

  // Create memoized setter for playlist that ensures localStorage sync
  const handleSetPlaylist = useCallback((songs: Song[]) => {
    setPlaylist(songs);
    if (typeof window !== "undefined") {
      try {
        if (songs.length > 0) {
          localStorage.setItem(PLAYLIST_STORAGE_KEY, JSON.stringify(songs));
        } else {
          localStorage.removeItem(PLAYLIST_STORAGE_KEY);
        }
      } catch (error) {
        console.error("Error saving playlist to localStorage:", error);
      }
    }
  }, []);

  // Load playlist and name from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedPlaylist = localStorage.getItem(PLAYLIST_STORAGE_KEY);
        const savedName = localStorage.getItem(PLAYLIST_NAME_KEY);

        if (savedPlaylist) {
          const parsedPlaylist = JSON.parse(savedPlaylist);
          if (Array.isArray(parsedPlaylist)) {
            setPlaylist(parsedPlaylist);
          }
        }

        if (savedName) {
          setPlaylistName(savedName);
        }
      } catch (error) {
        console.error("Error loading from localStorage:", error);
        // Clean up potentially corrupted data
        localStorage.removeItem(PLAYLIST_STORAGE_KEY);
        localStorage.removeItem(PLAYLIST_NAME_KEY);
      }
    }
  }, []);

  return (
    <PlayingContext.Provider
      value={{
        currentSong,
        setCurrentSong,
        playlist,
        setPlaylist: handleSetPlaylist,
        playlistName,
        setPlaylistName: handleSetPlaylistName,
      }}
    >
      {children}
    </PlayingContext.Provider>
  );
};

export { PlayingContext };
