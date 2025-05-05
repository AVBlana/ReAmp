"use client";

import { useEffect, useState, useContext } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import SpotifyPlayer from "../components/SpotifyPlayer/SpotifyPlayer";
import { PlayingProvider, PlayingContext } from "../../context/Playing";
import SpotifySearchResultsList from "../components/SpotifySearchResultsList";
import SpotifyPlaylistView from "../components/SpotifyPlaylistView/index";
import { searchSpotify } from "../components/Services/SpotifyService";
import { Song } from "../../types/playerTypes";
import { DragDropContext, DropResult, Droppable } from "@hello-pangea/dnd";
import { configureWebGL } from "../utils/webglConfig";
import { AppProvider } from "../AppContext";
import { FaSpotify, FaMusic } from "react-icons/fa";
import Header from "../components/Header";
import Search from "../components/Search";

// Helper function to safely access localStorage
const getLocalStorage = (key: string): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem(key);
  }
  return null;
};

function SpotifyContent() {
  const searchParams = useSearchParams();
  const accessToken = searchParams.get("access_token");
  const error = searchParams.get("error");
  const { playlist, setPlaylist, setCurrentSong } = useContext(PlayingContext);

  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [currentSearchTerm, setCurrentSearchTerm] = useState<string>("");

  const refreshToken = async () => {
    try {
      const response = await fetch("/api/spotify/refresh");
      if (!response.ok) {
        throw new Error("Failed to refresh token");
      }
      const data = await response.json();
      if (typeof window !== "undefined") {
        localStorage.setItem("spotify_token", data.access_token);
      }
      return data.access_token;
    } catch (error) {
      console.error("Error refreshing token:", error);
      return null;
    }
  };

  const handleSearch = async (searchTerm: string) => {
    setCurrentSearchTerm(searchTerm);
    const token = getLocalStorage("spotify_token");
    if (!token) return;

    try {
      const { items, nextPageToken } = await searchSpotify(searchTerm, token);
      setSearchResults(items);
      setNextPageToken(nextPageToken);
    } catch (err) {
      console.error("Error searching Spotify:", err);
      // If the error is due to an expired token, try to refresh it
      const newToken = await refreshToken();
      if (newToken) {
        const { items, nextPageToken } = await searchSpotify(
          searchTerm,
          newToken
        );
        setSearchResults(items);
        setNextPageToken(nextPageToken);
      }
    }
  };

  const handleLoadMore = async () => {
    if (nextPageToken && currentSearchTerm) {
      const token = getLocalStorage("spotify_token");
      if (!token) return;

      try {
        const { items, nextPageToken: newNextPageToken } = await searchSpotify(
          currentSearchTerm,
          token,
          nextPageToken
        );
        setSearchResults([...searchResults, ...items]);
        setNextPageToken(newNextPageToken);
      } catch (err) {
        console.error("Error loading more results:", err);
        // If the error is due to an expired token, try to refresh it
        const newToken = await refreshToken();
        if (newToken) {
          const { items, nextPageToken: newNextPageToken } =
            await searchSpotify(currentSearchTerm, newToken, nextPageToken);
          setSearchResults([...searchResults, ...items]);
          setNextPageToken(newNextPageToken);
        }
      }
    }
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("spotify_token");
      window.location.href = "/api/spotify/login";
    }
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    // Handle dropping to spotify player
    if (result.destination.droppableId === "spotify-player") {
      const songId = result.draggableId.replace(/^(vinyl-|list-)/, "");
      const song = playlist.find((s: Song) => s && s.id === songId);
      if (song) {
        setCurrentSong(song);
      }
      return;
    }

    // Handle reordering within the same area
    if (
      (result.destination.droppableId === "vinyl-slider" &&
        result.source.droppableId === "vinyl-slider") ||
      (result.destination.droppableId === "playlist-list" &&
        result.source.droppableId === "playlist-list")
    ) {
      const items = Array.from(playlist);
      const [reorderedItem] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reorderedItem);
      setPlaylist(items);
    }
  };

  useEffect(() => {
    if (accessToken && typeof window !== "undefined") {
      localStorage.setItem("spotify_token", accessToken);
    }
  }, [accessToken]);

  useEffect(() => {
    configureWebGL();
  }, []);

  // Add the animation styles
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes glow {
        0%, 100% {
          box-shadow: 0 0 10px rgba(29,185,84,0.6), 0 0 20px rgba(29,185,84,0.4);
        }
        50% {
          box-shadow: 0 0 30px rgba(29,185,84,0.8), 0 0 50px rgba(29,185,84,0.6);
        }
      }
      .animate-glow {
        animation: glow 1.5s ease-in-out infinite;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-gray-100">
        <div className="container mx-auto px-4 py-8">
          <div className="flex">
            <Link href="/" className="text-blue-600 hover:text-blue-800">
              ← Back to Home
            </Link>
          </div>
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <p className="text-xl text-red-600 mb-8">
              Error:{" "}
              {error === "no_code"
                ? "No authorization code received"
                : "Failed to get tokens"}
            </p>
            <Link
              href="/api/spotify/login"
              className="px-4 py-2 bg-[#1DB954] text-white rounded-full hover:bg-[#1DB954]/80 transition-all duration-300"
            >
              Try Again
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!accessToken && !getLocalStorage("spotify_token")) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-gray-100">
        <div className="container mx-auto px-4 py-8">
          <div className="flex">
            <Link href="/" className="text-blue-600 hover:text-blue-800">
              ← Back to Home
            </Link>
          </div>
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <p className="text-xl text-gray-600 mb-8">
              Please log in to Spotify to use the player
            </p>
            <Link
              href="/api/spotify/login"
              className="px-4 py-2 bg-[#1DB954] text-white rounded-full hover:bg-[#1DB954]/80 transition-all duration-300"
            >
              Log in with Spotify
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="min-h-screen bg-[#0A0A0A] text-gray-100">
        {/* Background Grid */}
        <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black_70%)]" />

        <Header
          icon={<FaSpotify className="text-[#1DB954]" size={32} />}
          title="ReAMP"
          searchComponent={<Search onSearch={handleSearch} />}
          onLogout={handleLogout}
          showLogout={true}
        />

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8 relative z-10">
          {/* Player and Playlist Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            {/* Player Section */}
            <div className="lg:col-span-2">
              <div className="relative rounded-2xl shadow-2xl p-4 overflow-visible bg-[#0A0A0A] border border-[#1DB954]/20 h-[700px]">
                <div className="absolute inset-0 bg-gradient-to-r from-[#1DB954]/5 to-transparent" />
                <div className="relative z-10 h-full flex flex-col">
                  <Droppable droppableId="spotify-player">
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`relative transition-all duration-300 flex-1 h-full overflow-visible pt-20 ${
                          snapshot.isDraggingOver
                            ? "ring-2 ring-[#1DB954] ring-opacity-50 shadow-[0_0_30px_rgba(29,185,84,0.5)] animate-glow"
                            : ""
                        }`}
                      >
                        <SpotifyPlayer />
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              </div>
            </div>

            {/* Playlist Section */}
            <div className="lg:col-span-1 flex gap-4">
              {/* My Playlists Section */}
              <div className="w-[50px] relative rounded-2xl shadow-2xl p-4 overflow-hidden bg-[#0A0A0A] border border-[#1DB954]/20 h-[700px]">
                <div className="absolute inset-0 bg-gradient-to-r from-[#1DB954]/5 to-transparent" />
                <div className="relative z-10 h-full flex flex-col items-center">
                  <FaMusic className="text-[#1DB954] text-xl mb-4" />
                  <div className="flex flex-col space-y-2">
                    <div className="w-[40px] h-[40px] rounded bg-[#1A1A1A] hover:bg-[#252525] transition-colors cursor-pointer relative overflow-hidden">
                      <div className="grid grid-rows-2 grid-cols-2 w-full h-full">
                        {playlist.slice(0, 4).map((song, index) => (
                          <div key={index} className="relative overflow-hidden">
                            <img
                              src={song.artwork.medium.url}
                              alt={song.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                        {playlist.length < 4 &&
                          Array(4 - playlist.length)
                            .fill(0)
                            .map((_, index) => (
                              <div
                                key={`empty-${index}`}
                                className="bg-[#2A2A2A]"
                              />
                            ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Playlist View */}
              <div className="flex-1 h-[700px] overflow-hidden">
                <div className="flex-1 overflow-hidden flex flex-col bg-[#0A0A0A] rounded-lg">
                  <SpotifyPlaylistView />
                </div>
              </div>
            </div>
          </div>

          {/* Search Results Section */}
          <div className="relative rounded-2xl shadow-2xl p-6 overflow-hidden bg-[#0A0A0A] border border-[#1DB954]/20">
            <div className="absolute inset-0 bg-gradient-to-r from-[#1DB954]/5 to-transparent" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#1DB954] to-[#1DB954]/80">
                  Search Results
                </h2>
                {searchResults.length > 0 && (
                  <span className="text-sm text-gray-300 bg-[#1DB954]/10 px-3 py-1 rounded-full">
                    {searchResults.length} results found
                  </span>
                )}
              </div>
              <SpotifySearchResultsList
                searchResults={searchResults}
                onLoadMore={handleLoadMore}
                hasMore={!!nextPageToken}
              />
            </div>
          </div>
        </main>
      </div>
    </DragDropContext>
  );
}

export default function SpotifyPage() {
  return (
    <PlayingProvider>
      <AppProvider>
        <SpotifyContent />
      </AppProvider>
    </PlayingProvider>
  );
}
