"use client";

import { useEffect, useState, useCallback } from "react";
import { FaPlay, FaMusic } from "react-icons/fa";
import { Droppable } from "@hello-pangea/dnd";
import { useUnifiedContext } from "@/context/UnifiedContext";
import { ServiceType, Song } from "@/types/playerTypes";
import { YoutubeVideo } from "../Services/YtService";
import Player from "../Player";
import SpotifyPlayer from "../SpotifyPlayer/SpotifyPlayer";

interface UnifiedPlayerProps {
  className?: string;
}

export default function UnifiedPlayer({ className = "" }: UnifiedPlayerProps) {
  const { youtube, spotify, unified } = useUnifiedContext();
  const [activeService, setActiveService] = useState<ServiceType | null>(null);

  // Determine which service is active based on the current state
  useEffect(() => {
    if (youtube.selectedVideo) {
      setActiveService(ServiceType.Youtube);
    } else if (spotify.currentSong) {
      setActiveService(ServiceType.Spotify);
    } else {
      setActiveService(null);
    }
  }, [youtube.selectedVideo, spotify.currentSong]);

  // Unified autoplay handler
  const handleAutoplay = useCallback(async () => {
    const currentItemId = youtube.selectedVideo || spotify.currentSong?.id;
    if (!currentItemId) return;

    // Find the current item's index in the unified playlist
    const currentIndex = unified.playlist.findIndex(
      (item) => item.id === currentItemId
    );

    // If we have a next item, play it
    if (currentIndex < unified.playlist.length - 1) {
      const nextItem = unified.playlist[currentIndex + 1];

      if (nextItem.type === ServiceType.Youtube) {
        // Switch to YouTube player
        const nextVideo = nextItem.data as YoutubeVideo;
        youtube.setSelectedVideo(nextVideo.id.videoId);
        spotify.setCurrentSong(null);
      } else if (nextItem.type === ServiceType.Spotify) {
        // Switch to Spotify player
        const nextSong = nextItem.data as Song;
        spotify.setCurrentSong(nextSong);
        youtube.setSelectedVideo(null);
      }
    } else {
      // End of playlist - stop all playback
      youtube.setSelectedVideo(null);
      spotify.setCurrentSong(null);
    }
  }, [unified.playlist, youtube, spotify]);

  // Listen for autoplay events from child components
  useEffect(() => {
    const handleAutoplayEvent = () => {
      handleAutoplay();
    };

    // Add event listener for autoplay events
    window.addEventListener("autoplay-next", handleAutoplayEvent);

    return () => {
      window.removeEventListener("autoplay-next", handleAutoplayEvent);
    };
  }, [handleAutoplay]);

  return (
    <div className={`w-full h-full relative flex flex-col ${className}`}>
      {/* Player Content */}
      <div className="w-full h-full flex flex-col min-h-0">
        {activeService === ServiceType.Youtube ? (
          <div className="w-full h-full flex flex-col min-h-0">
            {/* YouTube Player Container */}
            <div className="flex-1 relative w-full min-h-0">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-full max-w-full max-h-full">
                  <Player />
                </div>
              </div>
            </div>
          </div>
        ) : activeService === ServiceType.Spotify ? (
          <div className="w-full h-full flex flex-col min-h-0">
            {/* Spotify Player Container */}
            <div className="flex-1 relative w-full min-h-0">
              <div className="w-full h-full flex items-center justify-center p-1 sm:p-2 lg:p-4">
                <div className="w-full max-w-xl h-full max-h-full">
                  <SpotifyPlayer />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-black/20 rounded-lg p-4">
            <div className="text-gray-400 text-center">
              <FaMusic className="mx-auto mb-2" size={32} />
              <p className="text-sm sm:text-base">
                Select a video or song to play
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Droppable Area - Only active when dragging */}
      <Droppable droppableId="unified-player">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`absolute inset-0 z-10 transition-opacity duration-200 ${
              snapshot.isDraggingOver
                ? "opacity-100"
                : "opacity-0 pointer-events-none"
            }`}
          >
            {/* Drop Overlay */}
            {snapshot.isDraggingOver && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
                <div
                  className={`${
                    activeService === ServiceType.Youtube
                      ? "bg-[#FF0000]/80"
                      : activeService === ServiceType.Spotify
                      ? "bg-[#1DB954]/80"
                      : "bg-[#1DB954]/80"
                  } rounded-full p-4 sm:p-6 transform hover:scale-110 transition-transform duration-300 animate-pulse`}
                >
                  <FaPlay className="text-white text-2xl sm:text-4xl" />
                </div>
              </div>
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
