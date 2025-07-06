"use client";

import YoutubeSearch from "../components/YoutubeSearch";
import YtSearchResultsList from "../components/YtSearchResultsList";
import YoutubePlaylistView from "../components/YoutubePlaylistView";
import { getYouTubeVideos } from "../components/Services/YtService";
import Player from "../components/Player";
import { useYoutube, UnifiedProvider } from "@/context/UnifiedContext";
import { FaYoutube, FaPlay } from "react-icons/fa";
import { DropResult } from "@hello-pangea/dnd";
import Header from "../components/Header";
import dynamic from "next/dynamic";
import { YouTubeFooter } from "../components/Footer";
import PlaylistLibrary from "../components/PlaylistLibrary";
import { motion } from "framer-motion";

// Dynamically import DragDropContext with no SSR
const DragDropContext = dynamic(
  () => import("@hello-pangea/dnd").then((mod) => mod.DragDropContext),
  { ssr: false }
);

const Droppable = dynamic(
  () => import("@hello-pangea/dnd").then((mod) => mod.Droppable),
  { ssr: false }
);

function YouTubeSearchContent() {
  const {
    searchResults,
    setSearchResults,
    selectedVideo,
    setSelectedVideo,
    playlist,
    addToPlaylist,
    nextPageToken,
    setNextPageToken,
    currentSearchTerm,
    setCurrentSearchTerm,
    setPlaylist,
  } = useYoutube();

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
        .replace("youtube-list-", "")
        .replace("youtube-slider-", "")
        .replace("list-", "")
        .replace("thumbnail-", "");
      setSelectedVideo(videoId);
      return;
    }

    // Handle reordering within playlist
    if (
      (result.destination.droppableId === "youtube-playlist" &&
        result.source.droppableId === "youtube-playlist") ||
      (result.destination.droppableId === "youtube-playlist-slider" &&
        result.source.droppableId === "youtube-playlist-slider")
    ) {
      const items = Array.from(playlist);
      const [reorderedItem] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reorderedItem);
      setPlaylist(items);
    }

    // Handle dropping from search results to playlist
    if (
      result.destination.droppableId === "youtube-playlist" &&
      result.source.droppableId === "search-results"
    ) {
      const videoId = result.draggableId;
      const video = searchResults.find((v) => v.id.videoId === videoId);
      if (video) {
        addToPlaylist(video);
      }
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="min-h-screen bg-[#0A0A0A] text-gray-100 flex flex-col">
        {/* Background Grid */}
        <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black_70%)]" />

        <Header
          icon={<FaYoutube className="text-[#FF0000]" size={24} />}
          title="YouTube Player"
          searchComponent={<YoutubeSearch onSearch={handleSearch} />}
        />

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8 relative z-10 flex-grow flex gap-4">
          <div className="flex-grow">
            {/* Player and Playlist Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Video Player */}
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                <Droppable droppableId="video-player">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="h-full w-full"
                    >
                      {selectedVideo ? (
                        <div className="relative h-full w-full">
                          <div className="absolute inset-0">
                            <Player />
                          </div>
                          {snapshot.isDraggingOver && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10 backdrop-blur-sm">
                              <motion.div
                                className="bg-[#FF0000]/80 rounded-full p-4"
                                whileHover={{ scale: 1.1 }}
                                animate={{
                                  boxShadow: [
                                    "0 0 10px rgba(255,0,0,0.6), 0 0 20px rgba(255,0,0,0.4)",
                                    "0 0 30px rgba(255,0,0,0.8), 0 0 50px rgba(255,0,0,0.6)",
                                    "0 0 10px rgba(255,0,0,0.6), 0 0 20px rgba(255,0,0,0.4)",
                                  ],
                                }}
                                transition={{
                                  duration: 1.5,
                                  repeat: Infinity,
                                  ease: "easeInOut",
                                }}
                              >
                                <FaPlay className="text-white text-3xl" />
                              </motion.div>
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

              <div className="flex gap-4 w-full">
                {/* Playlist Library */}
                <div className="flex-shrink-0">
                  <PlaylistLibrary
                    type="youtube"
                    theme={{
                      primary: "#FF0000",
                      secondary: "#ff4d4d",
                      accent: "#ff8080",
                    }}
                  />
                </div>
                {/* Playlist Section */}
                <div className="flex-1 h-[700px] overflow-hidden">
                  <YoutubePlaylistView />
                </div>
              </div>
            </div>

            {/* Search Results Section */}
            <div className="mt-8">
              <YtSearchResultsList
                results={searchResults}
                onLoadMore={handleLoadMore}
                hasMore={!!nextPageToken}
              />
            </div>
          </div>
        </main>

        <YouTubeFooter />
      </div>
    </DragDropContext>
  );
}

export default function YouTubePage() {
  return (
    <UnifiedProvider>
      <YouTubeSearchContent />
    </UnifiedProvider>
  );
}
