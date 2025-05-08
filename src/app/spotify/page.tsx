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
import { useEffect } from "react";
import { configureWebGL } from "../utils/webglConfig";

function SpotifySearchContent() {
  const {
    searchResults,
    setCurrentSong,
    playlist,
    addToPlaylist,
    setPlaylist,
  } = useSpotify();

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

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    // Handle dropping to player
    if (result.destination.droppableId === "spotify-player") {
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
      (result.destination.droppableId === "spotify-playlist" &&
        result.source.droppableId === "spotify-playlist") ||
      (result.destination.droppableId === "spotify-playlist-slider" &&
        result.source.droppableId === "spotify-playlist-slider")
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
      <div className="min-h-screen bg-[#0A0A0A] text-gray-100">
        {/* Background Grid */}
        <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black_70%)]" />

        <Header
          icon={<FaSpotify className="text-[#1DB954]" size={24} />}
          title="Spotify Player"
          searchComponent={<SpotifySearch />}
        />

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8 relative z-10">
          {/* Player and Playlist Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Player */}
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

            {/* Playlist Section */}
            <div className="h-[700px]">
              <SpotifyPlaylistView />
            </div>
          </div>

          {/* Search Results Section */}
          <div className="mt-8">
            <Droppable droppableId="search-results">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="w-full"
                >
                  <SpotifySearchResultsList
                    searchResults={searchResults}
                    onLoadMore={() => {}}
                    hasMore={false}
                  />
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        </main>
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
