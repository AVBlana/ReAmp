"use client";

import YoutubeSearch from "../components/YoutubeSearch";
import YtSearchResultsList from "../components/YtSearchResultsList";
import PlaylistView from "../components/PlaylistView";
import {
  getYouTubeVideos,
  YoutubeVideo,
} from "../components/Services/YtService";
import Player from "../components/Player";
import { useYoutube, AppProvider } from "../AppContext/index";
import { FaYoutube, FaPlay, FaMusic } from "react-icons/fa";
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import { configureWebGL } from "../utils/webglConfig";
import { useEffect } from "react";
import Header from "../components/Header";

function YouTubeSearchContent() {
  const {
    searchResults,
    setSearchResults,
    selectedVideo,
    setSelectedVideo,
    youtubePlaylist,
    addToYoutubePlaylist,
    nextPageToken,
    setNextPageToken,
    currentSearchTerm,
    setCurrentSearchTerm,
    setYoutubePlaylist,
  } = useYoutube();

  useEffect(() => {
    configureWebGL();
  }, []);

  // Add the animation styles
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes glow {
        0%, 100% {
          box-shadow: 0 0 10px rgba(255,0,0,0.6), 0 0 20px rgba(255,0,0,0.4);
        }
        50% {
          box-shadow: 0 0 30px rgba(255,0,0,0.8), 0 0 50px rgba(255,0,0,0.6);
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
      const videoId = result.draggableId
        .replace("list-", "")
        .replace("thumbnail-", "");
      setSelectedVideo(videoId);
      return;
    }

    // Handle reordering within playlist
    if (
      (result.destination.droppableId === "playlist-list" &&
        result.source.droppableId === "playlist-list") ||
      (result.destination.droppableId === "thumbnail-slider" &&
        result.source.droppableId === "thumbnail-slider")
    ) {
      const items = Array.from(youtubePlaylist);
      const [reorderedItem] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reorderedItem);
      setYoutubePlaylist(items);
    }

    // Handle dropping from search results to playlist
    if (
      result.destination.droppableId === "playlist-list" &&
      result.source.droppableId === "search-results"
    ) {
      const videoId = result.draggableId;
      const video = searchResults.find((v) => v.id.videoId === videoId);
      if (video) {
        handleAddToPlaylist(video);
      }
    }
  };

  const handleAddToPlaylist = (video: YoutubeVideo) => {
    if (
      video &&
      !youtubePlaylist.some((item) => item.id.videoId === video.id.videoId)
    ) {
      addToYoutubePlaylist(video);
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="min-h-screen bg-[#0A0A0A] text-gray-100">
        {/* Background Grid */}
        <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black_70%)]" />

        <Header
          icon={<FaYoutube className="text-[#FF0000] animate-glow" size={24} />}
          title="YouTube Player"
          searchComponent={<YoutubeSearch onSearch={handleSearch} />}
        />

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8 relative z-10">
          {/* Player and Playlist Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            {/* Player Section */}
            <div className="lg:col-span-2">
              <div className="relative rounded-2xl shadow-2xl p-4 overflow-hidden bg-[#0A0A0A] border border-[#FF0000]/20 h-[600px]">
                <div className="absolute inset-0 bg-gradient-to-r from-[#FF0000]/5 to-transparent" />
                <div className="relative z-10 h-full flex flex-col">
                  <Droppable droppableId="video-player">
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`relative transition-all duration-300 flex-1 h-full ${
                          snapshot.isDraggingOver
                            ? "ring-2 ring-[#FF0000] ring-opacity-50 shadow-[0_0_30px_rgba(255,0,0,0.5)] animate-glow"
                            : ""
                        }`}
                      >
                        {selectedVideo ? (
                          <div className="relative h-full w-full">
                            <div className="absolute inset-0">
                              <Player />
                            </div>
                            {snapshot.isDraggingOver && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10 backdrop-blur-sm">
                                <div className="bg-[#FF0000]/80 rounded-full p-4 transform hover:scale-110 transition-transform duration-300 animate-pulse">
                                  <FaPlay className="text-white text-3xl" />
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="h-full w-full bg-[#0A0A0A] rounded-lg flex flex-col items-center justify-center relative overflow-hidden">
                            <div className="relative z-10 flex flex-col items-center space-y-4">
                              <div className="w-20 h-20 rounded-full bg-[#2A2A2A] flex items-center justify-center">
                                <FaPlay className="text-gray-400 text-3xl" />
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
            </div>

            {/* Playlist Section */}
            <div className="lg:col-span-1 flex gap-4">
              {/* My Playlists Section */}
              <div className="w-[50px] relative rounded-2xl shadow-2xl p-4 overflow-hidden bg-[#0A0A0A] border border-[#FF0000]/20 h-[700px]">
                <div className="absolute inset-0 bg-gradient-to-r from-[#FF0000]/5 to-transparent" />
                <div className="relative z-10 h-full flex flex-col items-center">
                  <FaMusic className="text-[#FF0000] text-xl mb-4" />
                  <div className="flex flex-col space-y-2">
                    <div className="w-[40px] h-[40px] rounded bg-[#1A1A1A] hover:bg-[#252525] transition-colors cursor-pointer relative overflow-hidden">
                      <div className="grid grid-rows-2 grid-cols-2 w-full h-full">
                        {youtubePlaylist.slice(0, 4).map((song, index) => (
                          <div key={index} className="relative overflow-hidden">
                            <img
                              src={song.snippet.thumbnails.medium.url}
                              alt={song.snippet.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                        {youtubePlaylist.length < 4 &&
                          Array(4 - youtubePlaylist.length)
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
                  <PlaylistView />
                </div>
              </div>
            </div>
          </div>

          {/* Search Results Section */}
          <div className="relative rounded-2xl shadow-2xl p-6 overflow-hidden bg-[#0A0A0A] border border-[#FF0000]/20">
            <div className="absolute inset-0 bg-gradient-to-r from-[#FF0000]/5 to-transparent" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FF0000] to-[#FF0000]/80">
                  Search Results
                </h2>
                {searchResults.length > 0 && (
                  <span className="text-sm text-gray-300 bg-[#FF0000]/10 px-3 py-1 rounded-full">
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
                    className="px-6 py-2 bg-[#FF0000] text-white rounded-full hover:bg-[#FF0000]/80 transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-[#FF0000]/20 hover:scale-105 border border-[#FF0000]/20"
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
        </main>

        {/* Footer */}
        <footer className="relative bg-[#0A0A0A]/80 backdrop-blur-md border-t border-[#FF0000]/10 mt-8">
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

export default function YouTubeSearch() {
  return (
    <AppProvider>
      <YouTubeSearchContent />
    </AppProvider>
  );
}
