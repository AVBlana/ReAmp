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
import { configureWebGL } from "../utils/webglConfig";
import { SpotifyFooter } from "../components/Footer";
import PlaylistLibrary from "../components/PlaylistLibrary";
import { searchSpotify } from "../components/Services/SpotifyService";

function SpotifySearchContent() {
  const {
    searchResults,
    setSearchResults,
    playlist,
    setPlaylist,
    setCurrentSong,
    addToPlaylist,
  } = useSpotify();

  const [nextPageToken, setNextPageToken] = useState<string | null>(null);

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

  const handleLoadMore = async () => {
    if (!nextPageToken) return;
    // Implement load more functionality
    const { items, nextPageToken: newNextPageToken } = await searchSpotify(
      "",
      nextPageToken
    );
    setSearchResults([...searchResults, ...items]);
    setNextPageToken(newNextPageToken);
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

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="min-h-screen bg-[#0A0A0A] text-gray-100 flex flex-col">
        {/* Background Grid */}
        <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black_70%)]" />

        <Header
          icon={<FaSpotify className="text-[#1DB954]" size={24} />}
          title="Spotify Player"
          searchComponent={<SpotifySearch />}
        />

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8 relative z-10 flex-grow flex gap-4">
          <div className="flex-grow">
            {/* Player and Playlist Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Music Player */}
              <div className="relative aspect-square bg-black rounded-lg overflow-hidden">
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
              <SpotifySearchResultsList
                searchResults={searchResults}
                onLoadMore={handleLoadMore}
                hasMore={!!nextPageToken}
              />
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
