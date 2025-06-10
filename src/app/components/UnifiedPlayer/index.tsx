"use client";

import { useEffect, useState } from "react";
import { FaYoutube, FaSpotify, FaPlay, FaMusic } from "react-icons/fa";
import { Droppable } from "@hello-pangea/dnd";
import { useUnifiedContext } from "@/context/UnifiedContext";
import { ServiceType } from "@/types/playerTypes";
import Player from "../Player";
import SpotifyPlayer from "../SpotifyPlayer/SpotifyPlayer";

interface UnifiedPlayerProps {
  className?: string;
}

export default function UnifiedPlayer({ className = "" }: UnifiedPlayerProps) {
  const { youtube, spotify } = useUnifiedContext();
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

  return (
    <div className={`w-full h-full relative ${className}`}>
      {/* Player Content */}
      <div className="w-full h-full grid grid-rows-[1fr]">
        {activeService === ServiceType.Youtube ? (
          <div className="w-full h-full relative flex flex-col">
            {/* YouTube Player Container */}
            <div className="flex-1 relative min-h-[300px] w-full">
              <div className="absolute inset-0">
                <Player />
              </div>
            </div>
          </div>
        ) : activeService === ServiceType.Spotify ? (
          <div className="w-full h-full">
            <SpotifyPlayer />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-black/20 rounded-lg">
            <div className="text-gray-400 text-center">
              <FaMusic className="mx-auto mb-2" size={32} />
              <p>Select a video or song to play</p>
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
                  } rounded-full p-6 transform hover:scale-110 transition-transform duration-300 animate-pulse`}
                >
                  <FaPlay className="text-white text-4xl" />
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
