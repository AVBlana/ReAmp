"use client";

import { UnifiedProvider } from "@/context/UnifiedContext";
import { FaSpotify } from "react-icons/fa";
import Header from "../components/Header";
import SpotifySearch from "../components/SpotifySearch";
import SpotifyPlaylistView from "../components/SpotifyPlaylistView";
import SpotifyPlayer from "../components/SpotifyPlayer/SpotifyPlayer";
import SpotifySearchResultsList from "../components/SpotifySearchResultsList";
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import { useSpotify } from "@/context/UnifiedContext";
import { useEffect, useState } from "react";
import { SpotifyFooter } from "../components/Footer";
import PlaylistLibrary from "../components/PlaylistLibrary";
import { ServiceType, Song } from "@/types/playerTypes";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ id: string; name: string }>;
  album: {
    images: Array<{ url: string; width: number; height: number }>;
  };
}

interface SpotifySearchResponse {
  tracks: {
    items: SpotifyTrack[];
    next: string | null;
    offset: number;
    total: number;
    hasMore: boolean;
    nextOffset: string | null;
  };
}

function SpotifySearchContent() {
  const {
    searchResults,
    setSearchResults,
    playlist,
    setPlaylist,
    setCurrentSong,
    addToPlaylist,
  } = useSpotify();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [currentSearchTerm, setCurrentSearchTerm] = useState<string>("");
  const router = useRouter();

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("spotify_token");
        if (token) {
          // Verify token is still valid
          const response = await fetch("/api/spotify/refresh");
          if (response.ok) {
            setIsAuthenticated(true);
          } else {
            setIsAuthenticated(false);
            router.push("/api/spotify/login?origin=/spotify");
          }
        } else {
          setIsAuthenticated(false);
          router.push("/api/spotify/login?origin=/spotify");
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
        setIsAuthenticated(false);
        router.push("/api/spotify/login?origin=/spotify");
      }
    };

    checkAuth();
  }, [router]);

  // Show loading state while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            className="rounded-full h-12 w-12 border-b-2 border-[#1DB954] mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <p className="text-lg">Connecting to Spotify...</p>
        </div>
      </div>
    );
  }

  // Don't render the main content if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  const handleSearch = async (query: string) => {
    console.log("Main page handleSearch called with query:", query);
    setCurrentSearchTerm(query);
    try {
      const response = await fetch(
        `/api/spotify/search?q=${encodeURIComponent(query)}`
      );
      if (!response.ok) throw new Error("Failed to fetch search results");
      const data = (await response.json()) as SpotifySearchResponse;

      console.log("Main page search response:", {
        hasNext: !!data.tracks.next,
        offset: data.tracks.offset,
        total: data.tracks.total,
        items: data.tracks.items.length,
        nextOffset: data.tracks.offset + data.tracks.items.length,
      });

      if (!data.tracks?.items) {
        console.error("Invalid search response:", data);
        setSearchResults([]);
        setNextPageToken(null);
        return;
      }

      const mappedResults: Song[] = data.tracks.items.map((track) => {
        const images = track.album.images || [];
        const smallImage = images.find((img) => img.width <= 64) ||
          images[images.length - 1] || { url: "", width: 64, height: 64 };
        const mediumImage = images.find((img) => img.width <= 300) ||
          images[images.length - 1] || { url: "", width: 300, height: 300 };
        const bigImage = images[0] ||
          images[images.length - 1] || { url: "", width: 640, height: 640 };

        return {
          id: track.id,
          type: ServiceType.Spotify,
          title: track.name,
          artist: {
            id: track.artists[0]?.id || "",
            name: track.artists[0]?.name || "Unknown Artist",
          },
          artwork: {
            small: {
              url: smallImage.url || "",
              width: smallImage.width || 64,
              height: smallImage.height || 64,
            },
            medium: {
              url: mediumImage.url || "",
              width: mediumImage.width || 300,
              height: mediumImage.height || 300,
            },
            big: {
              url: bigImage.url || "",
              width: bigImage.width || 640,
              height: bigImage.height || 640,
            },
          },
        };
      });

      setSearchResults(mappedResults);
      const hasMore = !!data.tracks.next;
      const nextOffset = data.tracks.offset + data.tracks.items.length;
      console.log("Main page setting nextPageToken:", {
        hasMore,
        nextUrl: data.tracks.next,
        offset: data.tracks.offset,
        itemsLength: data.tracks.items.length,
        calculatedNextOffset: nextOffset,
        query,
      });
      setNextPageToken(hasMore ? String(nextOffset) : null);
    } catch (error) {
      console.error("Error searching Spotify:", error);
      setSearchResults([]);
      setNextPageToken(null);
    }
  };

  const handleLoadMore = async () => {
    if (!nextPageToken || !currentSearchTerm || isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      const response = await fetch(
        `/api/spotify/search?q=${encodeURIComponent(
          currentSearchTerm
        )}&offset=${nextPageToken}`
      );
      if (!response.ok) throw new Error("Failed to fetch more results");
      const data = (await response.json()) as SpotifySearchResponse;

      if (!data.tracks?.items) {
        console.error("Invalid search response:", data);
        return;
      }

      const mappedResults: Song[] = data.tracks.items.map((track) => {
        const images = track.album.images || [];
        const smallImage = images.find((img) => img.width <= 64) ||
          images[images.length - 1] || { url: "", width: 64, height: 64 };
        const mediumImage = images.find((img) => img.width <= 300) ||
          images[images.length - 1] || { url: "", width: 300, height: 300 };
        const bigImage = images[0] ||
          images[images.length - 1] || { url: "", width: 640, height: 640 };

        return {
          id: track.id,
          type: ServiceType.Spotify,
          title: track.name,
          artist: {
            id: track.artists[0]?.id || "",
            name: track.artists[0]?.name || "Unknown Artist",
          },
          artwork: {
            small: {
              url: smallImage.url || "",
              width: smallImage.width || 64,
              height: smallImage.height || 64,
            },
            medium: {
              url: mediumImage.url || "",
              width: mediumImage.width || 300,
              height: mediumImage.height || 300,
            },
            big: {
              url: bigImage.url || "",
              width: bigImage.width || 640,
              height: bigImage.height || 640,
            },
          },
        };
      });

      setSearchResults((prev) => [...prev, ...mappedResults]);
      const hasMore = !!data.tracks.next;
      setNextPageToken(
        hasMore ? String(data.tracks.offset + data.tracks.items.length) : null
      );
    } catch (error) {
      console.error("Error loading more Spotify results:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    // Handle dropping to player
    if (result.destination.droppableId === "spotify-player") {
      // Handle both list and slider item IDs
      const songId = result.draggableId
        .replace("spotify-list-", "")
        .replace("spotify-slider-", "");
      const song = playlist.find((s) => s.id === songId);
      if (song) {
        setCurrentSong(song);
      }
      return;
    }

    // Handle reordering within playlist
    if (
      result.destination.droppableId === "spotify-playlist" &&
      result.source.droppableId === "spotify-playlist"
    ) {
      const items = Array.from(playlist);
      const [reorderedItem] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reorderedItem);
      setPlaylist(items);
    }

    // Handle dropping from search results to playlist
    if (
      result.destination.droppableId === "spotify-playlist" &&
      result.source.droppableId === "search-results"
    ) {
      const songId = result.draggableId;
      const song = searchResults.find((s) => s.id === songId);
      if (song) {
        addToPlaylist(song);
      }
    }
  };

  // Add debug logging before render
  console.log("Main page rendering SpotifySearchResultsList with:", {
    hasMore: !!nextPageToken,
    nextPageToken,
    searchResultsLength: searchResults.length,
    currentSearchTerm,
    isLoadingMore,
    query: currentSearchTerm,
  });

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="min-h-screen bg-[#0A0A0A] text-gray-100 flex flex-col">
        {/* Background Grid */}
        <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black_70%)]" />

        <Header
          icon={<FaSpotify className="text-[#1DB954]" size={24} />}
          title="Spotify Player"
          searchComponent={<SpotifySearch onSearch={handleSearch} />}
        />

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8 relative z-10 flex-grow flex gap-4">
          <div className="flex-grow">
            {/* Player and Playlist Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Music Player */}
              <div className="relative h-[700px] bg-black rounded-lg overflow-visible">
                <Droppable droppableId="spotify-player">
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="h-full w-full"
                    >
                      <SpotifyPlayer />
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
              <div className="flex gap-4 w-full">
                {/* Playlist Library */}
                <div className="flex-shrink-0">
                  <PlaylistLibrary
                    theme={{
                      primary: "#1DB954",
                      secondary: "#1ed760",
                      accent: "#1fdf64",
                    }}
                  />
                </div>
                {/* Playlist Section */}
                <div className="flex-1 h-[700px] overflow-hidden">
                  <SpotifyPlaylistView />
                </div>
              </div>
            </div>

            {/* Search Results Section */}
            <div className="mt-8">
              {searchResults.length > 0 && (
                <SpotifySearchResultsList
                  searchResults={searchResults}
                  onLoadMore={handleLoadMore}
                  hasMore={!!nextPageToken}
                  isLoadingMore={isLoadingMore}
                />
              )}
            </div>
          </div>
        </main>

        <SpotifyFooter />
      </div>
    </DragDropContext>
  );
}

export default function SpotifyPage() {
  return (
    <UnifiedProvider>
      <SpotifySearchContent />
    </UnifiedProvider>
  );
}
