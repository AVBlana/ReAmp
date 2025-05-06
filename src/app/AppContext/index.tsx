"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
} from "react";
import { YoutubeVideo } from "../components/Services/YtService";

interface AppContextType {
  searchResults: YoutubeVideo[];
  setSearchResults: React.Dispatch<React.SetStateAction<YoutubeVideo[]>>;
  selectedVideo: string | null;
  setSelectedVideo: React.Dispatch<React.SetStateAction<string | null>>;
  youtubePlaylist: YoutubeVideo[];
  addToYoutubePlaylist: (video: YoutubeVideo) => void;
  removeFromYoutubePlaylist: (videoId: string) => void;
  nextPageToken: string | undefined;
  setNextPageToken: (token: string | undefined) => void;
  currentSearchTerm: string;
  setCurrentSearchTerm: (term: string) => void;
  setYoutubePlaylist: (playlist: YoutubeVideo[]) => void;
  playlistName: string;
  setPlaylistName: (name: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const YOUTUBE_PLAYLIST_STORAGE_KEY = "youtube_playlist";
const YOUTUBE_PLAYLIST_NAME_KEY = "youtube_playlist_name";

export const AppProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [searchResults, setSearchResults] = useState<YoutubeVideo[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [youtubePlaylist, setYoutubePlaylist] = useState<YoutubeVideo[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(
    undefined
  );
  const [currentSearchTerm, setCurrentSearchTerm] = useState<string>("");
  const [playlistName, setPlaylistName] = useState<string>("YouTube Playlist");

  // Load playlist from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const storedPlaylist = localStorage.getItem(
          YOUTUBE_PLAYLIST_STORAGE_KEY
        );
        const storedName = localStorage.getItem(YOUTUBE_PLAYLIST_NAME_KEY);

        if (storedPlaylist) {
          const parsedPlaylist = JSON.parse(storedPlaylist);
          if (Array.isArray(parsedPlaylist)) {
            setYoutubePlaylist(parsedPlaylist);
          }
        }

        if (storedName) {
          setPlaylistName(storedName);
        }
      } catch (error) {
        console.error(
          "Error loading YouTube playlist from localStorage:",
          error
        );
        localStorage.removeItem(YOUTUBE_PLAYLIST_STORAGE_KEY);
        localStorage.removeItem(YOUTUBE_PLAYLIST_NAME_KEY);
      }
    }
  }, []);

  // Sync playlist changes to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        if (youtubePlaylist.length > 0) {
          localStorage.setItem(
            YOUTUBE_PLAYLIST_STORAGE_KEY,
            JSON.stringify(youtubePlaylist)
          );
        } else {
          localStorage.removeItem(YOUTUBE_PLAYLIST_STORAGE_KEY);
        }
      } catch (error) {
        console.error("Error saving YouTube playlist to localStorage:", error);
      }
    }
  }, [youtubePlaylist]);

  // Sync playlist name changes to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(YOUTUBE_PLAYLIST_NAME_KEY, playlistName);
      } catch (error) {
        console.error(
          "Error saving YouTube playlist name to localStorage:",
          error
        );
      }
    }
  }, [playlistName]);

  const addToYoutubePlaylist = useCallback((video: YoutubeVideo) => {
    setYoutubePlaylist((prevPlaylist) => {
      // Check if the video is already in the playlist
      const isAlreadyInPlaylist = prevPlaylist.some(
        (item) => item.id.videoId === video.id.videoId
      );

      if (!isAlreadyInPlaylist) {
        return [...prevPlaylist, video];
      }
      return prevPlaylist;
    });
  }, []);

  const removeFromYoutubePlaylist = useCallback((videoId: string) => {
    setYoutubePlaylist((prevPlaylist) =>
      prevPlaylist.filter((item) => item.id.videoId !== videoId)
    );
  }, []);

  return (
    <AppContext.Provider
      value={{
        searchResults,
        setSearchResults,
        selectedVideo,
        setSelectedVideo,
        youtubePlaylist,
        setYoutubePlaylist,
        addToYoutubePlaylist,
        removeFromYoutubePlaylist,
        nextPageToken,
        setNextPageToken,
        currentSearchTerm,
        setCurrentSearchTerm,
        playlistName,
        setPlaylistName,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useYoutube = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useYoutube must be used within an AppProvider");
  }
  return context;
};
