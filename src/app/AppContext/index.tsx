"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { YoutubeVideo } from "../components/Services/YtService";

interface AppContextType {
  searchResults: YoutubeVideo[];
  setSearchResults: React.Dispatch<React.SetStateAction<YoutubeVideo[]>>;
  selectedVideo: string | null;
  setSelectedVideo: React.Dispatch<React.SetStateAction<string | null>>;
  playlist: YoutubeVideo[];
  addToPlaylist: (video: YoutubeVideo) => void;
  handleAddToPlaylist: (video: YoutubeVideo) => void;
  removeFromPlaylist: (videoId: string) => void;
  nextPageToken: string | undefined;
  setNextPageToken: (token: string | undefined) => void;
  currentSearchTerm: string;
  setCurrentSearchTerm: (term: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const PLAYLIST_STORAGE_KEY = "youtube_playlist";

export const AppProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [searchResults, setSearchResults] = useState<YoutubeVideo[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [playlist, setPlaylist] = useState<YoutubeVideo[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(
    undefined
  );
  const [currentSearchTerm, setCurrentSearchTerm] = useState<string>("");

  useEffect(() => {
    const storedPlaylist = localStorage.getItem(PLAYLIST_STORAGE_KEY);
    if (storedPlaylist) {
      setPlaylist(JSON.parse(storedPlaylist));
    }
  }, []);

  const addToPlaylist = (video: YoutubeVideo) => {
    setPlaylist((prevPlaylist) => {
      const updatedPlaylist = [...prevPlaylist, video];
      localStorage.setItem(
        PLAYLIST_STORAGE_KEY,
        JSON.stringify(updatedPlaylist)
      );
      return updatedPlaylist;
    });
  };

  const handleAddToPlaylist = (video: YoutubeVideo) => {
    addToPlaylist(video);
  };

  const removeFromPlaylist = (videoId: string) => {
    setPlaylist((prevPlaylist) => {
      const updatedPlaylist = prevPlaylist.filter(
        (item) => item.id.videoId !== videoId
      );
      localStorage.setItem(
        PLAYLIST_STORAGE_KEY,
        JSON.stringify(updatedPlaylist)
      );
      return updatedPlaylist;
    });
  };

  return (
    <AppContext.Provider
      value={{
        searchResults,
        setSearchResults,
        selectedVideo,
        setSelectedVideo,
        playlist,
        addToPlaylist,
        handleAddToPlaylist,
        removeFromPlaylist,
        nextPageToken,
        setNextPageToken,
        currentSearchTerm,
        setCurrentSearchTerm,
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
