"use client";

import React, { useState, useEffect, useCallback, memo } from "react";
import { useUnifiedContext } from "@/app/context/UnifiedContext";
import { FaMusic, FaPlus, FaTrash, FaCheck } from "react-icons/fa";
import Image from "next/image";
import { ServiceType, Song } from "@/app/types/playerTypes";
import { YoutubeVideo } from "@/app/types/youtubeTypes";

// Import atomic design components
import Button from "@/app/components/atoms/Button";
import Loading from "@/app/components/atoms/Loading";
import Icon from "@/app/components/atoms/Icon";

// Storage key for unified playlists
const STORAGE_KEY = "unified_saved_playlists";

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
  clear: (key: string) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error clearing localStorage (${key}):`, error);
    }
  },
};

interface UnifiedPlaylistItem {
  id: string;
  type: ServiceType;
  data: Song | YoutubeVideo;
}

interface UnifiedPlaylist {
  id: string;
  name: string;
  items: UnifiedPlaylistItem[];
  createdAt: string;
}

interface UnifiedPlaylistLibraryProps {
  theme?: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

// Loading component using atomic Loading component
const LoadingComponent = () => (
  <div className="flex items-center justify-center h-full">
    <Loading size="lg" color="watermelon" />
  </div>
);

// Playlist thumbnail component
const PlaylistThumbnail = memo(
  ({ items }: { items: UnifiedPlaylistItem[] }) => {
    if (items.length === 0) {
      return (
        <div className="grid grid-cols-2 gap-1 w-12 h-12 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg backdrop-blur-sm border border-white/5 shadow-lg transform-none">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-gradient-to-br from-gray-700/50 to-gray-800/50 rounded-md backdrop-blur-sm transform-none"
            />
          ))}
        </div>
      );
    }

    const thumbnails = items.slice(0, 4);
    return (
      <div className="grid grid-cols-2 gap-1 w-12 h-12 rounded-lg overflow-hidden shadow-lg backdrop-blur-sm border border-white/5 bg-gradient-to-br from-black/20 to-black/10 transform-none">
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
            <div key={i} className="relative w-full h-full transform-none">
              <Image
                src={thumbnailUrl}
                alt={title}
                fill
                className="object-cover transform-none"
                sizes="48px"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out transform-none" />
            </div>
          );
        })}
      </div>
    );
  }
);

PlaylistThumbnail.displayName = "PlaylistThumbnail";

// Individual playlist item component
const PlaylistItem = memo(
  ({
    playlist,
    onLoad,
    onDelete,
    isActive,
  }: {
    playlist: UnifiedPlaylist;
    onLoad: (playlist: UnifiedPlaylist) => void;
    onDelete: (id: string) => void;
    isActive: boolean;
  }) => {
    return (
      <div className="flex-none">
        <div className="group relative">
          {/* Delete button - appears on hover */}
          <div className="absolute -right-1 -top-1 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-full z-10">
            <Button
              onClick={() => onDelete(playlist.id)}
              variant="danger"
              size="sm"
              className="w-5 h-5 p-0 min-w-0"
            >
              <FaTrash size={8} />
            </Button>
          </div>

          {/* Playlist button */}
          <button
            onClick={() => onLoad(playlist)}
            className={`flex-none w-12 h-12 rounded-lg flex items-center justify-center transform-none hover:transform-none ${
              isActive
                ? "bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-sm border-2 border-[#FF6B6B]"
                : "hover:bg-gradient-to-br hover:from-white/10 hover:to-white/5 backdrop-blur-sm border border-transparent hover:border-2 hover:border-[#FF6B6B]/60"
            }`}
          >
            <PlaylistThumbnail items={playlist.items} />
          </button>

          {/* Tooltip */}
          <div className="absolute left-1/2 top-full -translate-x-1/2 mt-2 px-3 py-1.5 bg-gradient-to-r from-black/90 to-gray-900/90 text-white text-xs rounded-full backdrop-blur-md border border-white/10 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-[9999]">
            <div className="flex items-center gap-1.5">
              <div className="w-1 h-1 rounded-full bg-[var(--theme-primary)] animate-pulse" />
              <span>
                {playlist.name} ({playlist.items.length} items)
              </span>
            </div>
            <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-black/90 rotate-45 border-t border-l border-white/10" />
          </div>
        </div>
      </div>
    );
  }
);

PlaylistItem.displayName = "PlaylistItem";

// Main component
const UnifiedPlaylistLibrary = memo(
  ({ theme }: UnifiedPlaylistLibraryProps) => {
    const { unified } = useUnifiedContext();
    const [mounted, setMounted] = useState(false);

    // Set theme CSS variables
    useEffect(() => {
      if (theme) {
        document.documentElement.style.setProperty(
          "--primary-color",
          theme.primary
        );
        document.documentElement.style.setProperty(
          "--secondary-color",
          theme.secondary
        );
        document.documentElement.style.setProperty(
          "--accent-color",
          theme.accent
        );
      }
    }, [theme]);

    // Mount effect
    useEffect(() => {
      setMounted(true);
      return () => setMounted(false);
    }, []);

    // Save playlists to localStorage whenever they change
    useEffect(() => {
      if (mounted && unified.savedPlaylists.length > 0) {
        safeLocalStorage.set(
          STORAGE_KEY,
          JSON.stringify(unified.savedPlaylists)
        );
      }
    }, [unified.savedPlaylists, mounted]);

    // Load playlists from localStorage on mount
    useEffect(() => {
      if (mounted) {
        const saved = safeLocalStorage.get(STORAGE_KEY);
        if (saved) {
          try {
            const playlists = JSON.parse(saved);
            unified.setSavedPlaylists(playlists);
          } catch (error) {
            console.error("Error loading playlists:", error);
          }
        }
      }
    }, [mounted]); // Removed unified.setSavedPlaylists and unified from dependencies

    // Handlers
    const handleCreatePlaylist = useCallback(() => {
      const name = prompt("Enter playlist name:", "New Playlist");
      if (name && name.trim()) {
        unified.createPlaylist(name.trim());
        console.log("Created new playlist:", name.trim());
      }
    }, [unified]);

    const handleSavePlaylist = useCallback(() => {
      console.log("Save button clicked!");
      console.log("Current playlist:", unified.playlist);
      console.log("Current playlist ID:", unified.currentPlaylistId);
      console.log("Has unsaved changes:", unified.hasUnsavedChanges);
      // Use the unified context's saveCurrentPlaylist function
      unified.saveCurrentPlaylist();
    }, [unified]);

    const handleSelectPlaylist = useCallback(
      (playlist: UnifiedPlaylist) => {
        unified.loadPlaylist(playlist.id);
      },
      [unified]
    );

    const handleDeletePlaylist = useCallback(
      (playlistId: string) => {
        console.log("Delete button clicked for playlist:", playlistId);

        if (window.confirm("Are you sure you want to delete this playlist?")) {
          console.log("Deleting playlist:", playlistId);
          unified.deletePlaylist(playlistId);
        }
      },
      [unified]
    );

    const handleClearAll = useCallback(() => {
      if (
        window.confirm(
          "Are you sure you want to clear all playlists? This cannot be undone."
        )
      ) {
        unified.clearAllPlaylists();
        // Clear all localStorage data
        safeLocalStorage.clear(STORAGE_KEY);
        safeLocalStorage.clear("unified_playlist_name");
        safeLocalStorage.clear("youtube_playlist_name");
        safeLocalStorage.clear("spotify_playlist_name");
        safeLocalStorage.clear("youtube_playlist");
        safeLocalStorage.clear("spotify_playlist");
        safeLocalStorage.clear("youtube_saved_playlists");
        safeLocalStorage.clear("spotify_saved_playlists");
        console.log("Cleared all playlists and localStorage data");
        // Force reload to ensure clean state
        window.location.reload();
      }
    }, [unified]);

    if (!mounted) return <LoadingComponent />;

    return (
      <div className="flex flex-row lg:flex-col items-center lg:items-start space-x-2 lg:space-x-0 lg:space-y-2 h-full">
        {/* Library Icon */}
        <div className="flex-none w-12 h-12 flex items-center justify-center text-gray-400 bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-lg backdrop-blur-sm border border-white/5">
          <Icon icon={<FaMusic size={20} />} color="gray" />
        </div>

        {/* Create New Playlist Button */}
        <Button
          onClick={handleCreatePlaylist}
          variant="watermelon"
          size="lg"
          className="w-12 h-12 p-0 min-w-0"
        >
          <FaPlus size={20} />
        </Button>

        {/* Save Current Playlist Button */}
        {unified.hasUnsavedChanges && (
          <Button
            onClick={handleSavePlaylist}
            variant="secondary"
            size="lg"
            className="w-12 h-12 p-0 min-w-0"
          >
            <FaCheck size={20} />
          </Button>
        )}

        {/* Status Indicator */}
        {unified.playlist.length > 0 &&
          (unified.isJustSaved ? (
            <div className="flex-none px-2 py-1 bg-green-500/20 border border-green-500/30 rounded-lg">
              <span className="text-xs text-green-400 font-medium">Saved</span>
            </div>
          ) : unified.hasUnsavedChanges ? (
            <div className="flex-none px-2 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
              <span className="text-xs text-yellow-400 font-medium">
                Unsaved Changes
              </span>
            </div>
          ) : null)}

        {/* Clear All Button */}
        <Button
          onClick={handleClearAll}
          variant="danger"
          size="lg"
          className="w-12 h-12 p-0 min-w-0"
        >
          <FaTrash size={20} />
        </Button>

        {/* Playlists */}
        <div className="flex-none flex flex-row lg:flex-col items-center lg:items-start space-x-2 lg:space-x-0 lg:space-y-2">
          {unified.savedPlaylists.map((playlist) => (
            <PlaylistItem
              key={playlist.id}
              playlist={playlist}
              onLoad={handleSelectPlaylist}
              onDelete={handleDeletePlaylist}
              isActive={unified.currentPlaylistId === playlist.id}
            />
          ))}
        </div>
      </div>
    );
  }
);

UnifiedPlaylistLibrary.displayName = "UnifiedPlaylistLibrary";

export default UnifiedPlaylistLibrary;
