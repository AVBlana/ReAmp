"use client";

import { useEffect, useState, useContext } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import SpotifyPlayer from "../components/SpotifyPlayer/SpotifyPlayer";
import { AppProvider } from "../../context/App";
import { PlayingProvider, PlayingContext } from "../../context/Playing";
import SpotifySearch from "../components/SpotifySearch";
import SpotifySearchResultsList from "../components/SpotifySearchResultsList";
import SpotifyPlaylistView from "../components/SpotifyPlaylistView/index";
import { searchSpotify } from "../components/Services/SpotifyService";
import { Song } from "../../types/playerTypes";
import { FaSpotify, FaPlay } from "react-icons/fa";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { DragDropContext, DropResult, Droppable } from "@hello-pangea/dnd";

function SpotifyContent() {
  const searchParams = useSearchParams();
  const accessToken = searchParams.get("access_token");
  const error = searchParams.get("error");
  const { playlist, setPlaylist, setCurrentSong, currentSong } =
    useContext(PlayingContext);

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
      localStorage.setItem("spotify_token", data.access_token);
      return data.access_token;
    } catch (error) {
      console.error("Error refreshing token:", error);
      return null;
    }
  };

  const handleSearch = async (searchTerm: string) => {
    setCurrentSearchTerm(searchTerm);
    const token = localStorage.getItem("spotify_token");
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
      const token = localStorage.getItem("spotify_token");
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
    localStorage.removeItem("spotify_token");
    window.location.href = "/api/spotify/login";
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    // Handle dropping to spotify player
    if (result.destination.droppableId === "spotify-player") {
      const songId = result.draggableId.replace(/^(vinyl-|list-)/, "");
      const song = playlist.find((s: Song) => s.id === songId);
      if (song) {
        // If the song is already playing, restart it
        if (song.id === currentSong?.id) {
          setCurrentSong(null);
          setTimeout(() => setCurrentSong(song), 0);
        } else {
          setCurrentSong(song);
        }
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
    if (accessToken) {
      localStorage.setItem("spotify_token", accessToken);
    }
  }, [accessToken]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#121212] text-gray-100">
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
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Try Again
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!accessToken && !localStorage.getItem("spotify_token")) {
    return (
      <div className="min-h-screen bg-[#121212] text-gray-100">
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
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
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
      <div className="min-h-screen bg-[#121212] text-gray-100">
        <Header
          icon={<FaSpotify className="text-green-500" size={32} />}
          title="ReAMP"
          searchComponent={<SpotifySearch onSearch={handleSearch} />}
          onLogout={handleLogout}
          showLogout={true}
        />

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          {/* Player Section */}
          <div className="relative rounded-2xl shadow-2xl p-6 mb-8 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#1DB954]/30 via-[#1DB954]/20 to-[#1DB954]/10"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(29,185,84,0.3),transparent)]"></div>
            <div className="relative z-10">
              <Droppable droppableId="spotify-player">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`relative transition-all duration-300 ${
                      snapshot.isDraggingOver ? "ring-2 ring-[#1DB954]" : ""
                    }`}
                  >
                    <SpotifyPlayer />
                    {snapshot.isDraggingOver && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                        <div className="bg-[#1DB954]/80 rounded-full p-4">
                          <FaPlay className="text-white text-3xl" />
                        </div>
                      </div>
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Playlist Section */}
            <div className="lg:col-span-1">
              <div className="relative rounded-2xl shadow-2xl p-6 sticky top-24 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#1DB954]/30 via-[#1DB954]/20 to-[#1DB954]/10"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(29,185,84,0.3),transparent)]"></div>
                <div className="relative z-10">
                  <SpotifyPlaylistView />
                </div>
              </div>
            </div>

            {/* Search Results Section */}
            <div className="lg:col-span-2">
              <div className="relative rounded-2xl shadow-2xl p-6 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#1DB954]/30 via-[#1DB954]/20 to-[#1DB954]/10"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(29,185,84,0.3),transparent)]"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">
                      Search Results
                    </h2>
                    {searchResults.length > 0 && (
                      <span className="text-sm text-gray-400">
                        {searchResults.length} results found
                      </span>
                    )}
                  </div>
                  <SpotifySearchResultsList searchResults={searchResults} />
                  {nextPageToken && (
                    <div className="mt-6 flex justify-center">
                      <button
                        onClick={handleLoadMore}
                        className="px-6 py-2 bg-[#1DB954] text-white rounded-full hover:bg-[#1DB954]/80 transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-[#1DB954]/20 hover:scale-105"
                      >
                        <span>Load More</span>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </DragDropContext>
  );
}

export default function SpotifySearchPage() {
  return (
    <AppProvider>
      <PlayingProvider>
        <SpotifyContent />
      </PlayingProvider>
    </AppProvider>
  );
}
