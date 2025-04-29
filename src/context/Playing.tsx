"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Song } from "../types/playerTypes";

interface PlayingContextType {
  currentSong: Song | null;
  setCurrentSong: (song: Song | null) => void;
  playlist: Song[];
  setPlaylist: (songs: Song[]) => void;
}

const PLAYLIST_STORAGE_KEY = "spotify_playlist";

const PlayingContext = createContext<PlayingContextType>({
  currentSong: null,
  setCurrentSong: () => {},
  playlist: [],
  setPlaylist: () => {},
});

export const usePlaying = () => useContext(PlayingContext);

export const PlayingProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [playlist, setPlaylist] = useState<Song[]>([]);

  // Load playlist from localStorage on mount
  useEffect(() => {
    const storedPlaylist = localStorage.getItem(PLAYLIST_STORAGE_KEY);
    if (storedPlaylist) {
      try {
        const parsedPlaylist = JSON.parse(storedPlaylist);
        setPlaylist(parsedPlaylist);
      } catch (error) {
        console.error("Error parsing stored playlist:", error);
        localStorage.removeItem(PLAYLIST_STORAGE_KEY);
      }
    }
  }, []);

  // Save playlist to localStorage whenever it changes
  useEffect(() => {
    if (playlist.length > 0) {
      localStorage.setItem(PLAYLIST_STORAGE_KEY, JSON.stringify(playlist));
    } else {
      localStorage.removeItem(PLAYLIST_STORAGE_KEY);
    }
  }, [playlist]);

  return (
    <PlayingContext.Provider
      value={{ currentSong, setCurrentSong, playlist, setPlaylist }}
    >
      {children}
    </PlayingContext.Provider>
  );
};

export { PlayingContext };
