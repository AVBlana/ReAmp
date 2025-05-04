"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Song } from "../types/playerTypes";

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

const PlayingContext = createContext<PlayingContextType>({
  currentSong: null,
  setCurrentSong: () => {},
  playlist: [],
  setPlaylist: () => {},
  playlistName: "My Playlist",
  setPlaylistName: () => {},
});

export const usePlaying = () => useContext(PlayingContext);

export const PlayingProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [playlist, setPlaylist] = useState<Song[]>([]);
  const [playlistName, setPlaylistName] = useState<string>("My Playlist");

  // Load playlist and name from localStorage on mount
  useEffect(() => {
    const storedPlaylist = localStorage.getItem(PLAYLIST_STORAGE_KEY);
    const storedName = localStorage.getItem(PLAYLIST_NAME_KEY);
    if (storedPlaylist) {
      try {
        const parsedPlaylist = JSON.parse(storedPlaylist);
        setPlaylist(parsedPlaylist);
      } catch (error) {
        console.error("Error parsing stored playlist:", error);
        localStorage.removeItem(PLAYLIST_STORAGE_KEY);
      }
    }
    if (storedName) {
      setPlaylistName(storedName);
    }
  }, []);

  // Save playlist and name to localStorage whenever they change
  useEffect(() => {
    if (playlist.length > 0) {
      localStorage.setItem(PLAYLIST_STORAGE_KEY, JSON.stringify(playlist));
    } else {
      localStorage.removeItem(PLAYLIST_STORAGE_KEY);
    }
  }, [playlist]);

  useEffect(() => {
    localStorage.setItem(PLAYLIST_NAME_KEY, playlistName);
  }, [playlistName]);

  return (
    <PlayingContext.Provider
      value={{
        currentSong,
        setCurrentSong,
        playlist,
        setPlaylist,
        playlistName,
        setPlaylistName,
      }}
    >
      {children}
    </PlayingContext.Provider>
  );
};

export { PlayingContext };
