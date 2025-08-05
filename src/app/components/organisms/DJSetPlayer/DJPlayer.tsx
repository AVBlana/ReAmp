"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  FaPlay,
  FaPause,
  FaStop,
  FaVolumeUp,
  FaVolumeMute,
  FaTimes,
} from "react-icons/fa";
import { Droppable } from "@hello-pangea/dnd";
import { useUnifiedContext } from "@/app/context/UnifiedContext";
import { ServiceType, Song } from "@/app/types/playerTypes";
import Image from "next/image";
import { YoutubeVideo } from "@/app/types/youtubeTypes";
import { YouTubePlayer } from "@/app/types/youtube-api";

interface DJPlayerState {
  service: ServiceType | null;
  song: Song | YoutubeVideo | null;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  crossfade: number;
}

interface DJPlayerProps {
  playerId: "A" | "B";
  playerState: DJPlayerState;
  onStateChange: (newState: Partial<DJPlayerState>) => void;
  onClear: () => void;
  isActive: boolean;
}

export default function DJPlayer({
  playerId,
  playerState,
  onStateChange,
  onClear,
  isActive,
}: DJPlayerProps) {
  const { youtube, spotify, unified } = useUnifiedContext();
  const [localIsPlaying, setLocalIsPlaying] = useState(false);
  const [localVolume, setLocalVolume] = useState(100);
  const [localIsMuted, setLocalIsMuted] = useState(false);
  const [imageError, setImageError] = useState(false);

  // YouTube player refs
  const playerRef = useRef<YouTubePlayer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isApiReady, setIsApiReady] = useState(false);

  // Player-specific styling based on playerId
  const playerColor = playerId === "A" ? "#FF6B6B" : "#4ECDC4";
  const playerTitle = `Player ${playerId}`;

  // Handle dropping songs
  const handleDrop = useCallback(
    (draggableId: string) => {
      const [service, id] = draggableId.split("-");

      if (!service || !id) {
        console.warn("Invalid draggableId format:", draggableId);
        return;
      }

      let song: Song | YoutubeVideo | null = null;

      if (service === ServiceType.Youtube) {
        const video =
          youtube.searchResults.find((v) => v.id.videoId === id) ||
          (unified.playlist.find(
            (item) => item.id === id && item.type === ServiceType.Youtube
          )?.data as YoutubeVideo);

        if (video) {
          song = video;
        }
      } else if (service === ServiceType.Spotify) {
        const spotifySong =
          spotify.searchResults.find((s) => s.id === id) ||
          (unified.playlist.find(
            (item) => item.id === id && item.type === ServiceType.Spotify
          )?.data as Song);

        if (spotifySong) {
          song = spotifySong;
        }
      }

      if (song) {
        onStateChange({
          service: service as ServiceType,
          song,
          isPlaying: false,
          volume: 100,
          isMuted: false,
          crossfade: 0,
        });
      }
    },
    [
      youtube.searchResults,
      spotify.searchResults,
      unified.playlist,
      onStateChange,
    ]
  );

  // Listen for DJ player drop events
  useEffect(() => {
    const handleDJPlayerDrop = (event: CustomEvent) => {
      const { playerId: eventPlayerId, draggableId } = event.detail;
      if (eventPlayerId === playerId) {
        handleDrop(draggableId);
      }
    };

    window.addEventListener(
      "dj-player-drop",
      handleDJPlayerDrop as EventListener
    );

    return () => {
      window.removeEventListener(
        "dj-player-drop",
        handleDJPlayerDrop as EventListener
      );
    };
  }, [handleDrop, playerId]);

  // YouTube API setup
  useEffect(() => {
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];

    if (firstScriptTag && firstScriptTag.parentNode) {
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    window.onYouTubeIframeAPIReady = () => {
      setIsApiReady(true);
    };
  }, []);

  // Create YouTube player when needed
  useEffect(() => {
    if (
      !isApiReady ||
      !playerState.song ||
      playerState.service !== ServiceType.Youtube ||
      !containerRef.current
    ) {
      return;
    }

    const video = playerState.song as YoutubeVideo;

    // Clean up existing player
    if (playerRef.current) {
      try {
        playerRef.current.destroy();
      } catch (error) {
        console.error("Error destroying player:", error);
      }
      playerRef.current = null;
    }

    // Clear container
    if (containerRef.current) {
      containerRef.current.innerHTML = "";
    }
    // Create new player
    new window.YT.Player(containerRef.current, {
      videoId: video.id.videoId,
      playerVars: {
        autoplay: 0,
        modestbranding: 1,
        rel: 0,
        enablejsapi: 1,
        playsinline: 1,
        controls: 1,
      },
      events: {
        onReady: (event: { target: YouTubePlayer }) => {
          console.log(`Player ${playerId} YouTube ready`);
          playerRef.current = event.target;
        },
        onStateChange: (event: { data: number }) => {
          const state = event.data;
          if (state === window.YT.PlayerState.PLAYING) {
            setLocalIsPlaying(true);
          } else if (
            state === window.YT.PlayerState.PAUSED ||
            state === window.YT.PlayerState.ENDED
          ) {
            setLocalIsPlaying(false);
          }
        },
      },
    });

    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (error) {
          console.error("Error cleaning up player:", error);
        }
        playerRef.current = null;
      }
    };
  }, [isApiReady, playerState.song, playerState.service, playerId]);

  // Reset image error state when song changes
  useEffect(() => {
    setImageError(false);
  }, [playerState.song]);

  // Handle play/pause
  const handlePlayPause = useCallback(() => {
    if (playerState.service === ServiceType.Youtube && playerRef.current) {
      if (localIsPlaying) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
    } else if (playerState.service === ServiceType.Spotify) {
      // For Spotify, we'll use the main player but control it from here
      if (playerState.song) {
        if (localIsPlaying) {
          // Pause logic would go here
          setLocalIsPlaying(false);
        } else {
          // Play logic would go here
          setLocalIsPlaying(true);
        }
      }
    }
  }, [playerState.service, playerState.song, localIsPlaying]);

  // Handle stop
  const handleStop = useCallback(() => {
    if (playerState.service === ServiceType.Youtube && playerRef.current) {
      playerRef.current.stopVideo();
    }
    setLocalIsPlaying(false);
  }, [playerState.service]);

  // Handle volume
  const handleVolumeChange = useCallback(
    (volume: number) => {
      setLocalVolume(volume);
      if (playerState.service === ServiceType.Youtube && playerRef.current) {
        playerRef.current.setVolume(volume);
      }
    },
    [playerState.service]
  );

  // Handle mute
  const handleMute = useCallback(() => {
    setLocalIsMuted(!localIsMuted);
    if (playerState.service === ServiceType.Youtube && playerRef.current) {
      if (localIsMuted) {
        playerRef.current.unMute();
      } else {
        playerRef.current.mute();
      }
    }
  }, [playerState.service, localIsMuted]);

  return (
    <div
      className={`relative bg-black/30 rounded-lg p-4 flex flex-col h-full min-h-[400px] ${
        isActive ? "ring-2 ring-white/50" : ""
      }`}
    >
      {/* Player Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold" style={{ color: playerColor }}>
          {playerTitle}
        </h3>
        <div className="flex items-center gap-2">
          {playerState.service && (
            <div
              className={`px-2 py-1 rounded text-xs font-medium ${
                playerState.service === ServiceType.Youtube
                  ? "bg-red-600/80"
                  : "bg-green-600/80"
              }`}
            >
              {playerState.service === ServiceType.Youtube
                ? "YouTube"
                : "Spotify"}
            </div>
          )}
        </div>
      </div>

      {/* Player Content */}
      <div className="flex-1 relative min-h-0">
        <Droppable droppableId={`dj-player-${playerId}`}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`w-full h-full relative ${
                snapshot.isDraggingOver ? "ring-2 ring-white/50" : ""
              }`}
            >
              {playerState.song ? (
                <div className="w-full h-full">
                  {playerState.service === ServiceType.Youtube ? (
                    <div className="w-full h-full">
                      <div
                        ref={containerRef}
                        className="w-full h-full"
                        style={{
                          minHeight: "280px",
                          aspectRatio: "16/9",
                          maxHeight: "calc(100vh - 120px)",
                          backgroundColor: "#000",
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full bg-black/20 rounded-lg flex items-center justify-center">
                      <div className="text-center text-gray-400">
                        <div className="mb-4">
                          {!imageError ? (
                            <Image
                              src={
                                (playerState.song as Song).artwork?.medium
                                  ?.url || ""
                              }
                              alt="Album Art"
                              width={128}
                              height={128}
                              className="w-32 h-32 object-cover rounded-lg mx-auto"
                              priority={false}
                              unoptimized={false}
                              onError={() => setImageError(true)}
                              onLoad={() => setImageError(false)}
                            />
                          ) : (
                            <div className="w-32 h-32 bg-gray-700 rounded-lg mx-auto flex items-center justify-center">
                              <FaPlay className="text-gray-400" size={24} />
                            </div>
                          )}
                        </div>
                        <h4 className="font-medium text-white mb-2">
                          {(playerState.song as Song).title}
                        </h4>
                        <p className="text-sm text-gray-400">
                          {(playerState.song as Song).artist?.name}
                        </p>
                        <div className="mt-4 flex items-center justify-center gap-2">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              localIsPlaying
                                ? "bg-green-500 animate-pulse"
                                : "bg-gray-500"
                            }`}
                          ></div>
                          <span className="text-xs text-gray-400">
                            {localIsPlaying ? "Playing" : "Ready"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center border-2 border-dashed rounded-lg transition-all duration-200 border-gray-600/50">
                  <div className="text-center text-gray-400">
                    <FaPlay className="mx-auto mb-2" size={24} />
                    <p className="text-sm">Drop a song here</p>
                  </div>
                </div>
              )}

              {/* Drop overlay when dragging over existing content */}
              {snapshot.isDraggingOver && playerState.song && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm z-10">
                  <div className="bg-white/20 rounded-full p-4 transform hover:scale-110 transition-transform duration-300 animate-pulse">
                    <FaPlay className="text-white text-2xl" />
                  </div>
                </div>
              )}

              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </div>

      {/* Player Controls */}
      {playerState.song && (
        <div className="mt-4 space-y-3">
          {/* Control Buttons */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handlePlayPause}
              className={`p-2 rounded-full transition-all ${
                localIsPlaying
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {localIsPlaying ? <FaPause size={16} /> : <FaPlay size={16} />}
            </button>

            <button
              onClick={handleStop}
              className="p-2 rounded-full bg-gray-600 hover:bg-gray-700 transition-all"
            >
              <FaStop size={16} />
            </button>

            {/* Active indicator */}
            <div
              className={`px-2 py-1 rounded text-xs font-medium ${
                isActive
                  ? "bg-yellow-600/80 text-white"
                  : "bg-gray-600/80 text-gray-300"
              }`}
            >
              {isActive ? "ACTIVE" : "READY"}
            </div>

            {/* Clear button */}
            <button
              onClick={onClear}
              className="p-2 rounded-full bg-red-600/80 hover:bg-red-700/80 transition-all"
              title="Clear player"
            >
              <FaTimes size={14} />
            </button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleMute}
              className="text-gray-400 hover:text-white transition-colors"
            >
              {localIsMuted ? (
                <FaVolumeMute size={14} />
              ) : (
                <FaVolumeUp size={14} />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={localVolume}
              onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
              className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, ${playerColor} 0%, ${playerColor} ${localVolume}%, #374151 ${localVolume}%, #374151 100%)`,
              }}
            />
            <span className="text-xs text-gray-400 w-8 text-right">
              {localVolume}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
