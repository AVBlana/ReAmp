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
import { YoutubeVideo } from "@/app/types/youtubeTypes";
import { Song, ServiceType } from "@/app/types/playerTypes";
import { DropResult, DragDropContext as DnDContext } from "@hello-pangea/dnd";

// Storage keys - simplified to only what's needed
const STORAGE_KEYS = {
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

// Simplified context types - only what's actually used
interface UnifiedContextType {
  // YouTube
  youtube: {
    searchResults: YoutubeVideo[];
    nextPageToken: string | undefined;
    currentSearchTerm: string;
    selectedVideo: string | null;
    setSearchResults: React.Dispatch<React.SetStateAction<YoutubeVideo[]>>;
    setNextPageToken: React.Dispatch<React.SetStateAction<string | undefined>>;
    setCurrentSearchTerm: React.Dispatch<React.SetStateAction<string>>;
    setSelectedVideo: (id: string | null) => void;
  };

  // Spotify
  spotify: {
    searchResults: Song[];
    currentSong: Song | null;
    setSearchResults: React.Dispatch<React.SetStateAction<Song[]>>;
    setCurrentSong: (song: Song | null) => void;
    refreshToken: () => Promise<{ success: boolean }>;
    logout: () => Promise<void>;
  };

  // Unified playlist
  unified: {
    playlist: UnifiedPlaylistItem[];
    playlistName: string;
    savedPlaylists: UnifiedPlaylist[];
    currentPlaylistId: string | null;
    hasUnsavedChanges: boolean;
    isJustSaved: boolean;
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

// Create single context
const UnifiedContext = createContext<UnifiedContextType | undefined>(undefined);

// Main provider component
const UnifiedProvider: React.FC<{ children: React.ReactNode }> = memo(
  ({ children }) => {
    // Unified playlist state
    const [unifiedPlaylist, setUnifiedPlaylist] = useState<
      UnifiedPlaylistItem[]
    >([]);
    const [unifiedPlaylistName, setUnifiedPlaylistName] = useState<string>(
      "Create a new playlist"
    );
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
            // Deduplicate playlists by ID
            return playlists.filter(
              (
                playlist: UnifiedPlaylist,
                index: number,
                self: UnifiedPlaylist[]
              ) => index === self.findIndex((p) => p.id === playlist.id)
            );
          } catch (error) {
            console.error("Error loading playlists:", error);
            return [];
          }
        }
      }
      return [];
    });
    const [currentUnifiedPlaylistId, setCurrentUnifiedPlaylistId] = useState<
      string | null
    >(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
    const [isJustSaved, setIsJustSaved] = useState<boolean>(false);

    // YouTube state
    const [youtubeSearchResults, setYoutubeSearchResults] = useState<
      YoutubeVideo[]
    >([]);
    const [youtubeNextPageToken, setYoutubeNextPageToken] = useState<
      string | undefined
    >(undefined);
    const [youtubeCurrentSearchTerm, setYoutubeCurrentSearchTerm] =
      useState<string>("");
    const [youtubeSelectedVideo, setYoutubeSelectedVideo] = useState<
      string | null
    >(null);

    // Spotify state
    const [spotifySearchResults, setSpotifySearchResults] = useState<Song[]>(
      []
    );
    const [spotifyCurrentSong, setSpotifyCurrentSong] = useState<Song | null>(
      null
    );

    // Load unified playlist name from localStorage
    useEffect(() => {
      if (typeof window !== "undefined") {
        const unifiedName = safeLocalStorage.get(
          STORAGE_KEYS.UNIFIED.PLAYLIST_NAME
        );
        if (unifiedName && unifiedName !== "Create a new playlist") {
          setUnifiedPlaylistName(unifiedName);
        }
      }
    }, []);

    // Save unified playlist name to localStorage
    useEffect(() => {
      if (typeof window !== "undefined") {
        safeLocalStorage.set(
          STORAGE_KEYS.UNIFIED.PLAYLIST_NAME,
          unifiedPlaylistName
        );
      }
    }, [unifiedPlaylistName]);

    // Spotify token refresh and logout functions - now handled by NextAuth
    const refreshSpotifyToken = useCallback(async (): Promise<{
      success: boolean;
    }> => {
      // This is now handled automatically by NextAuth
      // The token refresh happens server-side in the auth callbacks
      console.log("Token refresh is now handled automatically by NextAuth");
      return { success: true };
    }, []);

    const handleSpotifyLogout = useCallback(async () => {
      // This is now handled by the AuthContext
      console.log("Logout is now handled by AuthContext");
      setSpotifyCurrentSong(null);
      setSpotifySearchResults([]);
    }, []);

    // Memoize the context value
    const contextValue = useMemo(
      () => ({
        youtube: {
          searchResults: youtubeSearchResults,
          nextPageToken: youtubeNextPageToken,
          currentSearchTerm: youtubeCurrentSearchTerm,
          selectedVideo: youtubeSelectedVideo,
          setSearchResults: setYoutubeSearchResults,
          setNextPageToken: setYoutubeNextPageToken,
          setCurrentSearchTerm: setYoutubeCurrentSearchTerm,
          setSelectedVideo: setYoutubeSelectedVideo,
        },
        spotify: {
          searchResults: spotifySearchResults,
          currentSong: spotifyCurrentSong,
          setSearchResults: setSpotifySearchResults,
          setCurrentSong: setSpotifyCurrentSong,
          refreshToken: refreshSpotifyToken,
          logout: handleSpotifyLogout,
        },
        unified: {
          playlist: unifiedPlaylist,
          playlistName: unifiedPlaylistName,
          savedPlaylists: unifiedSavedPlaylists,
          currentPlaylistId: currentUnifiedPlaylistId,
          hasUnsavedChanges: hasUnsavedChanges,
          isJustSaved: isJustSaved,
          setPlaylist: setUnifiedPlaylist,
          setPlaylistName: (name: string) => {
            setUnifiedPlaylistName(name);
            // Mark as having unsaved changes when name is edited
            setHasUnsavedChanges(true);
            // Save the name to localStorage immediately
            if (typeof window !== "undefined") {
              safeLocalStorage.set(STORAGE_KEYS.UNIFIED.PLAYLIST_NAME, name);
            }
          },
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
            setUnifiedSavedPlaylists((prev) => [...prev, newPlaylist]);
            setCurrentUnifiedPlaylistId(newPlaylist.id);
            setUnifiedPlaylist([]);
            setUnifiedPlaylistName(name);
            setHasUnsavedChanges(false);
          },
          saveCurrentPlaylist: () => {
            // Use current state values instead of refs for reliability
            if (unifiedPlaylist.length > 0 && currentUnifiedPlaylistId) {
              // Update existing playlist
              setUnifiedSavedPlaylists((prevPlaylists) => {
                const updated = prevPlaylists.map((playlist) =>
                  playlist.id === currentUnifiedPlaylistId
                    ? {
                        ...playlist,
                        items: [...unifiedPlaylist],
                        name: unifiedPlaylistName,
                      }
                    : playlist
                );
                // Save to localStorage immediately
                if (typeof window !== "undefined") {
                  safeLocalStorage.set(
                    STORAGE_KEYS.UNIFIED.SAVED_PLAYLISTS,
                    JSON.stringify(updated)
                  );
                }
                return updated;
              });
              setHasUnsavedChanges(false);
              setIsJustSaved(true);
              setTimeout(() => setIsJustSaved(false), 2000);
            } else if (unifiedPlaylist.length > 0) {
              // Create new playlist
              const newPlaylist: UnifiedPlaylist = {
                id: Date.now().toString(),
                name: unifiedPlaylistName,
                items: [...unifiedPlaylist],
                createdAt: new Date().toISOString(),
              };
              setUnifiedSavedPlaylists((prevPlaylists) => {
                const updated = [...prevPlaylists, newPlaylist];
                if (typeof window !== "undefined") {
                  safeLocalStorage.set(
                    STORAGE_KEYS.UNIFIED.SAVED_PLAYLISTS,
                    JSON.stringify(updated)
                  );
                }
                return updated;
              });
              setCurrentUnifiedPlaylistId(newPlaylist.id);
              setHasUnsavedChanges(false);
              setIsJustSaved(true);
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
              setUnifiedPlaylist([...playlist.items]);
              setUnifiedPlaylistName(playlist.name);
              setCurrentUnifiedPlaylistId(playlist.id);
              setHasUnsavedChanges(false);
            }
          },
          clearAllPlaylists: () => {
            setUnifiedPlaylist([]);
            setUnifiedSavedPlaylists([]);
            setCurrentUnifiedPlaylistId(null);
            setUnifiedPlaylistName("Create a new playlist");
            setHasUnsavedChanges(false);
            if (typeof window !== "undefined") {
              safeLocalStorage.remove(STORAGE_KEYS.UNIFIED.PLAYLIST_NAME);
              safeLocalStorage.remove(STORAGE_KEYS.UNIFIED.SAVED_PLAYLISTS);
            }
          },
        },
      }),
      [
        youtubeSearchResults,
        youtubeNextPageToken,
        youtubeCurrentSearchTerm,
        youtubeSelectedVideo,
        spotifySearchResults,
        spotifyCurrentSong,
        unifiedPlaylist,
        unifiedPlaylistName,
        unifiedSavedPlaylists,
        currentUnifiedPlaylistId,
        hasUnsavedChanges,
        isJustSaved,
        refreshSpotifyToken,
        handleSpotifyLogout,
      ]
    );

    return (
      <UnifiedContext.Provider value={contextValue}>
        <DragDropWrapper>{children}</DragDropWrapper>
      </UnifiedContext.Provider>
    );
  }
);

UnifiedProvider.displayName = "UnifiedProvider";

// Drag and drop wrapper component
const DragDropWrapper: React.FC<{ children: React.ReactNode }> = memo(
  ({ children }) => {
    const { youtube, spotify, unified } = useUnifiedContext();

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

          if (!service || !id) return;

          if (service === ServiceType.Youtube) {
            const video =
              youtube.searchResults.find((v) => v.id.videoId === id) ||
              (unified.playlist.find(
                (item) => item.id === id && item.type === ServiceType.Youtube
              )?.data as YoutubeVideo);
            if (video && youtube.selectedVideo !== id) {
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
            if (song && spotify.currentSong?.id !== song.id) {
              spotify.setCurrentSong(song);
              if (youtube.selectedVideo) {
                youtube.setSelectedVideo(null);
              }
            }
          }
          return;
        }

        // Handle dropping to DJ players
        if (destination.droppableId.startsWith("dj-player-")) {
          const playerId = destination.droppableId.split("-")[2] as "A" | "B";
          const [service, id] = draggableId.split("-");

          if (!service || !id) return;

          // Dispatch custom event for DJ player to handle
          const dropEvent = new CustomEvent("dj-player-drop", {
            detail: { playerId, service, id, draggableId },
          });
          window.dispatchEvent(dropEvent);
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

// Main hook for using the unified context
export const useUnifiedContext = () => {
  const context = useContext(UnifiedContext);
  if (!context) {
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

export { UnifiedProvider };
