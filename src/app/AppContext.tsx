"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { YoutubeVideo } from "./components/Services/YtService";
import { Song } from "@/types/playerTypes";

const YOUTUBE_PLAYLIST_KEY = "youtube_playlist";
const YOUTUBE_PLAYLIST_NAME_KEY = "youtube_playlist_name";
const SPOTIFY_PLAYLIST_KEY = "spotify_playlist";

interface AppContextType {
  // YouTube state
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
  handleAddToPlaylist: (video: YoutubeVideo) => void;

  // Spotify state
  spotifyPlaylist: Song[];
  setSpotifyPlaylist: React.Dispatch<React.SetStateAction<Song[]>>;
  currentSong: Song | null;
  setCurrentSong: React.Dispatch<React.SetStateAction<Song | null>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // YouTube state
  const [searchResults, setSearchResults] = useState<YoutubeVideo[]>([]);
  const [playlist, setPlaylist] = useState<YoutubeVideo[]>([]);
  const [playlistName, setPlaylistName] = useState<string>("My Playlist");
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(
    undefined
  );
  const [currentSearchTerm, setCurrentSearchTerm] = useState<string>("");

  // Spotify state
  const [spotifyPlaylist, setSpotifyPlaylist] = useState<Song[]>([]);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);

  // Load saved playlists from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Load YouTube playlist
      try {
        const savedYoutubePlaylist = localStorage.getItem(YOUTUBE_PLAYLIST_KEY);
        if (savedYoutubePlaylist) {
          const parsedPlaylist = JSON.parse(savedYoutubePlaylist);
          if (Array.isArray(parsedPlaylist)) {
            setPlaylist(parsedPlaylist);
          } else {
            console.error("Invalid YouTube playlist format in localStorage");
            localStorage.removeItem(YOUTUBE_PLAYLIST_KEY);
          }
        }
      } catch (error) {
        console.error(
          "Error loading YouTube playlist from localStorage:",
          error
        );
        localStorage.removeItem(YOUTUBE_PLAYLIST_KEY);
      }

      // Load YouTube playlist name
      try {
        const savedYoutubePlaylistName = localStorage.getItem(
          YOUTUBE_PLAYLIST_NAME_KEY
        );
        if (savedYoutubePlaylistName) {
          setPlaylistName(savedYoutubePlaylistName);
        }
      } catch (error) {
        console.error(
          "Error loading YouTube playlist name from localStorage:",
          error
        );
        localStorage.removeItem(YOUTUBE_PLAYLIST_NAME_KEY);
      }

      // Load Spotify playlist
      try {
        const savedSpotifyPlaylist = localStorage.getItem(SPOTIFY_PLAYLIST_KEY);
        if (savedSpotifyPlaylist) {
          const parsedPlaylist = JSON.parse(savedSpotifyPlaylist);
          if (Array.isArray(parsedPlaylist)) {
            setSpotifyPlaylist(parsedPlaylist);
          } else {
            console.error("Invalid Spotify playlist format in localStorage");
            localStorage.removeItem(SPOTIFY_PLAYLIST_KEY);
          }
        }
      } catch (error) {
        console.error(
          "Error loading Spotify playlist from localStorage:",
          error
        );
        localStorage.removeItem(SPOTIFY_PLAYLIST_KEY);
      }
    }
  }, []);

  // Save playlists to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        if (playlist.length > 0) {
          localStorage.setItem(YOUTUBE_PLAYLIST_KEY, JSON.stringify(playlist));
        } else {
          localStorage.removeItem(YOUTUBE_PLAYLIST_KEY);
        }
      } catch (error) {
        console.error("Error saving YouTube playlist to localStorage:", error);
      }
    }
  }, [playlist]);

  // Save playlist name to localStorage whenever it changes
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

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        if (spotifyPlaylist.length > 0) {
          localStorage.setItem(
            SPOTIFY_PLAYLIST_KEY,
            JSON.stringify(spotifyPlaylist)
          );
        } else {
          localStorage.removeItem(SPOTIFY_PLAYLIST_KEY);
        }
      } catch (error) {
        console.error("Error saving Spotify playlist to localStorage:", error);
      }
    }
  }, [spotifyPlaylist]);

  const handleAddToPlaylist = (video: YoutubeVideo) => {
    // Check if the video is already in the playlist
    const isAlreadyInPlaylist = playlist.some(
      (item) => item.id.videoId === video.id.videoId
    );

    if (!isAlreadyInPlaylist) {
      setPlaylist((prevPlaylist) => [...prevPlaylist, video]);
    }
  };

  return (
    <AppContext.Provider
      value={{
        // YouTube state
        searchResults,
        setSearchResults,
        playlist,
        setPlaylist,
        playlistName,
        setPlaylistName,
        selectedVideo,
        setSelectedVideo,
        nextPageToken,
        setNextPageToken,
        currentSearchTerm,
        setCurrentSearchTerm,
        handleAddToPlaylist,

        // Spotify state
        spotifyPlaylist,
        setSpotifyPlaylist,
        currentSong,
        setCurrentSong,
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
