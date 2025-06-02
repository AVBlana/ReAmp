"use client";

import { useEffect, useState } from "react";
import { FaYoutube, FaSpotify, FaPlay } from "react-icons/fa";
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
    <div className={`relative h-full w-full ${className}`}>
      {/* Player Content */}
      <div className="absolute inset-0 z-0">
        {activeService === ServiceType.Youtube ? (
          <Player />
        ) : activeService === ServiceType.Spotify ? (
          <SpotifyPlayer />
        ) : (
          <div className="h-full w-full bg-[#0A0A0A] rounded-lg flex flex-col items-center justify-center">
            <div className="relative z-10 flex flex-col items-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-[#2A2A2A] flex items-center justify-center">
                <FaPlay className="text-gray-400 text-3xl" />
              </div>
              <p className="text-gray-400 text-lg">Select a track to play</p>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <FaYoutube className="text-[#FF0000]" size={16} />
                  <span className="text-sm text-gray-400">YouTube</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FaSpotify className="text-[#1DB954]" size={16} />
                  <span className="text-sm text-gray-400">Spotify</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Droppable Area - Always on top */}
      <Droppable droppableId="unified-player">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="absolute inset-0 z-50"
            style={{ pointerEvents: snapshot.isDraggingOver ? "auto" : "none" }}
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
                  } rounded-full p-4 transform hover:scale-110 transition-transform duration-300 animate-pulse`}
                >
                  <FaPlay className="text-white text-3xl" />
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
