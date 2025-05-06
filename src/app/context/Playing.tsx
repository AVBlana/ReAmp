import React, { createContext, useState } from "react";
import { Song } from "@/types/playerTypes";

interface PlayingContextType {
  playlist: Song[];
  setPlaylist: (playlist: Song[]) => void;
  currentSong: Song | null;
  setCurrentSong: (song: Song | null) => void;
  playlistName: string;
  setPlaylistName: (name: string) => void;
}

export const PlayingContext = createContext<PlayingContextType>({
  playlist: [],
  setPlaylist: () => {},
  currentSong: null,
  setCurrentSong: () => {},
  playlistName: "My Playlist",
  setPlaylistName: () => {},
});

export const PlayingProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [playlist, setPlaylist] = useState<Song[]>([]);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [playlistName, setPlaylistName] = useState("My Playlist");

  return (
    <PlayingContext.Provider
      value={{
        playlist,
        setPlaylist,
        currentSong,
        setCurrentSong,
        playlistName,
        setPlaylistName,
      }}
    >
      {children}
    </PlayingContext.Provider>
  );
};
