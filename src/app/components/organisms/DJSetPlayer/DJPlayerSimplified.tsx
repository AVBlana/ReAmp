"use client";

import React, { useState } from "react";
import {
  FaPlay,
  FaPause,
  FaStop,
  FaVolumeUp,
  FaVolumeMute,
  FaTimes,
} from "react-icons/fa";
import { ServiceType } from "@/app/types/playerTypes";
import Image from "next/image";

// Import atoms
import Button from "@/app/components/atoms/Button";
import ProgressBar from "@/app/components/atoms/ProgressBar";
import ControlButton from "@/app/components/atoms/ControlButton";
import TimeDisplay from "@/app/components/atoms/TimeDisplay";

// Import molecules
import CrossfadeControls from "@/app/components/molecules/CrossfadeControls";
import VolumeControl from "@/app/components/molecules/VolumeControl";

interface DJPlayerSimplifiedProps {
  className?: string;
}

interface PlayerState {
  service: ServiceType | null;
  song: {
    id: string;
    title: string;
    artist?: string;
    thumbnail?: string;
    duration?: number;
  } | null;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  currentTime: number;
  duration: number;
  isActive: boolean;
}

const DJPlayerSimplified: React.FC<DJPlayerSimplifiedProps> = ({
  className = "",
}) => {
  const [players, setPlayers] = useState<{
    A: PlayerState;
    B: PlayerState;
  }>({
    A: {
      service: null,
      song: null,
      isPlaying: false,
      volume: 100,
      isMuted: false,
      currentTime: 0,
      duration: 180,
      isActive: false,
    },
    B: {
      service: null,
      song: null,
      isPlaying: false,
      volume: 100,
      isMuted: false,
      currentTime: 0,
      duration: 180,
      isActive: false,
    },
  });

  const [crossfadeEnabled, setCrossfadeEnabled] = useState(false);
  const [crossfadePercentage, setCrossfadePercentage] = useState(50);

  const updatePlayer = (playerId: "A" | "B", updates: Partial<PlayerState>) => {
    setPlayers((prev) => ({
      ...prev,
      [playerId]: { ...prev[playerId], ...updates },
    }));
  };

  const handlePlay = (playerId: "A" | "B") => {
    updatePlayer(playerId, { isPlaying: true });
  };

  const handlePause = (playerId: "A" | "B") => {
    updatePlayer(playerId, { isPlaying: false });
  };

  const handleStop = (playerId: "A" | "B") => {
    updatePlayer(playerId, {
      isPlaying: false,
      currentTime: 0,
    });
  };

  const handleVolumeChange = (playerId: "A" | "B", volume: number) => {
    updatePlayer(playerId, { volume });
  };

  const handleSeek = (playerId: "A" | "B", time: number) => {
    updatePlayer(playerId, { currentTime: time });
  };

  const handleMuteToggle = (playerId: "A" | "B") => {
    const player = players[playerId];
    updatePlayer(playerId, { isMuted: !player.isMuted });
  };

  const handleClear = (playerId: "A" | "B") => {
    updatePlayer(playerId, {
      service: null,
      song: null,
      isPlaying: false,
      volume: 100,
      isMuted: false,
      currentTime: 0,
      duration: 180,
      isActive: false,
    });
  };

  const renderVinylPlayer = (playerId: "A" | "B") => {
    const player = players[playerId];
    const playerColor = playerId === "A" ? "red" : "teal";

    return (
      <div className="relative w-full h-full flex flex-col items-center justify-center">
        {/* Vinyl Player Container */}
        <div className="relative w-64 h-64 mb-4">
          {/* Vinyl Disk */}
          <div
            className={`absolute inset-0 rounded-full bg-[url('/vinylDisk.png')] bg-center bg-no-repeat bg-[length:120%_120%] cursor-pointer transition-all duration-200 ${
              player.isPlaying ? "animate-spin" : ""
            }`}
            style={{
              animationDuration: "33.3s",
              animationTimingFunction: "linear",
            }}
          >
            {/* Album Art - Centered */}
            <div className="absolute left-1/2 top-1/2 w-[68%] h-[68%] -translate-x-1/2 -translate-y-1/2 z-10">
              <div className="w-full h-full rounded-full bg-black shadow-[0_0_0_3px_#FF6B6B,0_0_18px_#fff8_inset] overflow-hidden">
                {player.song?.thumbnail ? (
                  <Image
                    src={player.song.thumbnail}
                    alt={player.song.title}
                    fill
                    className="object-cover rounded-full"
                    sizes="128px"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center rounded-full">
                    <span className="text-gray-400 text-xs">No Track</span>
                  </div>
                )}
              </div>
            </div>

            {/* Center Black Dot */}
            <div className="absolute left-1/2 top-1/2 w-6 h-6 -translate-x-1/2 -translate-y-1/2 z-20">
              <div className="w-full h-full rounded-full bg-black border-3 border-[#FF6B6B]" />
            </div>
          </div>

          {/* Needle */}
          <div
            className="absolute top-0 right-0 w-1/3 h-1/3 pointer-events-none z-20"
            style={{
              transformOrigin: "center center",
              transform: "translate(25%, -25%)",
            }}
          >
            <div className="relative w-full h-full flex flex-col items-center">
              {/* Needle Base Circle */}
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-red-400 to-red-600 border-2 border-red-300 shadow-[0_0_20px_rgba(255,107,107,0.8),inset_0_0_10px_rgba(255,107,107,0.4)] z-30" />

              {/* Main Needle Arm */}
              <div className="w-1.5 h-16 bg-gradient-to-b from-red-400 via-red-500 to-red-600 rounded-full shadow-[0_0_15px_rgba(255,107,107,0.6)] z-20" />

              {/* Needle Tip */}
              <div className="w-0.5 h-5 bg-gradient-to-b from-red-300 to-red-500 rounded-full shadow-[0_0_10px_rgba(255,107,107,0.8)] z-25" />

              {/* Holographic Counterweight */}
              <div className="absolute top-0 -ml-6 w-3 h-2 bg-gradient-to-r from-red-400 to-red-500 rounded-full shadow-[0_0_10px_rgba(255,107,107,0.6)] z-25" />
            </div>
          </div>
        </div>

        {/* Song Info */}
        <div className="mb-4 text-center">
          {player.song ? (
            <>
              <div className="text-white text-sm font-mono truncate max-w-[200px]">
                {player.song.title}
              </div>
              <div className="text-gray-400 text-xs truncate max-w-[200px]">
                {player.song.artist}
              </div>
            </>
          ) : (
            <>
              <div className="text-gray-400 text-sm font-mono">
                NO TRACK LOADED
              </div>
              <div className="text-gray-500 text-xs">Drop a track here</div>
            </>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-[300px] mb-4">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <TimeDisplay time={player.currentTime} format="short" />
            <TimeDisplay time={player.duration} format="short" />
          </div>
          <ProgressBar
            currentTime={player.currentTime}
            duration={player.duration}
            onSeek={(time) => handleSeek(playerId, time)}
            color={playerColor}
            showTime={false}
          />
        </div>

        {/* Controls */}
        <div className="flex justify-center items-center gap-3 mb-4">
          <ControlButton
            icon={
              player.isPlaying ? <FaPause size={20} /> : <FaPlay size={20} />
            }
            variant={player.isPlaying ? "danger" : "primary"}
            onClick={() =>
              player.isPlaying ? handlePause(playerId) : handlePlay(playerId)
            }
          />
          <ControlButton
            icon={<FaStop size={20} />}
            variant="ghost"
            onClick={() => handleStop(playerId)}
          />
          <ControlButton
            icon={
              player.isMuted ? (
                <FaVolumeMute size={18} />
              ) : (
                <FaVolumeUp size={18} />
              )
            }
            variant="ghost"
            onClick={() => handleMuteToggle(playerId)}
          />
        </div>

        {/* Volume Control */}
        <VolumeControl
          volume={player.volume / 100}
          onVolumeChange={(vol) => handleVolumeChange(playerId, vol * 100)}
          onMute={() => handleMuteToggle(playerId)}
          isMuted={player.isMuted}
          showSlider
          playerColor={playerId === "A" ? "#FF6B6B" : "#4ECDC4"}
        />
      </div>
    );
  };

  const renderPlayer = (playerId: "A" | "B") => {
    const player = players[playerId];
    const playerColor = playerId === "A" ? "#FF6B6B" : "#4ECDC4";
    const playerTitle = `DECK ${playerId}`;

    return (
      <div
        className={`relative bg-black/30 rounded-lg p-4 flex flex-col h-full min-h-[400px] ${
          player.isActive ? "ring-2 ring-white/50" : ""
        }`}
      >
        {/* Player Header */}
        <div className="flex items-center justify-between mb-4">
          <h3
            className="text-lg font-bold font-mono"
            style={{ color: playerColor }}
          >
            {playerTitle}
          </h3>
          <div className="flex items-center gap-2">
            {player.service && (
              <div
                className={`px-2 py-1 rounded text-xs font-medium ${
                  player.service === ServiceType.Youtube
                    ? "bg-red-600/80"
                    : "bg-green-600/80"
                }`}
              >
                {player.service === ServiceType.Youtube ? "YouTube" : "Spotify"}
              </div>
            )}
          </div>
        </div>

        {/* Player Content */}
        <div className="flex-1 relative min-h-0">
          {player.song ? (
            renderVinylPlayer(playerId)
          ) : (
            <div className="w-full h-full flex items-center justify-center border-2 border-dashed rounded-lg transition-all duration-200 border-gray-600/50">
              <div className="text-center text-gray-400">
                <div className="text-lg font-mono mb-2">{playerTitle}</div>
                <div className="text-sm">Drop a track here</div>
              </div>
            </div>
          )}
        </div>

        {/* Player Controls */}
        {player.song && (
          <div className="mt-4 space-y-3">
            {/* Control Buttons */}
            <div className="flex items-center justify-center gap-3">
              {/* Active indicator */}
              <div
                className={`px-2 py-1 rounded text-xs font-medium ${
                  player.isActive
                    ? "bg-yellow-600/80 text-white"
                    : "bg-gray-600/80 text-gray-300"
                }`}
              >
                {player.isActive ? "ACTIVE" : "READY"}
              </div>

              {/* Clear button */}
              <ControlButton
                icon={<FaTimes size={14} />}
                variant="danger"
                onClick={() => handleClear(playerId)}
                title="Clear player"
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Main DJ Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {renderPlayer("A")}
        {renderPlayer("B")}
      </div>

      {/* Crossfade Controls */}
      <CrossfadeControls
        enabled={crossfadeEnabled}
        percentage={crossfadePercentage}
        onToggle={() => setCrossfadeEnabled(!crossfadeEnabled)}
        onChange={setCrossfadePercentage}
      />

      {/* Demo Controls */}
      <div className="bg-black/30 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4 text-center">
          Demo Controls
        </h3>
        <div className="flex justify-center gap-4">
          <Button
            variant="primary"
            onClick={() =>
              updatePlayer("A", {
                service: ServiceType.Spotify,
                song: {
                  id: "demo-1",
                  title: "Demo Song A",
                  artist: "Demo Artist",
                  thumbnail: "https://via.placeholder.com/150",
                  duration: 180,
                },
                isActive: true,
              })
            }
          >
            Load Demo A
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              updatePlayer("B", {
                service: ServiceType.Youtube,
                song: {
                  id: "demo-2",
                  title: "Demo Song B",
                  artist: "Demo Artist",
                  thumbnail: "https://via.placeholder.com/150",
                  duration: 240,
                },
                isActive: true,
              })
            }
          >
            Load Demo B
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DJPlayerSimplified;
