import { FaMusic, FaPlus, FaTrash } from "react-icons/fa";
import Image from "next/image";
import { useSpotify, useYoutube } from "@/context/UnifiedContext";
import { useState, useEffect, useCallback } from "react";
import { Song } from "@/types/playerTypes";
import { YoutubeVideo } from "../Services/YtService";

// Storage keys for playlists
const STORAGE_KEYS = {
  SPOTIFY: {
    PLAYLIST: "spotify_playlist",
    PLAYLIST_NAME: "spotify_playlist_name",
    SAVED_PLAYLISTS: "spotify_saved_playlists",
  },
  YOUTUBE: {
    PLAYLIST: "youtube_playlist",
    PLAYLIST_NAME: "youtube_playlist_name",
    SAVED_PLAYLISTS: "youtube_saved_playlists",
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
};

interface SavedPlaylist<T> {
  id: string;
  name: string;
  songs: T[];
  createdAt: string;
}

interface PlaylistLibraryProps {
  theme: {
    primary: string;
    secondary: string;
    accent: string;
  };
  type?: "spotify" | "youtube";
}

// Update context types to match the actual context structure
interface SpotifyContext {
  searchResults: Song[];
  setSearchResults: React.Dispatch<React.SetStateAction<Song[]>>;
  playlist: Song[];
  setPlaylist: React.Dispatch<React.SetStateAction<Song[]>>;
  currentSong: Song | null;
  setCurrentSong: React.Dispatch<React.SetStateAction<Song | null>>;
  playlistName: string;
  setPlaylistName: React.Dispatch<React.SetStateAction<string>>;
  refreshToken: () => Promise<void>;
  logout: () => Promise<void>;
  addToPlaylist: (song: Song) => void;
  removeFromPlaylist: (songId: string) => void;
  savedPlaylists: SavedPlaylist<Song>[];
  setSavedPlaylists: React.Dispatch<
    React.SetStateAction<SavedPlaylist<Song>[]>
  >;
}

interface YoutubeContext {
  searchResults: YoutubeVideo[];
  setSearchResults: React.Dispatch<React.SetStateAction<YoutubeVideo[]>>;
  playlist: YoutubeVideo[];
  setPlaylist: React.Dispatch<React.SetStateAction<YoutubeVideo[]>>;
  selectedVideo: string | null;
  setSelectedVideo: React.Dispatch<React.SetStateAction<string | null>>;
  nextPageToken: string | undefined;
  setNextPageToken: React.Dispatch<React.SetStateAction<string | undefined>>;
  currentSearchTerm: string;
  setCurrentSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  addToPlaylist: (video: YoutubeVideo) => void;
  removeFromPlaylist: (videoId: string) => void;
  playlistName: string;
  setPlaylistName: React.Dispatch<React.SetStateAction<string>>;
  savedPlaylists: SavedPlaylist<YoutubeVideo>[];
  setSavedPlaylists: React.Dispatch<
    React.SetStateAction<SavedPlaylist<YoutubeVideo>[]>
  >;
}

const PlaylistLibrary: React.FC<PlaylistLibraryProps> = ({
  theme,
  type = "spotify",
}) => {
  const spotifyContext = useSpotify() as unknown as SpotifyContext;
  const youtubeContext = useYoutube() as unknown as YoutubeContext;

  // Use the appropriate context based on type
  const context = type === "spotify" ? spotifyContext : youtubeContext;
  const {
    playlist,
    setPlaylist,
    setPlaylistName,
    playlistName,
    savedPlaylists = [],
    setSavedPlaylists = () => {},
  } = context;

  // Set theme CSS variables
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--theme-primary",
      theme.primary
    );
    document.documentElement.style.setProperty(
      "--theme-secondary",
      theme.secondary
    );
    document.documentElement.style.setProperty("--theme-accent", theme.accent);
  }, [theme]);

  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Load saved playlists on mount
  useEffect(() => {
    const savedPlaylistsStr = safeLocalStorage.get(
      type === "spotify"
        ? STORAGE_KEYS.SPOTIFY.SAVED_PLAYLISTS
        : STORAGE_KEYS.YOUTUBE.SAVED_PLAYLISTS
    );
    if (savedPlaylistsStr) {
      try {
        if (type === "spotify") {
          const parsed = JSON.parse(savedPlaylistsStr) as SavedPlaylist<Song>[];
          const uniquePlaylists = Array.from(
            new Map(parsed.map((p) => [p.id, p])).values()
          );
          (
            setSavedPlaylists as React.Dispatch<
              React.SetStateAction<SavedPlaylist<Song>[]>
            >
          )(uniquePlaylists);
        } else {
          const parsed = JSON.parse(
            savedPlaylistsStr
          ) as SavedPlaylist<YoutubeVideo>[];
          const uniquePlaylists = Array.from(
            new Map(parsed.map((p) => [p.id, p])).values()
          );
          (
            setSavedPlaylists as React.Dispatch<
              React.SetStateAction<SavedPlaylist<YoutubeVideo>[]>
            >
          )(uniquePlaylists);
        }
      } catch (error) {
        console.error("Error parsing saved playlists:", error);
        setSavedPlaylists([]);
      }
    }
  }, [type, setSavedPlaylists]);

  // Save playlists whenever they change
  useEffect(() => {
    if (savedPlaylists.length > 0) {
      safeLocalStorage.set(
        type === "spotify"
          ? STORAGE_KEYS.SPOTIFY.SAVED_PLAYLISTS
          : STORAGE_KEYS.YOUTUBE.SAVED_PLAYLISTS,
        JSON.stringify(savedPlaylists)
      );
    }
  }, [savedPlaylists, type]);

  const handleCreatePlaylist = useCallback(() => {
    // Prevent multiple rapid clicks
    if (isCreatingNew) return;
    setIsCreatingNew(true);

    try {
      // Only save if there are songs in the current playlist and it's not already saved
      if (playlist.length > 0 && !activePlaylistId) {
        const newPlaylist =
          type === "spotify"
            ? ({
                id: `playlist_${Date.now()}`,
                name: playlistName || "Unnamed Playlist",
                songs: [...playlist] as Song[],
                createdAt: new Date().toISOString(),
              } as SavedPlaylist<Song>)
            : ({
                id: `playlist_${Date.now()}`,
                name: playlistName || "Unnamed Playlist",
                songs: [...playlist] as YoutubeVideo[],
                createdAt: new Date().toISOString(),
              } as SavedPlaylist<YoutubeVideo>);

        // Check if this playlist is already saved (by comparing songs)
        const isDuplicate = savedPlaylists.some(
          (saved: SavedPlaylist<Song | YoutubeVideo>) =>
            saved.songs.length === newPlaylist.songs.length &&
            saved.songs.every((song: Song | YoutubeVideo, index: number) =>
              type === "spotify"
                ? (song as Song).id === (newPlaylist.songs[index] as Song).id
                : (song as YoutubeVideo).id.videoId ===
                  (newPlaylist.songs[index] as YoutubeVideo).id.videoId
            )
        );

        if (!isDuplicate) {
          if (type === "spotify") {
            (
              setSavedPlaylists as React.Dispatch<
                React.SetStateAction<SavedPlaylist<Song>[]>
              >
            )((prev: SavedPlaylist<Song>[]) => [
              ...prev,
              newPlaylist as SavedPlaylist<Song>,
            ]);
          } else {
            (
              setSavedPlaylists as React.Dispatch<
                React.SetStateAction<SavedPlaylist<YoutubeVideo>[]>
              >
            )((prev: SavedPlaylist<YoutubeVideo>[]) => [
              ...prev,
              newPlaylist as SavedPlaylist<YoutubeVideo>,
            ]);
          }
        }
      }

      // Create new empty playlist
      setPlaylist([]);
      // Only reset the playlist name if it's the default "New Playlist"
      if (playlistName === "New Playlist") {
        setPlaylistName("New Playlist");
      }
      setActivePlaylistId(null);
    } finally {
      // Reset the creating flag after a short delay
      setTimeout(() => setIsCreatingNew(false), 500);
    }
  }, [
    playlist,
    playlistName,
    activePlaylistId,
    savedPlaylists,
    setPlaylist,
    setPlaylistName,
    type,
    setSavedPlaylists,
  ]);

  const handlePlaylistClick = useCallback(
    (playlist: SavedPlaylist<Song | YoutubeVideo>) => {
      // Prevent clicking while creating new playlist
      if (isCreatingNew) return;

      if (type === "spotify") {
        (setPlaylist as React.Dispatch<React.SetStateAction<Song[]>>)([
          ...(playlist.songs as Song[]),
        ]);
      } else {
        (setPlaylist as React.Dispatch<React.SetStateAction<YoutubeVideo[]>>)([
          ...(playlist.songs as YoutubeVideo[]),
        ]);
      }
      setPlaylistName(playlist.name);
      setActivePlaylistId(playlist.id);
    },
    [isCreatingNew, setPlaylist, setPlaylistName, type]
  );

  const handleDeletePlaylist = useCallback(
    (playlistId: string, event: React.MouseEvent) => {
      event.stopPropagation(); // Prevent triggering the playlist click

      if (window.confirm("Are you sure you want to delete this playlist?")) {
        if (type === "spotify") {
          (
            setSavedPlaylists as React.Dispatch<
              React.SetStateAction<SavedPlaylist<Song>[]>
            >
          )((prev: SavedPlaylist<Song>[]) =>
            prev.filter((p: SavedPlaylist<Song>) => p.id !== playlistId)
          );
        } else {
          (
            setSavedPlaylists as React.Dispatch<
              React.SetStateAction<SavedPlaylist<YoutubeVideo>[]>
            >
          )((prev: SavedPlaylist<YoutubeVideo>[]) =>
            prev.filter((p: SavedPlaylist<YoutubeVideo>) => p.id !== playlistId)
          );
        }

        // If the deleted playlist was active, clear the current playlist
        if (activePlaylistId === playlistId) {
          setPlaylist([]);
          setPlaylistName("New Playlist");
          setActivePlaylistId(null);
        }
      }
    },
    [activePlaylistId, setPlaylist, setPlaylistName, setSavedPlaylists, type]
  );

  const PlaylistThumbnail = ({
    songs,
  }: {
    songs: (Song | YoutubeVideo)[];
    playlistName: string; // Keep for type compatibility but not used
  }) => {
    if (songs.length === 0) {
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

    const thumbnails = songs.slice(0, 4);

    return (
      <div className="grid grid-cols-2 gap-1 w-12 h-12 rounded-lg overflow-hidden shadow-lg backdrop-blur-sm border border-white/5 bg-gradient-to-br from-black/20 to-black/10">
        {thumbnails.map((song, i) => {
          const thumbnailUrl =
            type === "spotify"
              ? (song as Song).artwork.small.url
              : (song as YoutubeVideo).snippet.thumbnails.default.url;

          const title =
            type === "spotify"
              ? (song as Song).title
              : (song as YoutubeVideo).snippet.title;

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

  return (
    <div className="w-16 bg-gradient-to-b from-black/60 to-black/40 rounded-lg p-2 flex flex-col items-center space-y-2 backdrop-blur-md border border-white/5 shadow-xl relative z-50">
      <div className="w-12 h-12 flex items-center justify-center text-gray-400 bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-lg backdrop-blur-sm border border-white/5">
        <FaMusic
          size={20}
          className="drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]"
        />
      </div>
      <button
        onClick={handleCreatePlaylist}
        className="w-12 h-12 rounded-lg flex items-center justify-center bg-gradient-to-br from-[var(--theme-primary)] to-[var(--theme-secondary)] hover:from-[var(--theme-secondary)] hover:to-[var(--theme-primary)] text-white transition-all duration-500 hover:scale-105 shadow-lg hover:shadow-[var(--theme-primary)]/30 backdrop-blur-sm border border-white/10"
        title="Create New Playlist"
      >
        <FaPlus
          size={20}
          className="drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]"
        />
      </button>

      {/* Show saved playlists */}
      {savedPlaylists.map((savedPlaylist) => {
        const isYoutubePlaylist = type === "youtube";
        return (
          <div
            key={savedPlaylist.id}
            className="relative flex flex-col items-center"
          >
            <div className="group relative">
              {/* Delete button - now on the left */}
              <div className="absolute -left-8 top-1/2 -translate-y-1/2 bg-black/80 opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-lg flex items-center justify-center">
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
                className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-500 ${
                  activePlaylistId === savedPlaylist.id
                    ? "bg-gradient-to-br from-white/20 to-white/10 shadow-lg shadow-[var(--theme-primary)]/20 backdrop-blur-sm border border-white/10"
                    : "hover:bg-gradient-to-br hover:from-white/10 hover:to-white/5 backdrop-blur-sm border border-transparent hover:border-white/5"
                }`}
              >
                <PlaylistThumbnail
                  songs={savedPlaylist.songs}
                  playlistName={savedPlaylist.name}
                />
              </button>
              {/* Tooltip - simplified */}
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-3 py-1.5 bg-gradient-to-r from-black/90 to-gray-900/90 text-white text-xs rounded-full backdrop-blur-md border border-white/10 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-[9999]">
                <div className="flex items-center gap-1.5">
                  <div className="w-1 h-1 rounded-full bg-[var(--theme-primary)] animate-pulse" />
                  <span>
                    {savedPlaylist.name} ({savedPlaylist.songs.length}{" "}
                    {isYoutubePlaylist ? "videos" : "songs"})
                  </span>
                </div>
                {/* Tooltip arrow */}
                <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-black/90 rotate-45 border-l border-b border-white/10" />
              </div>
            </div>
          </div>
        );
      })}

      {/* Show current playlist if it's not empty and not already saved */}
      {playlist.length > 0 &&
        !activePlaylistId &&
        (() => {
          const isYoutubePlaylist = type === "youtube";
          return (
            <div className="relative flex flex-col items-center">
              <div className="group relative">
                {/* Delete button - now on the left */}
                <div className="absolute -left-8 top-1/2 -translate-y-1/2 bg-black/80 opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-lg flex items-center justify-center">
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
                  onClick={() =>
                    handlePlaylistClick({
                      id: "current",
                      name: playlistName,
                      songs: playlist,
                      createdAt: new Date().toISOString(),
                    })
                  }
                  className="w-12 h-12 rounded-lg flex items-center justify-center hover:bg-gradient-to-br hover:from-white/10 hover:to-white/5 transition-all duration-500 backdrop-blur-sm border border-transparent hover:border-white/5"
                >
                  <PlaylistThumbnail
                    songs={playlist}
                    playlistName={playlistName}
                  />
                </button>
                {/* Tooltip - simplified */}
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-3 py-1.5 bg-gradient-to-r from-black/90 to-gray-900/90 text-white text-xs rounded-full backdrop-blur-md border border-white/10 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-[9999]">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1 h-1 rounded-full bg-[var(--theme-primary)] animate-pulse" />
                    <span>
                      {playlistName} ({playlist.length}{" "}
                      {isYoutubePlaylist ? "videos" : "songs"})
                    </span>
                  </div>
                  {/* Tooltip arrow */}
                  <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-black/90 rotate-45 border-l border-b border-white/10" />
                </div>
              </div>
            </div>
          );
        })()}
    </div>
  );
};

export default PlaylistLibrary;
