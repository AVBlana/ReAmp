"use client";

import Search from "../components/Search";
import YtSearchResultsList from "../components/YtSearchResultsList";
import PlaylistView from "../components/PlaylistView";
import { getYouTubeVideos } from "../components/Services/YtService";
import Player from "../components/Player";
import { useAppContext } from "../AppContext";
import Link from "next/link";
import { FaYoutube, FaHome, FaPlay } from "react-icons/fa";
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import { configureWebGL } from "../utils/webglConfig";
import { useEffect } from "react";

export default function YouTubeSearch() {
  const {
    searchResults,
    setSearchResults,
    setSelectedVideo,
    nextPageToken,
    setNextPageToken,
    currentSearchTerm,
    setCurrentSearchTerm,
    selectedVideo,
    playlist,
    setPlaylist,
  } = useAppContext();

  useEffect(() => {
    configureWebGL();
  }, []);

  const handleSearch = async (searchTerm: string) => {
    setCurrentSearchTerm(searchTerm);
    const { items, nextPageToken } = await getYouTubeVideos(searchTerm);
    setSearchResults(items);
    setNextPageToken(nextPageToken);
  };

  const handleLoadMore = async () => {
    if (nextPageToken && currentSearchTerm) {
      const { items, nextPageToken: newNextPageToken } = await getYouTubeVideos(
        currentSearchTerm,
        nextPageToken
      );
      setSearchResults([...searchResults, ...items]);
      setNextPageToken(newNextPageToken);
    }
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    // Handle dropping to video player
    if (result.destination.droppableId === "video-player") {
      const videoId = result.draggableId;
      setSelectedVideo(videoId);
      return;
    }

    // Handle reordering within playlist
    if (
      result.destination.droppableId === "playlist" &&
      result.source.droppableId === "playlist"
    ) {
      const items = Array.from(playlist);
      const [reorderedItem] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reorderedItem);
      setPlaylist(items);
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="min-h-screen bg-[#121212] text-gray-100">
        {/* Header */}
        <header className="bg-black/80 border-b border-white/10 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center justify-between w-full md:w-auto">
                <div className="flex items-center space-x-2">
                  <FaYoutube className="text-red-600" size={32} />
                  <h1 className="text-2xl font-bold text-white">ReAMP</h1>
                </div>
                <Link
                  href="/"
                  className="text-gray-400 hover:text-white transition-colors md:hidden"
                >
                  <FaHome size={24} />
                </Link>
              </div>
              <div className="w-full md:w-1/2 lg:w-1/3">
                <Search onSearch={handleSearch} />
              </div>
              <div className="hidden md:flex items-center">
                <Link
                  href="/"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <FaHome size={24} />
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          {/* Player Section */}
          <div className="relative rounded-2xl shadow-2xl p-6 mb-8 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B6B]/20 via-[#FF6B6B]/15 to-[#FF6B6B]/10"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,107,107,0.2),transparent)]"></div>
            <div className="relative z-10">
              <Droppable droppableId="video-player">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`relative transition-all duration-300 ${
                      snapshot.isDraggingOver ? "ring-2 ring-[#FF6B6B]" : ""
                    }`}
                  >
                    {selectedVideo ? (
                      <div className="relative">
                        <Player />
                        {snapshot.isDraggingOver && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                            <div className="bg-[#FF6B6B]/80 rounded-full p-4">
                              <FaPlay className="text-white text-3xl" />
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="aspect-video w-full bg-gray-900 rounded-lg flex flex-col items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 animate-pulse"></div>
                        <div className="relative z-10 flex flex-col items-center space-y-4">
                          <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center">
                            <FaPlay className="text-gray-500 text-3xl" />
                          </div>
                          <p className="text-gray-400 text-lg">
                            {snapshot.isDraggingOver
                              ? "Drop to play"
                              : "Select a video to play"}
                          </p>
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
                <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B6B]/20 via-[#FF6B6B]/15 to-[#FF6B6B]/10"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,107,107,0.2),transparent)]"></div>
                <div className="relative z-10">
                  <PlaylistView />
                </div>
              </div>
            </div>

            {/* Search Results Section */}
            <div className="lg:col-span-2">
              <div className="relative rounded-2xl shadow-2xl p-6 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B6B]/20 via-[#FF6B6B]/15 to-[#FF6B6B]/10"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,107,107,0.2),transparent)]"></div>
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
                  <YtSearchResultsList
                    searchResults={searchResults}
                    setSelectedVideo={setSelectedVideo}
                  />
                  {nextPageToken && (
                    <div className="mt-6 flex justify-center">
                      <button
                        onClick={handleLoadMore}
                        className="px-6 py-2 bg-[#FF6B6B] text-white rounded-full hover:bg-[#FF6B6B]/80 transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-[#FF6B6B]/20 hover:scale-105"
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

        {/* Footer */}
        <footer className="bg-black/80 border-t border-white/10 mt-8">
          <div className="container mx-auto px-4 py-6">
            <div className="text-center text-gray-400">
              <p>© 2024 ReAMP. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </DragDropContext>
  );
}
