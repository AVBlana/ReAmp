"use client";

import { FaMusic, FaPlus, FaTrash, FaSave } from "react-icons/fa";
import Image from "next/image";
import { useUnifiedContext } from "@/context/UnifiedContext";
import { useState, useEffect, useCallback, useMemo } from "react";
import { ServiceType, Song } from "@/types/playerTypes";
import { YoutubeVideo } from "../Services/YtService";

// Storage key for unified playlists
const STORAGE_KEY = "unified_saved_playlists";

// Helper function to safely handle localStorage operations
const safeLocalStorage = {
  get: (key: string) => {
    if (typeof window === "undefined") return null;
    try {
      const value = localStorage.getItem(key);
      console.log(
        `Reading from localStorage (${key}):`,
        value ? "found data" : "no data"
      );
      return value;
    } catch (error) {
      console.error(`Error reading from localStorage (${key}):`, error);
      return null;
    }
  },
  set: (key: string, value: string) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(key, value);
      console.log(
        `Writing to localStorage (${key}):`,
        value ? "data saved" : "no data"
      );
    } catch (error) {
      console.error(`Error writing to localStorage (${key}):`, error);
    }
  },
  clear: (key: string) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(key);
      // Double-check the clear operation
      if (localStorage.getItem(key) !== null) {
        console.warn("First clear attempt failed, trying again...");
        localStorage.removeItem(key);
      }
      console.log(`Cleared localStorage key: ${key}`);
    } catch (error) {
      console.error(`Error clearing localStorage (${key}):`, error);
    }
  },
};

// Modify the forceResetStorage function
const forceResetStorage = () => {
  console.log("Force resetting storage...");
  // Clear localStorage
  safeLocalStorage.clear(STORAGE_KEY);
  // Double check and clear again to ensure it's really gone
  if (safeLocalStorage.get(STORAGE_KEY)) {
    console.warn("Storage not cleared properly, trying again...");
    safeLocalStorage.clear(STORAGE_KEY);
  }

  // Reset the current playlist state in the context
  if (typeof window !== "undefined") {
    // Dispatch a custom event to notify components to reset their state
    window.dispatchEvent(new CustomEvent("resetPlaylistState"));
  }

  // Force reload the page to ensure clean state
  window.location.reload();
};

interface UnifiedPlaylistItem {
  id: string;
  type: ServiceType;
  data: Song | YoutubeVideo;
}

interface SavedUnifiedPlaylist {
  id: string;
  name: string;
  items: UnifiedPlaylistItem[];
  createdAt: string;
}

interface UnifiedPlaylistLibraryProps {
  theme: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

// Create a loading component
const LoadingComponent = () => {
  console.log("Rendering LoadingComponent");
  return (
    <div className="flex flex-row lg:flex-col items-center lg:items-start space-x-2 lg:space-x-0 lg:space-y-2 min-h-[200px]">
      <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center text-gray-400 bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-lg backdrop-blur-sm border border-white/5 animate-pulse">
        <FaMusic size={20} />
      </div>
    </div>
  );
};

// Helper function to deduplicate playlists
const deduplicatePlaylists = (
  playlists: SavedUnifiedPlaylist[]
): SavedUnifiedPlaylist[] => {
  const seen = new Set<string>();
  return playlists.filter((playlist) => {
    if (seen.has(playlist.id)) {
      console.warn(
        `Removing duplicate playlist: ${playlist.id} - ${playlist.name}`
      );
      return false;
    }
    seen.add(playlist.id);
    return true;
  });
};

// Helper function to validate playlist
const validatePlaylist = (
  playlist: unknown
): playlist is SavedUnifiedPlaylist => {
  if (!playlist || typeof playlist !== "object") return false;

  const p = playlist as Partial<SavedUnifiedPlaylist>;
  if (!p.id || typeof p.id !== "string") return false;
  if (!p.name || typeof p.name !== "string") return false;
  if (!Array.isArray(p.items)) return false;

  // Validate items
  const validItems = p.items.filter((item) => {
    if (!item || typeof item !== "object") return false;
    const typedItem = item as Partial<UnifiedPlaylistItem>;
    return (
      typeof typedItem.id === "string" &&
      (typedItem.type === ServiceType.Spotify ||
        typedItem.type === ServiceType.Youtube) &&
      typeof typedItem.data === "object"
    );
  });

  return validItems.length === p.items.length;
};

// Separate the playlist state management
const usePlaylistState = () => {
  const [playlistMap, setPlaylistMap] = useState<
    Map<string, SavedUnifiedPlaylist>
  >(new Map());
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSavedState, setLastSavedState] = useState<string>("");
  const [mounted, setMounted] = useState(false);

  // Convert Map to ordered array for UI
  const savedPlaylists = useMemo(
    () => Array.from(playlistMap.values()),
    [playlistMap]
  );

  // Reset playlists function
  const resetPlaylists = useCallback(() => {
    console.log("Resetting playlists...");
    setPlaylistMap(new Map());
    setActivePlaylistId(null);
    setIsCreatingNew(false);
    setLastSavedState("");
    safeLocalStorage.clear(STORAGE_KEY);
    setIsInitialized(true);
    setIsLoading(false);
  }, []);

  // Load playlists function
  const loadPlaylists = useCallback(() => {
    console.log("Loading playlists from storage...", {
      mounted,
      isInitialized,
      isLoading,
    });

    if (!mounted) {
      console.log("Not mounted yet, skipping load");
      return;
    }

    setIsLoading(true);

    try {
      const savedPlaylistsStr = safeLocalStorage.get(STORAGE_KEY);
      console.log("Loaded from storage:", savedPlaylistsStr);

      if (!savedPlaylistsStr || savedPlaylistsStr === "[]") {
        console.log("No saved playlists found");
        setPlaylistMap(new Map());
        setIsInitialized(true);
        setIsLoading(false);
        return;
      }

      const parsed = JSON.parse(savedPlaylistsStr);
      console.log("Parsed playlists:", parsed);

      if (!Array.isArray(parsed)) {
        console.error("Invalid playlist data: not an array");
        resetPlaylists();
        return;
      }

      // Validate and deduplicate playlists
      const validPlaylists = parsed
        .filter(validatePlaylist)
        .map((playlist) => ({
          ...playlist,
          name: playlist.name || "Unnamed Playlist",
          createdAt: playlist.createdAt || new Date().toISOString(),
        }));

      const deduplicatedPlaylists = deduplicatePlaylists(validPlaylists);

      if (deduplicatedPlaylists.length === 0) {
        console.log("No valid playlists found after deduplication");
        resetPlaylists();
        return;
      }

      // Create new map with deduplicated playlists
      const newMap = new Map<string, SavedUnifiedPlaylist>();
      deduplicatedPlaylists.forEach((playlist) => {
        newMap.set(playlist.id, playlist);
      });

      console.log(`Loaded ${newMap.size} unique playlists after deduplication`);
      console.log("Final playlist map:", Array.from(newMap.entries()));

      setPlaylistMap(newMap);
      setLastSavedState(savedPlaylistsStr);
    } catch (error) {
      console.error("Error parsing saved playlists:", error);
      resetPlaylists();
    } finally {
      setIsInitialized(true);
      setIsLoading(false);
    }
  }, [mounted, resetPlaylists]);

  // Save playlists function
  const savePlaylists = useCallback(
    (map: Map<string, SavedUnifiedPlaylist>) => {
      if (!mounted) {
        console.log("Not mounted yet, skipping save");
        return;
      }

      try {
        const playlistsArray = Array.from(map.values());
        // Deduplicate before saving
        const deduplicatedPlaylists = deduplicatePlaylists(playlistsArray);
        const serializedState = JSON.stringify(deduplicatedPlaylists);
        console.log("Saving playlists:", deduplicatedPlaylists);

        if (serializedState !== lastSavedState) {
          console.log(
            `Saving ${deduplicatedPlaylists.length} unique playlists to storage:`,
            deduplicatedPlaylists.map((p) => p.id)
          );
          safeLocalStorage.set(STORAGE_KEY, serializedState);
          setLastSavedState(serializedState);
        } else {
          console.log("No changes to save");
        }
      } catch (error) {
        console.error("Error saving playlists:", error);
      }
    },
    [mounted, lastSavedState]
  );

  // Set mounted state
  useEffect(() => {
    console.log("Setting mounted state to true");
    setMounted(true);
    return () => {
      console.log("Setting mounted state to false");
      setMounted(false);
    };
  }, []);

  // Load playlists on mount
  useEffect(() => {
    if (mounted && !isInitialized) {
      console.log("Mount effect triggered, loading playlists");
      loadPlaylists();
    }
  }, [mounted, isInitialized, loadPlaylists]);

  // Save playlists when they change
  useEffect(() => {
    if (mounted && isInitialized && !isLoading) {
      console.log("Playlist map changed, saving...");
      savePlaylists(playlistMap);
    }
  }, [mounted, playlistMap, savePlaylists, isInitialized, isLoading]);

  return {
    savedPlaylists,
    activePlaylistId,
    isCreatingNew,
    isLoading,
    mounted,
    setActivePlaylistId,
    setIsCreatingNew,
    updatePlaylist: useCallback(
      (playlistId: string, updates: Partial<SavedUnifiedPlaylist>) => {
        setPlaylistMap((prev) => {
          const playlist = prev.get(playlistId);
          if (!playlist) {
            console.warn(`Playlist not found: ${playlistId}`);
            return prev;
          }
          const updatedPlaylist = { ...playlist, ...updates };
          const newMap = new Map(prev);
          newMap.set(playlistId, updatedPlaylist);
          setTimeout(() => savePlaylists(newMap), 0);
          return newMap;
        });
      },
      [savePlaylists]
    ),
    addPlaylist: useCallback(
      (playlist: SavedUnifiedPlaylist) => {
        setPlaylistMap((prev) => {
          const newMap = new Map(prev);
          if (prev.has(playlist.id)) {
            const existing = prev.get(playlist.id)!;
            newMap.set(playlist.id, { ...existing, ...playlist });
          } else {
            newMap.set(playlist.id, playlist);
          }
          setTimeout(() => savePlaylists(newMap), 0);
          return newMap;
        });
      },
      [savePlaylists]
    ),
    deletePlaylist: useCallback(
      (playlistId: string) => {
        setPlaylistMap((prev) => {
          if (!prev.has(playlistId)) {
            console.warn(`Playlist not found for deletion: ${playlistId}`);
            return prev;
          }
          const newMap = new Map(prev);
          newMap.delete(playlistId);
          if (newMap.size === 0) {
            safeLocalStorage.clear(STORAGE_KEY);
          } else {
            setTimeout(() => savePlaylists(newMap), 0);
          }
          return newMap;
        });
      },
      [savePlaylists]
    ),
    resetPlaylists,
  };
};

// Main component
const UnifiedPlaylistLibraryContent: React.FC<
  UnifiedPlaylistLibraryProps
> = () => {
  console.log("Rendering UnifiedPlaylistLibraryContent");
  const { youtube, spotify } = useUnifiedContext();
  const {
    savedPlaylists,
    activePlaylistId,
    isCreatingNew,
    mounted,
    setActivePlaylistId,
    setIsCreatingNew,
    addPlaylist,
    deletePlaylist,
  } = usePlaylistState();

  // Add state for tracking changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Track changes to the current playlist
  useEffect(() => {
    if (activePlaylistId) {
      const currentSpotifyItems = spotify.playlist.map((song: Song) => ({
        id: song.id,
        type: ServiceType.Spotify,
        data: song,
      }));

      const currentYoutubeItems = youtube.playlist.map(
        (video: YoutubeVideo) => ({
          id: video.id.videoId,
          type: ServiceType.Youtube,
          data: video,
        })
      );

      const currentItems = [...currentSpotifyItems, ...currentYoutubeItems];
      const savedPlaylist = savedPlaylists.find(
        (p) => p.id === activePlaylistId
      );

      if (savedPlaylist) {
        const hasChanges =
          currentItems.length !== savedPlaylist.items.length ||
          currentItems.some(
            (item, index) => item.id !== savedPlaylist.items[index]?.id
          ) ||
          spotify.playlistName !== savedPlaylist.name;

        setHasUnsavedChanges(hasChanges);
        console.log("Playlist changes detected:", hasChanges);
      }
    } else {
      setHasUnsavedChanges(false);
    }
  }, [
    activePlaylistId,
    spotify.playlist,
    youtube.playlist,
    spotify.playlistName,
    savedPlaylists,
  ]);

  // Add effect to handle reset event
  useEffect(() => {
    const handleReset = () => {
      console.log("Resetting playlist state in component");
      spotify.setPlaylist([]);
      youtube.setPlaylist([]);
      spotify.setPlaylistName("New Playlist");
      youtube.setPlaylistName("New Playlist");
    };

    window.addEventListener("resetPlaylistState", handleReset);
    return () => window.removeEventListener("resetPlaylistState", handleReset);
  }, [spotify, youtube]);

  // Handle playlist click
  const handlePlaylistClick = useCallback(
    (playlist: SavedUnifiedPlaylist) => {
      console.log("Clicking playlist:", playlist.id);
      if (isCreatingNew) return;

      try {
        if (activePlaylistId === playlist.id) return;

        // Only save current playlist if it has items and we're not already viewing a saved playlist
        if (
          !activePlaylistId &&
          (spotify.playlist.length > 0 || youtube.playlist.length > 0)
        ) {
          const currentSpotifyItems = spotify.playlist.map((song) => ({
            id: song.id,
            type: ServiceType.Spotify,
            data: song,
          }));

          const currentYoutubeItems = youtube.playlist.map((video) => ({
            id: video.id.videoId,
            type: ServiceType.Youtube,
            data: video,
          }));

          const currentItems = [...currentSpotifyItems, ...currentYoutubeItems];

          // Only save if we have items and we're not clicking the current playlist
          if (currentItems.length > 0 && playlist.id !== "current") {
            const newPlaylistId = `playlist_${Date.now()}_${Math.random()
              .toString(36)
              .substr(2, 9)}`;
            const newPlaylist: SavedUnifiedPlaylist = {
              id: newPlaylistId,
              name: spotify.playlistName || "Unnamed Playlist",
              items: currentItems,
              createdAt: new Date().toISOString(),
            };
            console.log(
              "Saving current playlist before switching:",
              newPlaylist
            );
            addPlaylist(newPlaylist);
          }
        }

        // Load the selected playlist
        const spotifyItems = playlist.items
          .filter((item) => item.type === ServiceType.Spotify)
          .map((item) => ({ ...(item.data as Song) }));

        const youtubeItems = playlist.items
          .filter((item) => item.type === ServiceType.Youtube)
          .map((item) => ({ ...(item.data as YoutubeVideo) }));

        spotify.setPlaylist(spotifyItems);
        youtube.setPlaylist(youtubeItems);
        spotify.setPlaylistName(playlist.name);
        youtube.setPlaylistName(playlist.name);

        if (playlist.id !== "current") {
          setActivePlaylistId(playlist.id);
        } else {
          setActivePlaylistId(null);
        }
      } catch (error) {
        console.error("Error switching playlists:", error);
        spotify.setPlaylist([]);
        youtube.setPlaylist([]);
        spotify.setPlaylistName("New Playlist");
        youtube.setPlaylistName("New Playlist");
        setActivePlaylistId(null);
      }
    },
    [isCreatingNew, spotify, youtube, activePlaylistId, addPlaylist]
  );

  // Handle create playlist
  const handleCreatePlaylist = useCallback(() => {
    console.log("Creating new playlist");
    if (isCreatingNew) return;
    setIsCreatingNew(true);

    try {
      // Only save current playlist if it has items
      if (
        !activePlaylistId &&
        (spotify.playlist.length > 0 || youtube.playlist.length > 0)
      ) {
        const currentSpotifyItems = spotify.playlist.map((song) => ({
          id: song.id,
          type: ServiceType.Spotify,
          data: song,
        }));

        const currentYoutubeItems = youtube.playlist.map((video) => ({
          id: video.id.videoId,
          type: ServiceType.Youtube,
          data: video,
        }));

        const currentItems = [...currentSpotifyItems, ...currentYoutubeItems];

        // Only save if we have items
        if (currentItems.length > 0) {
          const newPlaylistId = `playlist_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`;
          const newPlaylist: SavedUnifiedPlaylist = {
            id: newPlaylistId,
            name: spotify.playlistName || "Unnamed Playlist",
            items: currentItems,
            createdAt: new Date().toISOString(),
          };
          console.log(
            "Saving current playlist before creating new:",
            newPlaylist
          );
          addPlaylist(newPlaylist);
        }
      }

      // Clear current playlist
      spotify.setPlaylist([]);
      youtube.setPlaylist([]);
      spotify.setPlaylistName("New Playlist");
      youtube.setPlaylistName("New Playlist");
      setActivePlaylistId(null);
    } finally {
      setTimeout(() => setIsCreatingNew(false), 500);
    }
  }, [spotify, youtube, activePlaylistId, isCreatingNew, addPlaylist]);

  // Modify the handleReset callback
  const handleReset = useCallback(() => {
    console.log("Resetting playlists");
    if (
      window.confirm(
        "Are you sure you want to reset all playlists? This will clear ALL playlists (including the current playlist) and reload the page. This cannot be undone."
      )
    ) {
      // Clear current playlist state first
      spotify.setPlaylist([]);
      youtube.setPlaylist([]);
      spotify.setPlaylistName("New Playlist");
      youtube.setPlaylistName("New Playlist");

      // Then clear storage and reload
      forceResetStorage();
    }
  }, [spotify, youtube]);

  // Handle delete playlist
  const handleDeletePlaylist = useCallback(
    (playlistId: string, event: React.MouseEvent) => {
      console.log("Deleting playlist:", playlistId);
      event.stopPropagation();
      event.preventDefault();

      if (window.confirm("Are you sure you want to delete this playlist?")) {
        if (playlistId === "current") {
          spotify.setPlaylist([]);
          youtube.setPlaylist([]);
          spotify.setPlaylistName("New Playlist");
          youtube.setPlaylistName("New Playlist");
          setActivePlaylistId(null);
          return;
        }

        deletePlaylist(playlistId);

        if (activePlaylistId === playlistId) {
          spotify.setPlaylist([]);
          youtube.setPlaylist([]);
          spotify.setPlaylistName("New Playlist");
          youtube.setPlaylistName("New Playlist");
          setActivePlaylistId(null);
        }
      }
    },
    [activePlaylistId, spotify, youtube, deletePlaylist]
  );

  // Handle save playlist
  const handleSavePlaylist = useCallback(() => {
    if (!activePlaylistId) return;

    const currentSpotifyItems = spotify.playlist.map((song: Song) => ({
      id: song.id,
      type: ServiceType.Spotify,
      data: song,
    }));

    const currentYoutubeItems = youtube.playlist.map((video: YoutubeVideo) => ({
      id: video.id.videoId,
      type: ServiceType.Youtube,
      data: video,
    }));

    const currentItems = [...currentSpotifyItems, ...currentYoutubeItems];

    const updatedPlaylist: SavedUnifiedPlaylist = {
      id: activePlaylistId,
      name: spotify.playlistName || "Unnamed Playlist",
      items: currentItems,
      createdAt: new Date().toISOString(),
    };

    console.log("Saving updated playlist:", updatedPlaylist);
    addPlaylist(updatedPlaylist);
    setHasUnsavedChanges(false);
  }, [
    activePlaylistId,
    spotify.playlist,
    youtube.playlist,
    spotify.playlistName,
    addPlaylist,
  ]);

  // Playlist thumbnail component
  const PlaylistThumbnail = ({ items }: { items: UnifiedPlaylistItem[] }) => {
    if (items.length === 0) {
      return (
        <div className="grid grid-cols-2 gap-1 w-12 h-12 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg backdrop-blur-sm border border-white/5 shadow-lg">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-gradient-to-br from-gray-700/50 to-gray-800/50 rounded-md backdrop-blur-sm"
            />
          ))}
        </div>
      );
    }

    const thumbnails = items.slice(0, 4);
    return (
      <div className="grid grid-cols-2 gap-1 w-12 h-12 rounded-lg overflow-hidden shadow-lg backdrop-blur-sm border border-white/5 bg-gradient-to-br from-black/20 to-black/10">
        {thumbnails.map((item, i) => {
          const thumbnailUrl =
            item.type === ServiceType.Spotify
              ? (item.data as Song).artwork.small.url
              : (item.data as YoutubeVideo).snippet.thumbnails.default.url;

          const title =
            item.type === ServiceType.Spotify
              ? (item.data as Song).title
              : (item.data as YoutubeVideo).snippet.title;

          return (
            <div key={i} className="relative w-full h-full">
              <Image
                src={thumbnailUrl}
                alt={title}
                fill
                className="object-cover transition-all duration-500 group-hover:scale-110 group-hover:brightness-110"
                sizes="48px"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />
            </div>
          );
        })}
      </div>
    );
  };

  // Define currentPlaylist for the current playlist button
  const currentPlaylist: SavedUnifiedPlaylist = {
    id: "current",
    name: spotify.playlistName || "New Playlist",
    items: [
      ...spotify.playlist.map((song) => ({
        id: song.id,
        type: ServiceType.Spotify,
        data: song,
      })),
      ...youtube.playlist.map((video) => ({
        id: video.id.videoId,
        type: ServiceType.Youtube,
        data: video,
      })),
    ],
    createdAt: new Date().toISOString(),
  };

  // Early return for loading state
  if (!mounted) {
    console.log("Not mounted yet, showing loading");
    return <LoadingComponent />;
  }

  console.log("Rendering main content");
  return (
    <div className="flex flex-row lg:flex-col items-center lg:items-start space-x-2 lg:space-x-0 lg:space-y-2 h-full">
      {/* Library Icon */}
      <div className="flex-none w-12 h-12 flex items-center justify-center text-gray-400 bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-lg backdrop-blur-sm border border-white/5">
        <FaMusic
          size={20}
          className="drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]"
        />
      </div>

      {/* Create New Playlist Button */}
      <button
        onClick={handleCreatePlaylist}
        disabled={isCreatingNew}
        className={`flex-none w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-500 ${
          isCreatingNew
            ? "bg-gray-600 cursor-not-allowed"
            : "bg-gradient-to-br from-[#FF6B6B] to-[#4ECDC4] hover:from-[#4ECDC4] hover:to-[#FF6B6B] hover:scale-105 shadow-lg hover:shadow-[#FF6B6B]/30"
        } backdrop-blur-sm border border-white/10 z-10`}
        title="Create New Playlist"
      >
        <FaPlus
          size={20}
          className="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]"
        />
      </button>

      {/* Save Current Playlist Button - Only show when viewing a saved playlist with changes */}
      {activePlaylistId && hasUnsavedChanges && (
        <button
          onClick={handleSavePlaylist}
          className="flex-none w-12 h-12 rounded-lg flex items-center justify-center bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-500 text-white transition-all duration-500 hover:scale-105 shadow-lg hover:shadow-green-500/30 backdrop-blur-sm border border-white/10 z-10 animate-pulse"
          title="Save Changes to Playlist"
        >
          <FaSave
            size={20}
            className="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]"
          />
        </button>
      )}

      {/* Reset All Playlists Button */}
      <button
        onClick={handleReset}
        className="w-12 h-12 flex-shrink-0 rounded-lg flex items-center justify-center bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-500 text-white transition-all duration-500 hover:scale-105 shadow-lg hover:shadow-red-500/30 backdrop-blur-sm border border-white/10 z-10"
        title="Reset All Playlists"
      >
        <FaTrash
          size={20}
          className="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]"
        />
      </button>

      {/* Playlists container */}
      <div className="flex-none flex flex-row lg:flex-col items-center lg:items-start space-x-2 lg:space-x-0 lg:space-y-2">
        {savedPlaylists.map((savedPlaylist) => (
          <div key={savedPlaylist.id} className="flex-none">
            <div className="group relative">
              {/* Delete button */}
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-lg flex items-center justify-center">
                <button
                  onClick={(e) => handleDeletePlaylist(savedPlaylist.id, e)}
                  className="w-8 h-8 flex items-center justify-center text-white hover:text-white/80 transition-colors duration-200"
                  title="Delete playlist"
                >
                  <FaTrash
                    size={12}
                    className="drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]"
                  />
                </button>
              </div>

              <button
                onClick={() => handlePlaylistClick(savedPlaylist)}
                className={`flex-none w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-500 ${
                  activePlaylistId === savedPlaylist.id
                    ? "bg-gradient-to-br from-white/20 to-white/10 shadow-lg shadow-[var(--theme-primary)]/20 backdrop-blur-sm border border-white/10"
                    : "hover:bg-gradient-to-br hover:from-white/10 hover:to-white/5 backdrop-blur-sm border border-transparent hover:border-white/5"
                }`}
              >
                <PlaylistThumbnail items={savedPlaylist.items} />
              </button>

              {/* Tooltip */}
              <div className="absolute left-1/2 top-full -translate-x-1/2 mt-2 px-3 py-1.5 bg-gradient-to-r from-black/90 to-gray-900/90 text-white text-xs rounded-full backdrop-blur-md border border-white/10 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-[9999]">
                <div className="flex items-center gap-1.5">
                  <div className="w-1 h-1 rounded-full bg-[var(--theme-primary)] animate-pulse" />
                  <span>
                    {savedPlaylist.name || "Unnamed Playlist"} (
                    {Array.isArray(savedPlaylist.items)
                      ? savedPlaylist.items.length
                      : 0}{" "}
                    items)
                  </span>
                </div>
                <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-black/90 rotate-45 border-t border-l border-white/10" />
              </div>
            </div>
          </div>
        ))}

        {/* Current Playlist */}
        {(!activePlaylistId || hasUnsavedChanges) &&
          (spotify.playlist.length > 0 || youtube.playlist.length > 0) && (
            <div className="flex-none">
              <div className="group relative">
                {/* Delete button */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-lg flex items-center justify-center">
                  <button
                    onClick={(e) => handleDeletePlaylist("current", e)}
                    className="w-8 h-8 flex items-center justify-center text-white hover:text-white/80 transition-colors duration-200"
                    title="Delete playlist"
                  >
                    <FaTrash
                      size={12}
                      className="drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]"
                    />
                  </button>
                </div>

                <button
                  onClick={() => handlePlaylistClick(currentPlaylist)}
                  className="flex-none w-12 h-12 rounded-lg flex items-center justify-center hover:bg-gradient-to-br hover:from-white/10 hover:to-white/5 transition-all duration-500 backdrop-blur-sm border border-transparent hover:border-white/5"
                >
                  <PlaylistThumbnail
                    items={[
                      ...spotify.playlist.map((song) => ({
                        id: song.id,
                        type: ServiceType.Spotify,
                        data: song,
                      })),
                      ...youtube.playlist.map((video) => ({
                        id: video.id.videoId,
                        type: ServiceType.Youtube,
                        data: video,
                      })),
                    ]}
                  />
                </button>

                {/* Tooltip */}
                <div className="absolute left-1/2 top-full -translate-x-1/2 mt-2 px-3 py-1.5 bg-gradient-to-r from-black/90 to-gray-900/90 text-white text-xs rounded-full backdrop-blur-md border border-white/10 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-[9999]">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1 h-1 rounded-full bg-[var(--theme-primary)] animate-pulse" />
                    <span>
                      {spotify.playlistName || "New Playlist"} (
                      {(Array.isArray(spotify.playlist)
                        ? spotify.playlist.length
                        : 0) +
                        (Array.isArray(youtube.playlist)
                          ? youtube.playlist.length
                          : 0)}{" "}
                      items)
                    </span>
                  </div>
                  <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-black/90 rotate-45 border-t border-l border-white/10" />
                </div>
              </div>
            </div>
          )}
      </div>
    </div>
  );
};

// Export the component directly instead of using dynamic import
const UnifiedPlaylistLibrary: React.FC<UnifiedPlaylistLibraryProps> = (
  props
) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) {
    return <LoadingComponent />;
  }

  return <UnifiedPlaylistLibraryContent {...props} />;
};

export default UnifiedPlaylistLibrary;
