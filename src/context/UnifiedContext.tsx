"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  memo,
  useEffect,
} from "react";
import { YoutubeVideo } from "@/app/components/Services/YtService";
import { Song, ServiceType } from "@/types/playerTypes";
import { DropResult, DragDropContext as DnDContext } from "@hello-pangea/dnd";

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
  UNIFIED: {
    PLAYLIST_NAME: "unified_playlist_name",
    SAVED_PLAYLISTS: "unified_saved_playlists",
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

// Unified playlist item interface
interface UnifiedPlaylistItem {
  id: string;
  type: ServiceType;
  data: Song | YoutubeVideo;
}

// Unified playlist interface
interface UnifiedPlaylist {
  id: string;
  name: string;
  items: UnifiedPlaylistItem[];
  createdAt: string;
}

// Split context types
interface PlaylistStateType {
  youtube: {
    playlist: YoutubeVideo[];
    playlistName: string;
    savedPlaylists: SavedPlaylist<YoutubeVideo>[];
    searchResults: YoutubeVideo[];
    nextPageToken: string | undefined;
    currentSearchTerm: string;
  };
  spotify: {
    playlist: Song[];
    playlistName: string;
    savedPlaylists: SavedPlaylist<Song>[];
    searchResults: Song[];
  };
  unified: {
    playlist: UnifiedPlaylistItem[];
    playlistName: string;
    savedPlaylists: UnifiedPlaylist[];
    currentPlaylistId: string | null;
    hasUnsavedChanges: boolean;
    isJustSaved: boolean;
  };
}

interface PlaylistActionsType {
  youtube: {
    setPlaylist: (
      playlist: YoutubeVideo[] | ((prev: YoutubeVideo[]) => YoutubeVideo[])
    ) => void;
    setPlaylistName: (name: string) => void;
    addToPlaylist: (video: YoutubeVideo) => void;
    removeFromPlaylist: (videoId: string) => void;
    setSavedPlaylists: React.Dispatch<
      React.SetStateAction<SavedPlaylist<YoutubeVideo>[]>
    >;
    setSearchResults: React.Dispatch<React.SetStateAction<YoutubeVideo[]>>;
    setNextPageToken: React.Dispatch<React.SetStateAction<string | undefined>>;
    setCurrentSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  };
  spotify: {
    setPlaylist: (playlist: Song[] | ((prev: Song[]) => Song[])) => void;
    setPlaylistName: (name: string) => void;
    addToPlaylist: (song: Song) => void;
    removeFromPlaylist: (songId: string) => void;
    setSavedPlaylists: React.Dispatch<
      React.SetStateAction<SavedPlaylist<Song>[]>
    >;
    setSearchResults: React.Dispatch<React.SetStateAction<Song[]>>;
  };
  unified: {
    setPlaylist: (
      playlist:
        | UnifiedPlaylistItem[]
        | ((prev: UnifiedPlaylistItem[]) => UnifiedPlaylistItem[])
    ) => void;
    setPlaylistName: (name: string) => void;
    addToPlaylist: (item: UnifiedPlaylistItem) => void;
    removeFromPlaylist: (itemId: string) => void;
    setSavedPlaylists: React.Dispatch<React.SetStateAction<UnifiedPlaylist[]>>;
    setCurrentPlaylistId: (id: string | null) => void;
    setHasUnsavedChanges: (hasChanges: boolean) => void;
    setJustSaved: (justSaved: boolean) => void;
    createPlaylist: (name: string) => void;
    saveCurrentPlaylist: () => void;
    deletePlaylist: (id: string) => void;
    loadPlaylist: (id: string) => void;
    clearAllPlaylists: () => void;
  };
}

interface PlayerContextType {
  youtube: {
    selectedVideo: string | null;
    setSelectedVideo: (id: string | null) => void;
  };
  spotify: {
    currentSong: Song | null;
    setCurrentSong: (song: Song | null) => void;
  };
}

// Create separate contexts
const PlaylistStateContext = createContext<PlaylistStateType | undefined>(
  undefined
);

const PlaylistActionsContext = createContext<PlaylistActionsType | undefined>(
  undefined
);

// Create contexts
const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

// Create separate hooks for state and actions
export const usePlaylistState = () => {
  const context = useContext(PlaylistStateContext);
  if (!context) {
    throw new Error("usePlaylistState must be used within a PlaylistProvider");
  }
  return context;
};

export const usePlaylistActions = () => {
  const context = useContext(PlaylistActionsContext);
  if (!context) {
    throw new Error(
      "usePlaylistActions must be used within a PlaylistProvider"
    );
  }
  return context;
};

// Create hooks for each context
export const usePlaylistContext = () => {
  const context = useContext(PlaylistStateContext);
  if (!context) {
    throw new Error(
      "usePlaylistContext must be used within a PlaylistProvider"
    );
  }
  return context;
};

export const usePlayerContext = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error("usePlayerContext must be used within a PlayerProvider");
  }
  return context;
};

// Helper function to compare arrays by their IDs
const areArraysEqual = <T extends Song | YoutubeVideo>(
  arr1: T[],
  arr2: T[]
): boolean => {
  if (arr1.length !== arr2.length) return false;
  return arr1.every((item, index) => {
    const item1Id =
      "id" in item && typeof item.id === "object" ? item.id.videoId : item.id;
    const item2Id =
      "id" in arr2[index] && typeof arr2[index].id === "object"
        ? arr2[index].id.videoId
        : arr2[index].id;
    return item1Id === item2Id;
  });
};

// Memoize the state value to prevent unnecessary re-renders
const PlaylistProvider: React.FC<{ children: React.ReactNode }> = memo(
  ({ children }) => {
    // Unified playlist name state
    const [unifiedPlaylistName, setUnifiedPlaylistName] = useState<string>(
      () => {
        if (typeof window !== "undefined") {
          // Clear old separate playlist names to prevent conflicts
          const oldYoutubeName = safeLocalStorage.get(
            STORAGE_KEYS.YOUTUBE.PLAYLIST_NAME
          );
          const oldSpotifyName = safeLocalStorage.get(
            STORAGE_KEYS.SPOTIFY.PLAYLIST_NAME
          );

          if (oldYoutubeName || oldSpotifyName) {
            console.log("Found old separate playlist names, clearing them:", {
              oldYoutubeName,
              oldSpotifyName,
            });
            safeLocalStorage.remove(STORAGE_KEYS.YOUTUBE.PLAYLIST_NAME);
            safeLocalStorage.remove(STORAGE_KEYS.SPOTIFY.PLAYLIST_NAME);
          }

          const unifiedName = safeLocalStorage.get(
            STORAGE_KEYS.UNIFIED.PLAYLIST_NAME
          );
          console.log(
            "Loading unified playlist name from localStorage:",
            unifiedName
          );

          // If there's a saved name but no playlists, clear it and use default
          const savedPlaylists = safeLocalStorage.get(
            STORAGE_KEYS.UNIFIED.SAVED_PLAYLISTS
          );
          const hasPlaylists =
            savedPlaylists && JSON.parse(savedPlaylists).length > 0;

          if (unifiedName && !hasPlaylists) {
            console.log(
              "Found saved playlist name but no playlists, clearing name:",
              unifiedName
            );
            safeLocalStorage.remove(STORAGE_KEYS.UNIFIED.PLAYLIST_NAME);
            return "Create a new playlist";
          }

          return unifiedName || "Create a new playlist";
        }
        return "Create a new playlist";
      }
    );

    // Create a wrapper for setUnifiedPlaylistName to add debugging
    const setUnifiedPlaylistNameWithDebug = useCallback(
      (name: string | ((prev: string) => string)) => {
        const newName =
          typeof name === "function" ? name(unifiedPlaylistName) : name;
        console.log(
          "setUnifiedPlaylistName called with:",
          newName,
          "current name:",
          unifiedPlaylistName
        );
        setUnifiedPlaylistName(newName);
      },
      [unifiedPlaylistName]
    );

    // Save unified playlist name to localStorage whenever it changes
    useEffect(() => {
      console.log("Unified playlist name changed:", unifiedPlaylistName);
      if (typeof window !== "undefined") {
        safeLocalStorage.set(
          STORAGE_KEYS.UNIFIED.PLAYLIST_NAME,
          unifiedPlaylistName
        );
        console.log(
          "Saved unified playlist name to localStorage:",
          unifiedPlaylistName
        );
      }
    }, [unifiedPlaylistName]);

    // YouTube playlist state
    const [youtubePlaylist, setYoutubePlaylist] = useState<YoutubeVideo[]>(
      () => {
        if (typeof window !== "undefined") {
          const saved = safeLocalStorage.get(STORAGE_KEYS.YOUTUBE.PLAYLIST);
          return saved ? JSON.parse(saved) : [];
        }
        return [];
      }
    );

    // Use unified playlist name for YouTube
    const youtubePlaylistName = unifiedPlaylistName;

    const [youtubeSavedPlaylists, setYoutubeSavedPlaylists] = useState<
      SavedPlaylist<YoutubeVideo>[]
    >(() => {
      if (typeof window !== "undefined") {
        const saved = safeLocalStorage.get(
          STORAGE_KEYS.YOUTUBE.SAVED_PLAYLISTS
        );
        return saved ? JSON.parse(saved) : [];
      }
      return [];
    });

    // Spotify playlist state
    const [spotifyPlaylist, setSpotifyPlaylist] = useState<Song[]>(() => {
      if (typeof window !== "undefined") {
        const saved = safeLocalStorage.get(STORAGE_KEYS.SPOTIFY.PLAYLIST);
        return saved ? JSON.parse(saved) : [];
      }
      return [];
    });

    // Use unified playlist name for Spotify
    const spotifyPlaylistName = unifiedPlaylistName;

    const [spotifySavedPlaylists, setSpotifySavedPlaylists] = useState<
      SavedPlaylist<Song>[]
    >(() => {
      if (typeof window !== "undefined") {
        const saved = safeLocalStorage.get(
          STORAGE_KEYS.SPOTIFY.SAVED_PLAYLISTS
        );
        return saved ? JSON.parse(saved) : [];
      }
      return [];
    });

    // Unified playlist state
    const [unifiedPlaylist, setUnifiedPlaylist] = useState<
      UnifiedPlaylistItem[]
    >([]);
    const [unifiedSavedPlaylists, setUnifiedSavedPlaylists] = useState<
      UnifiedPlaylist[]
    >(() => {
      if (typeof window !== "undefined") {
        const saved = safeLocalStorage.get(
          STORAGE_KEYS.UNIFIED.SAVED_PLAYLISTS
        );
        if (saved) {
          try {
            const playlists = JSON.parse(saved);
            console.log(
              "Loading saved playlists from localStorage:",
              playlists
            );
            // Deduplicate playlists by ID
            const uniquePlaylists = playlists.filter(
              (
                playlist: UnifiedPlaylist,
                index: number,
                self: UnifiedPlaylist[]
              ) => index === self.findIndex((p) => p.id === playlist.id)
            );
            if (uniquePlaylists.length !== playlists.length) {
              console.log(
                "Removed duplicate playlists:",
                playlists.length - uniquePlaylists.length
              );
              safeLocalStorage.set(
                STORAGE_KEYS.UNIFIED.SAVED_PLAYLISTS,
                JSON.stringify(uniquePlaylists)
              );
            }
            return uniquePlaylists;
          } catch (error) {
            console.error("Error loading playlists:", error);
            return [];
          }
        }
        return [];
      }
      return [];
    });
    const [currentUnifiedPlaylistId, setCurrentUnifiedPlaylistId] = useState<
      string | null
    >(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
    const [isJustSaved, setIsJustSaved] = useState<boolean>(false);

    // Add search state
    const [youtubeSearchResults, setYoutubeSearchResults] = useState<
      YoutubeVideo[]
    >([]);
    const [youtubeNextPageToken, setYoutubeNextPageToken] = useState<
      string | undefined
    >(undefined);
    const [youtubeCurrentSearchTerm, setYoutubeCurrentSearchTerm] =
      useState<string>("");
    const [spotifySearchResults, setSpotifySearchResults] = useState<Song[]>(
      []
    );

    // Memoize handlers to prevent unnecessary re-renders
    const handleYoutubePlaylistChange = useCallback(
      (
        newPlaylist: YoutubeVideo[] | ((prev: YoutubeVideo[]) => YoutubeVideo[])
      ) => {
        const next =
          typeof newPlaylist === "function"
            ? newPlaylist(youtubePlaylist)
            : newPlaylist;

        // Only update if the playlist actually changed
        if (!areArraysEqual(next, youtubePlaylist)) {
          setYoutubePlaylist(next);
          if (typeof window !== "undefined") {
            safeLocalStorage.set(
              STORAGE_KEYS.YOUTUBE.PLAYLIST,
              JSON.stringify(next)
            );
          }
        }
      },
      [youtubePlaylist]
    );

    const handleSpotifyPlaylistChange = useCallback(
      (newPlaylist: Song[] | ((prev: Song[]) => Song[])) => {
        const next =
          typeof newPlaylist === "function"
            ? newPlaylist(spotifyPlaylist)
            : newPlaylist;

        // Only update if the playlist actually changed
        if (!areArraysEqual(next, spotifyPlaylist)) {
          setSpotifyPlaylist(next);
          if (typeof window !== "undefined") {
            safeLocalStorage.set(
              STORAGE_KEYS.SPOTIFY.PLAYLIST,
              JSON.stringify(next)
            );
          }
        }
      },
      [spotifyPlaylist]
    );

    const addToYoutubePlaylist = useCallback(
      (video: YoutubeVideo) => {
        // Only add if the video isn't already in the playlist
        if (!youtubePlaylist.some((v) => v.id.videoId === video.id.videoId)) {
          handleYoutubePlaylistChange([...youtubePlaylist, video]);
        }
      },
      [youtubePlaylist, handleYoutubePlaylistChange]
    );

    const removeFromYoutubePlaylist = useCallback(
      (videoId: string) => {
        // Only update if the video exists in the playlist
        if (youtubePlaylist.some((v) => v.id.videoId === videoId)) {
          handleYoutubePlaylistChange(
            youtubePlaylist.filter((v) => v.id.videoId !== videoId)
          );
        }
      },
      [youtubePlaylist, handleYoutubePlaylistChange]
    );

    const addToSpotifyPlaylist = useCallback(
      (song: Song) => {
        // Only add if the song isn't already in the playlist
        if (!spotifyPlaylist.some((s) => s.id === song.id)) {
          handleSpotifyPlaylistChange([...spotifyPlaylist, song]);
        }
      },
      [spotifyPlaylist, handleSpotifyPlaylistChange]
    );

    const removeFromSpotifyPlaylist = useCallback(
      (songId: string) => {
        // Only update if the song exists in the playlist
        if (spotifyPlaylist.some((s) => s.id === songId)) {
          handleSpotifyPlaylistChange(
            spotifyPlaylist.filter((s) => s.id !== songId)
          );
        }
      },
      [spotifyPlaylist, handleSpotifyPlaylistChange]
    );

    // Memoize the state value
    const stateValue = useMemo(
      () => ({
        youtube: {
          playlist: youtubePlaylist,
          playlistName: youtubePlaylistName,
          savedPlaylists: youtubeSavedPlaylists,
          searchResults: youtubeSearchResults,
          nextPageToken: youtubeNextPageToken,
          currentSearchTerm: youtubeCurrentSearchTerm,
        },
        spotify: {
          playlist: spotifyPlaylist,
          playlistName: spotifyPlaylistName,
          savedPlaylists: spotifySavedPlaylists,
          searchResults: spotifySearchResults,
        },
        unified: {
          playlist: unifiedPlaylist,
          playlistName: unifiedPlaylistName,
          savedPlaylists: unifiedSavedPlaylists,
          currentPlaylistId: currentUnifiedPlaylistId,
          hasUnsavedChanges: hasUnsavedChanges,
          isJustSaved: isJustSaved,
        },
      }),
      [
        youtubePlaylist,
        youtubePlaylistName,
        youtubeSavedPlaylists,
        youtubeSearchResults,
        youtubeNextPageToken,
        youtubeCurrentSearchTerm,
        spotifyPlaylist,
        spotifyPlaylistName,
        spotifySavedPlaylists,
        spotifySearchResults,
        unifiedPlaylist,
        unifiedPlaylistName,
        unifiedSavedPlaylists,
        currentUnifiedPlaylistId,
        hasUnsavedChanges,
        isJustSaved,
      ]
    );

    // Memoize the actions
    const actionsValue = useMemo(
      () => ({
        youtube: {
          setPlaylist: handleYoutubePlaylistChange,
          setPlaylistName: setUnifiedPlaylistNameWithDebug,
          addToPlaylist: addToYoutubePlaylist,
          removeFromPlaylist: removeFromYoutubePlaylist,
          setSavedPlaylists: setYoutubeSavedPlaylists,
          setSearchResults: setYoutubeSearchResults,
          setNextPageToken: setYoutubeNextPageToken,
          setCurrentSearchTerm: setYoutubeCurrentSearchTerm,
        },
        spotify: {
          setPlaylist: handleSpotifyPlaylistChange,
          setPlaylistName: setUnifiedPlaylistNameWithDebug,
          addToPlaylist: addToSpotifyPlaylist,
          removeFromPlaylist: removeFromSpotifyPlaylist,
          setSavedPlaylists: setSpotifySavedPlaylists,
          setSearchResults: setSpotifySearchResults,
        },
        unified: {
          setPlaylist: setUnifiedPlaylist,
          setPlaylistName: setUnifiedPlaylistNameWithDebug,
          addToPlaylist: (item: UnifiedPlaylistItem) => {
            setUnifiedPlaylist((prev) => [...prev, item]);
            setHasUnsavedChanges(true);
          },
          removeFromPlaylist: (itemId: string) => {
            setUnifiedPlaylist((prev) =>
              prev.filter((item) => item.id !== itemId)
            );
            setHasUnsavedChanges(true);
          },
          setSavedPlaylists: setUnifiedSavedPlaylists,
          setCurrentPlaylistId: setCurrentUnifiedPlaylistId,
          setHasUnsavedChanges: setHasUnsavedChanges,
          setJustSaved: setIsJustSaved,
          createPlaylist: (name: string) => {
            const newPlaylist: UnifiedPlaylist = {
              id: Date.now().toString(),
              name,
              items: [],
              createdAt: new Date().toISOString(),
            };
            console.log("Creating new empty playlist:", newPlaylist);
            setUnifiedSavedPlaylists((prev) => {
              const updated = [...prev, newPlaylist];
              console.log("Updated saved playlists after create:", updated);
              return updated;
            });
            setCurrentUnifiedPlaylistId(newPlaylist.id);
            // Clear current playlist and set the new name - don't copy current items
            setUnifiedPlaylist([]);
            setUnifiedPlaylistNameWithDebug(name);
            setHasUnsavedChanges(false);
            console.log("Created new empty playlist:", name);
          },
          saveCurrentPlaylist: () => {
            if (unifiedPlaylist.length > 0 && currentUnifiedPlaylistId) {
              // Update the existing playlist instead of creating a new one
              setUnifiedSavedPlaylists((prev) => {
                const updated = prev.map((playlist) =>
                  playlist.id === currentUnifiedPlaylistId
                    ? { ...playlist, items: [...unifiedPlaylist] }
                    : playlist
                );
                console.log(
                  "Updated existing playlist:",
                  currentUnifiedPlaylistId
                );
                return updated;
              });
              setHasUnsavedChanges(false);
              setIsJustSaved(true);
              // Reset the "saved" state after 2 seconds
              setTimeout(() => setIsJustSaved(false), 2000);
            } else if (unifiedPlaylist.length > 0) {
              // Create a new playlist if no current playlist is selected
              const newPlaylist: UnifiedPlaylist = {
                id: Date.now().toString(),
                name: unifiedPlaylistName,
                items: [...unifiedPlaylist],
                createdAt: new Date().toISOString(),
              };
              console.log("Creating new playlist:", newPlaylist);
              setUnifiedSavedPlaylists((prev) => {
                const updated = [...prev, newPlaylist];
                console.log("Updated saved playlists:", updated);
                return updated;
              });
              setCurrentUnifiedPlaylistId(newPlaylist.id);
              setHasUnsavedChanges(false);
              setIsJustSaved(true);
              // Reset the "saved" state after 2 seconds
              setTimeout(() => setIsJustSaved(false), 2000);
            }
          },
          deletePlaylist: (id: string) => {
            setUnifiedSavedPlaylists(
              unifiedSavedPlaylists.filter((playlist) => playlist.id !== id)
            );
            if (currentUnifiedPlaylistId === id) {
              setCurrentUnifiedPlaylistId(null);
              setHasUnsavedChanges(false);
            }
          },
          loadPlaylist: (id: string) => {
            const playlist = unifiedSavedPlaylists.find((p) => p.id === id);
            if (playlist) {
              console.log(
                "Loading playlist:",
                playlist.name,
                "with",
                playlist.items.length,
                "items"
              );
              console.log("Playlist items:", playlist.items);
              setUnifiedPlaylist([...playlist.items]);
              setUnifiedPlaylistNameWithDebug(playlist.name);
              setCurrentUnifiedPlaylistId(playlist.id);
              setHasUnsavedChanges(false);
              console.log(
                "Loaded playlist:",
                playlist.name,
                "with",
                playlist.items.length,
                "items"
              );
            } else {
              console.warn("Playlist not found:", id);
            }
          },
          clearAllPlaylists: () => {
            setUnifiedPlaylist([]);
            setUnifiedSavedPlaylists([]);
            setCurrentUnifiedPlaylistId(null);
            setUnifiedPlaylistNameWithDebug("Create a new playlist");
            setHasUnsavedChanges(false);
            // Clear from localStorage as well
            if (typeof window !== "undefined") {
              safeLocalStorage.remove(STORAGE_KEYS.UNIFIED.PLAYLIST_NAME);
              safeLocalStorage.remove(STORAGE_KEYS.UNIFIED.SAVED_PLAYLISTS);
            }
          },
        },
      }),
      [
        handleYoutubePlaylistChange,
        handleSpotifyPlaylistChange,
        addToYoutubePlaylist,
        removeFromYoutubePlaylist,
        addToSpotifyPlaylist,
        removeFromSpotifyPlaylist,
        setYoutubeSearchResults,
        setYoutubeNextPageToken,
        setYoutubeCurrentSearchTerm,
        setSpotifySearchResults,
        setUnifiedPlaylistNameWithDebug,
        setUnifiedPlaylist,
        setUnifiedSavedPlaylists,
        setCurrentUnifiedPlaylistId,
        setHasUnsavedChanges,
        setIsJustSaved,
      ]
    );

    return (
      <PlaylistStateContext.Provider value={stateValue}>
        <PlaylistActionsContext.Provider value={actionsValue}>
          {children}
        </PlaylistActionsContext.Provider>
      </PlaylistStateContext.Provider>
    );
  }
);

PlaylistProvider.displayName = "PlaylistProvider";

const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // YouTube player state
  const [searchResults, setSearchResults] = useState<YoutubeVideo[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(
    undefined
  );
  const [currentSearchTerm, setCurrentSearchTerm] = useState<string>("");

  // Spotify player state
  const [spotifySearchResults, setSpotifySearchResults] = useState<Song[]>([]);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);

  // Spotify token refresh and logout functions
  const refreshSpotifyToken = useCallback(async () => {
    try {
      const response = await fetch("/api/spotify/refresh");
      if (!response.ok) throw new Error("Failed to refresh token");
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error refreshing Spotify token:", error);
      throw error;
    }
  }, []);

  const handleSpotifyLogout = useCallback(async () => {
    const currentSetCurrentSong = setCurrentSong;
    const currentSetSpotifySearchResults = setSpotifySearchResults;
    try {
      const response = await fetch("/api/spotify/logout");
      if (!response.ok) throw new Error("Failed to logout");
      currentSetCurrentSong(null);
      currentSetSpotifySearchResults([]);
    } catch (error) {
      console.error("Error logging out from Spotify:", error);
      throw error;
    }
  }, []);

  const playerValue = useMemo(
    () => ({
      youtube: {
        searchResults,
        setSearchResults,
        selectedVideo,
        setSelectedVideo,
        nextPageToken,
        setNextPageToken,
        currentSearchTerm,
        setCurrentSearchTerm,
      },
      spotify: {
        searchResults: spotifySearchResults,
        setSearchResults: setSpotifySearchResults,
        currentSong,
        setCurrentSong,
        refreshToken: refreshSpotifyToken,
        logout: handleSpotifyLogout,
      },
    }),
    [
      searchResults,
      selectedVideo,
      nextPageToken,
      currentSearchTerm,
      spotifySearchResults,
      currentSong,
      refreshSpotifyToken,
      handleSpotifyLogout,
    ]
  );

  return (
    <PlayerContext.Provider value={playerValue}>
      {children}
    </PlayerContext.Provider>
  );
};

// Create a separate component for drag-and-drop functionality
const DragDropWrapper: React.FC<{ children: React.ReactNode }> = memo(
  ({ children }) => {
    const { youtube, spotify, unified } = useUnifiedContext();

    // Memoize the onDragEnd handler to prevent unnecessary re-renders
    const onDragEnd = useCallback(
      (result: DropResult) => {
        if (!result.destination) return;

        const { source, destination, draggableId } = result;

        // Skip if source and destination are the same
        if (
          source.droppableId === destination.droppableId &&
          source.index === destination.index
        ) {
          return;
        }

        // Handle reordering within unified playlist
        if (
          destination.droppableId === "unified-playlist" &&
          source.droppableId === "unified-playlist"
        ) {
          const sourceIndex = source.index;
          const destIndex = destination.index;

          // Skip if indices are the same
          if (sourceIndex === destIndex) return;

          const newPlaylist = [...unified.playlist];
          const [movedItem] = newPlaylist.splice(sourceIndex, 1);
          newPlaylist.splice(destIndex, 0, movedItem);
          unified.setPlaylist(newPlaylist);
          unified.setHasUnsavedChanges(true);
          return;
        }

        // Handle dropping to player
        if (destination.droppableId === "unified-player") {
          const [service, id] = draggableId.split("-");
          console.log("Dropping to player:", { draggableId, service, id });
          if (!service || !id) {
            console.warn("Invalid draggableId format:", draggableId);
            return;
          }

          if (service === ServiceType.Youtube) {
            const video =
              youtube.searchResults.find((v) => v.id.videoId === id) ||
              (unified.playlist.find(
                (item) => item.id === id && item.type === ServiceType.Youtube
              )?.data as YoutubeVideo);
            console.log("Found YouTube video:", video);
            if (video && youtube.selectedVideo !== id) {
              console.log("Setting YouTube video:", id);
              youtube.setSelectedVideo(id);
              if (spotify.currentSong) {
                spotify.setCurrentSong(null);
              }
            }
          } else if (service === ServiceType.Spotify) {
            const song =
              spotify.searchResults.find((s) => s.id === id) ||
              (unified.playlist.find(
                (item) => item.id === id && item.type === ServiceType.Spotify
              )?.data as Song);
            console.log("Found Spotify song:", song);
            if (song && spotify.currentSong?.id !== song.id) {
              console.log("Setting Spotify song:", id);
              spotify.setCurrentSong(song);
              if (youtube.selectedVideo) {
                youtube.setSelectedVideo(null);
              }
            }
          }
          return;
        }

        // Handle dropping from search to playlist
        if (
          destination.droppableId === "unified-playlist" &&
          source.droppableId !== "unified-playlist"
        ) {
          const [service, id] = draggableId.split("-");

          if (service === ServiceType.Youtube) {
            const video = youtube.searchResults.find(
              (v) => v.id.videoId === id
            );
            if (
              video &&
              !unified.playlist.some(
                (item) => item.id === id && item.type === ServiceType.Youtube
              )
            ) {
              unified.addToPlaylist({
                id: video.id.videoId,
                type: ServiceType.Youtube,
                data: video,
              });
            }
          } else if (service === ServiceType.Spotify) {
            const song = spotify.searchResults.find((s) => s.id === id);
            if (
              song &&
              !unified.playlist.some(
                (item) => item.id === id && item.type === ServiceType.Spotify
              )
            ) {
              unified.addToPlaylist({
                id: song.id,
                type: ServiceType.Spotify,
                data: song,
              });
            }
          }
        }
      },
      [youtube, spotify, unified]
    );

    return <DnDContext onDragEnd={onDragEnd}>{children}</DnDContext>;
  }
);

DragDropWrapper.displayName = "DragDropWrapper";

// Main provider that combines all providers
export const UnifiedProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <PlaylistProvider>
      <PlayerProvider>
        <DragDropWrapper>{children}</DragDropWrapper>
      </PlayerProvider>
    </PlaylistProvider>
  );
};

// Update the useUnifiedContext hook to not depend on useDragDropContext
export const useUnifiedContext = () => {
  const state = usePlaylistState();
  const actions = usePlaylistActions();
  const playerContext = usePlayerContext();

  if (!playerContext) {
    throw new Error("useUnifiedContext must be used within a PlayerProvider");
  }

  return {
    youtube: {
      ...state.youtube,
      ...actions.youtube,
      ...playerContext.youtube,
    },
    spotify: {
      ...state.spotify,
      ...actions.spotify,
      ...playerContext.spotify,
    },
    unified: {
      ...state.unified,
      ...actions.unified,
    },
  };
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
