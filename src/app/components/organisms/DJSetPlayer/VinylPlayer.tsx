"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useAnimation, AnimatePresence } from "framer-motion";
import {
  FaPlay,
  FaPause,
  FaStop,
  FaVolumeUp,
  FaVolumeMute,
} from "react-icons/fa";
import { Song, ServiceType } from "@/app/types/playerTypes";
import { YoutubeVideo } from "@/app/types/youtubeTypes";
import Image from "next/image";

interface DJPlayerState {
  service: ServiceType | null;
  song: Song | YoutubeVideo | null;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  crossfade: number;
  currentTime: number;
  duration: number;
  isActive: boolean;
  playerId: string;
}

interface VinylPlayerProps {
  playerId: "A" | "B";
  playerState: DJPlayerState;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onVolumeChange: (volume: number) => void;
  onMuteToggle: () => void;
  onScratch: (direction: "forward" | "backward") => void;
  onSeek: (position: number) => void;
}

export default function VinylPlayer({
  playerId,
  playerState,
  onPlay,
  onPause,
  onStop,
  onVolumeChange,
  onMuteToggle,
  onScratch,
  onSeek,
}: VinylPlayerProps) {
  const vinylRef = useRef<HTMLDivElement>(null);
  const needleRef = useRef<HTMLDivElement>(null);
  const artworkRef = useRef<HTMLDivElement>(null);
  const seekBarRef = useRef<HTMLDivElement>(null);
  const vinylControls = useAnimation();
  const needleControls = useAnimation();
  const [seekPreview, setSeekPreview] = useState<number | null>(null);
  const [isScratching, setIsScratching] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const lastMouseX = useRef(0);

  const handleVinylDrag = (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: { velocity: { x: number; y: number } }
  ) => {
    const velocity = Math.abs(info.velocity.x);
    if (velocity > 500) {
      setIsScratching(true);
      setTimeout(() => setIsScratching(false), 200);

      // Actually seek the song based on drag direction
      const direction = info.velocity.x > 0 ? "forward" : "backward";
      onScratch(direction);
    }

    // Clear seek preview when drag ends
    setSeekPreview(null);
  };

  // Add live seek preview during vinyl drag
  const handleVinylDragMove = (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: { point: { x: number; y: number } }
  ) => {
    // Calculate position based on drag distance from center
    const dragDistance = info.point.x;
    const maxDragDistance = 60; // Based on dragConstraints
    const dragPercent = Math.max(
      -1,
      Math.min(1, dragDistance / maxDragDistance)
    );

    // Calculate time offset (10 seconds per full drag for more responsive feel)
    const timeOffset = dragPercent * 10000; // 10 seconds in ms
    const newPosition = Math.max(
      0,
      Math.min(playerState.duration, playerState.currentTime + timeOffset)
    );

    setSeekPreview(newPosition);
  };

  const formatTime = (ms: number) => {
    if (!ms || isNaN(ms)) return "0:00";
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Improved seekbar handlers - using the working approach from SpotifyPlayer
  const handleSeekBarMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    console.log(
      `Seek bar mouse down for player ${playerId}, duration: ${playerState.duration}`
    );
    setIsSeeking(true);
    setIsScratching(true);
    lastMouseX.current = e.clientX;
    handleSeekBarMove(e);
    window.addEventListener("mousemove", handleSeekBarMove);
    window.addEventListener("mouseup", handleSeekBarMouseUp);
  };

  const handleSeekBarMove = (e: MouseEvent | React.MouseEvent) => {
    if (!seekBarRef.current || !isSeeking) return;

    const rect = seekBarRef.current.getBoundingClientRect();
    const x = (e as MouseEvent).clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    const newPosition = Math.floor(percent * playerState.duration);

    // Calculate scratching intensity based on mouse movement speed
    const currentX = (e as MouseEvent).clientX;
    const speed = Math.abs(currentX - lastMouseX.current);
    lastMouseX.current = currentX;

    // Update scratching intensity
    if (speed > 5) {
      setIsScratching(true);
    }

    setSeekPreview(newPosition);
  };

  const handleSeekBarMouseUp = (e: MouseEvent) => {
    if (!seekBarRef.current) return;

    setIsSeeking(false);
    setIsScratching(false);

    const rect = seekBarRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    const newPosition = Math.floor(percent * playerState.duration);

    console.log(`Seek bar mouse up for player ${playerId}:`, {
      x,
      rectWidth: rect.width,
      percent,
      duration: playerState.duration,
      newPosition,
    });

    // Call the seek method
    onSeek(newPosition);

    setSeekPreview(null);
    window.removeEventListener("mousemove", handleSeekBarMove);
    window.removeEventListener("mouseup", handleSeekBarMouseUp);
  };

  // Touch event handlers for mobile
  const handleSeekBarTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsSeeking(true);
    setIsScratching(true);
    const touch = e.touches[0];
    lastMouseX.current = touch.clientX;
    handleSeekBarTouchMove(e);
    window.addEventListener(
      "touchmove",
      handleSeekBarTouchMove as EventListener
    );
    window.addEventListener("touchend", handleSeekBarTouchEnd as EventListener);
  };

  const handleSeekBarTouchMove = (e: TouchEvent | React.TouchEvent) => {
    if (!seekBarRef.current || !isSeeking) return;

    const touch = (e as TouchEvent).touches[0];
    const rect = seekBarRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    const newPosition = Math.floor(percent * playerState.duration);

    // Calculate scratching intensity based on touch movement speed
    const currentX = touch.clientX;
    const speed = Math.abs(currentX - lastMouseX.current);
    lastMouseX.current = currentX;

    // Update scratching intensity
    if (speed > 5) {
      setIsScratching(true);
    }

    setSeekPreview(newPosition);
  };

  const handleSeekBarTouchEnd = (e: TouchEvent) => {
    if (!seekBarRef.current) return;

    setIsSeeking(false);
    setIsScratching(false);

    const touch = e.changedTouches[0];
    const rect = seekBarRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    const newPosition = Math.floor(percent * playerState.duration);

    // Call the seek method
    onSeek(newPosition);

    setSeekPreview(null);
    window.removeEventListener(
      "touchmove",
      handleSeekBarTouchMove as EventListener
    );
    window.removeEventListener(
      "touchend",
      handleSeekBarTouchEnd as EventListener
    );
  };

  const renderControlButton = (
    onClick: () => void,
    icon: React.ReactNode,
    disabled = false
  ) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-10 h-10 rounded-full bg-gradient-to-br from-red-400 to-red-600 border-2 border-red-300 shadow-[0_0_15px_rgba(255,107,107,0.6)] hover:shadow-[0_0_20px_rgba(255,107,107,0.8)] transition-all duration-200 flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {icon}
    </button>
  );

  const renderIcon = (
    Icon: React.ComponentType<{ size: number; className?: string }>,
    size: number
  ) => <Icon size={size} className="text-white" />;

  const renderAlbumArt = (song: Song | YoutubeVideo | null) => {
    if (!song) {
      return (
        <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center rounded-full">
          <span className="text-gray-400 text-xs">No Track</span>
        </div>
      );
    }

    // Check if it's a Spotify song by checking for the type property
    if ("type" in song && song.type === ServiceType.Spotify) {
      const spotifySong = song as Song;
      return (
        <div className="w-full h-full rounded-full overflow-hidden">
          <Image
            src={spotifySong.artwork.medium.url}
            alt={spotifySong.title}
            fill
            className="object-cover rounded-full"
            sizes="128px"
            priority
          />
        </div>
      );
    } else {
      const youtubeSong = song as YoutubeVideo;
      return (
        <div className="w-full h-full rounded-full overflow-hidden">
          <Image
            src={youtubeSong.snippet.thumbnails.medium.url}
            alt={youtubeSong.snippet.title}
            fill
            className="object-cover rounded-full"
            sizes="128px"
            priority
          />
        </div>
      );
    }
  };

  const renderSongInfo = (song: Song | YoutubeVideo | null) => {
    if (!song) {
      return (
        <div className="text-center">
          <div className="text-gray-400 text-sm font-mono">NO TRACK LOADED</div>
          <div className="text-gray-500 text-xs">Drop a track here</div>
        </div>
      );
    }

    // Check if it's a Spotify song by checking for the type property
    if ("type" in song && song.type === ServiceType.Spotify) {
      const spotifySong = song as Song;
      return (
        <div className="text-center">
          <div className="text-white text-sm font-mono truncate max-w-[200px]">
            {spotifySong.title}
          </div>
          <div className="text-gray-400 text-xs truncate max-w-[200px]">
            {spotifySong.artist.name}
          </div>
        </div>
      );
    } else {
      const youtubeSong = song as YoutubeVideo;
      return (
        <div className="text-center">
          <div className="text-white text-sm font-mono truncate max-w-[200px]">
            {youtubeSong.snippet.title}
          </div>
          <div className="text-gray-400 text-xs truncate max-w-[200px]">
            {youtubeSong.snippet.channelTitle}
          </div>
        </div>
      );
    }
  };

  // Animate vinyl rotation when playing
  useEffect(() => {
    if (isScratching) {
      // Optimized scratching wobble with fewer keyframes
      vinylControls.start({
        rotate: [0, 8, -6, 6, -4, 8],
        transition: {
          duration: 0.2,
          repeat: Infinity,
          ease: "easeInOut",
          times: [0, 0.25, 0.5, 0.75, 1],
        },
      });
    } else if (playerState.isPlaying) {
      // Ultra-smooth continuous rotation with optimized settings
      vinylControls.start({
        rotate: 360,
        transition: {
          duration: 33.3,
          ease: "linear",
          repeat: Infinity,
          repeatType: "loop",
        },
      });
    } else {
      // Paused - stop animation but keep current position
      vinylControls.stop();
    }
  }, [playerState.isPlaying, isScratching, vinylControls]);

  // Needle animation
  useEffect(() => {
    if (playerState.isPlaying) {
      needleControls.start({
        rotate: 35,
        transition: { duration: 0.5, ease: "easeInOut" },
      });
    } else {
      needleControls.start({
        rotate: 15,
        transition: { duration: 0.5, ease: "easeInOut" },
      });
    }
  }, [playerState.isPlaying, needleControls]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center">
      {/* Vinyl Player Container */}
      <div className="relative w-64 h-64 mb-4">
        {/* Vinyl Disk */}
        <motion.div
          ref={vinylRef}
          animate={vinylControls}
          style={{
            filter: "brightness(1) contrast(1.05)",
            transform: "translateZ(0)",
            backfaceVisibility: "hidden",
            perspective: 1000,
          }}
          whileHover={{
            scale: 1.02,
            transition: { type: "spring", stiffness: 300, damping: 20 },
          }}
          whileTap={{
            scale: 0.98,
            transition: { type: "spring", stiffness: 400, damping: 15 },
          }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0}
          dragMomentum={false}
          onDrag={handleVinylDragMove}
          onDragEnd={handleVinylDrag}
          className="absolute inset-0 rounded-full bg-[url('/vinylDisk.png')] bg-center bg-no-repeat bg-[length:120%_120%] cursor-pointer will-change-transform"
          onMouseDown={handleSeekBarMouseDown}
        >
          {/* Album Art - Centered */}
          <div className="absolute left-1/2 top-1/2 w-[68%] h-[68%] -translate-x-1/2 -translate-y-1/2 z-10">
            <motion.div
              ref={artworkRef}
              className="w-full h-full rounded-full bg-black shadow-[0_0_0_3px_#FF6B6B,0_0_18px_#fff8_inset] overflow-hidden"
              whileHover={{
                scale: 1.03,
                transition: { type: "spring", stiffness: 350, damping: 22 },
              }}
            >
              {renderAlbumArt(playerState.song)}
            </motion.div>
          </div>

          {/* Center Black Dot */}
          <div className="absolute left-1/2 top-1/2 w-6 h-6 -translate-x-1/2 -translate-y-1/2 z-20">
            <div className="w-full h-full rounded-full bg-black border-3 border-[#FF6B6B]" />
          </div>
        </motion.div>

        {/* Enhanced Holographic Laser Scanner Pickup Needle */}
        <motion.div
          ref={needleRef}
          animate={needleControls}
          className="absolute top-0 right-0 w-1/3 h-1/3 pointer-events-none z-20"
          style={{
            transformOrigin: "center center",
            transform: "translate(25%, -25%)",
          }}
        >
          {/* Main Needle Arm */}
          <div className="relative w-full h-full flex flex-col items-center">
            {/* Needle Base Circle */}
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-red-400 to-red-600 border-2 border-red-300 shadow-[0_0_20px_rgba(255,107,107,0.8),inset_0_0_10px_rgba(255,107,107,0.4)] z-30" />

            {/* Main Needle Arm */}
            <div className="w-1.5 h-16 bg-gradient-to-b from-red-400 via-red-500 to-red-600 rounded-full shadow-[0_0_15px_rgba(255,107,107,0.6)] z-20" />

            {/* Holographic Laser Beam */}
            <AnimatePresence>
              {playerState.isPlaying && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 0.9, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.3 }}
                  className="relative w-6 h-24 bg-gradient-to-b from-red-400/80 via-red-300/60 to-transparent rounded-full z-15"
                  style={{
                    boxShadow: `
                      0 0 30px rgba(255,107,107,0.8),
                      0 0 60px rgba(255,107,107,0.5),
                      0 0 90px rgba(255,107,107,0.3),
                      inset 0 0 20px rgba(255,107,107,0.4)
                    `,
                  }}
                >
                  {/* Scanning Data Stream */}
                  <motion.div
                    animate={{ opacity: [0.4, 0.9, 0.4] }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="absolute left-1/2 -translate-x-1/2 w-0.5 h-full bg-gradient-to-b from-red-400/40 via-red-300/30 to-transparent"
                  />

                  {/* Bouncing Particles */}
                  <motion.div
                    animate={{
                      y: [0, -10, 0],
                      opacity: [0.6, 1, 0.6],
                    }}
                    transition={{
                      duration: 1.0,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="absolute left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-red-300 rounded-full shadow-[0_0_8px_rgba(255,107,107,0.8)]"
                    style={{ top: "15%" }}
                  />
                  <motion.div
                    animate={{
                      y: [0, -12, 0],
                      opacity: [0.6, 1, 0.6],
                    }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      delay: 0.2,
                      ease: "easeInOut",
                    }}
                    className="absolute left-1/2 -translate-x-1/2 w-1 h-1 bg-red-400 rounded-full shadow-[0_0_6px_rgba(255,107,107,0.8)]"
                    style={{ top: "35%" }}
                  />
                  <motion.div
                    animate={{
                      y: [0, -15, 0],
                      opacity: [0.6, 1, 0.6],
                    }}
                    transition={{
                      duration: 1.4,
                      repeat: Infinity,
                      delay: 0.4,
                      ease: "easeInOut",
                    }}
                    className="absolute left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-red-400 rounded-full shadow-[0_0_8px_rgba(255,107,107,0.8)]"
                    style={{ top: "55%" }}
                  />
                  <motion.div
                    animate={{
                      y: [0, -14, 0],
                      opacity: [0.6, 1, 0.6],
                    }}
                    transition={{
                      duration: 1.1,
                      repeat: Infinity,
                      delay: 0.6,
                      ease: "easeInOut",
                    }}
                    className="absolute left-1/2 -translate-x-1/2 w-1 h-1 bg-red-300 rounded-full shadow-[0_0_6px_rgba(255,107,107,0.8)]"
                    style={{ top: "75%" }}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Needle Tip */}
            <div className="w-0.5 h-5 bg-gradient-to-b from-red-300 to-red-500 rounded-full shadow-[0_0_10px_rgba(255,107,107,0.8)] z-25" />

            {/* Holographic Counterweight */}
            <div className="absolute top-0 -ml-6 w-3 h-2 bg-gradient-to-r from-red-400 to-red-500 rounded-full shadow-[0_0_10px_rgba(255,107,107,0.6)] z-25" />

            {/* Energy Field Around Needle */}
            <AnimatePresence>
              {playerState.isPlaying && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 0.2, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.5 }}
                  className="absolute top-0 w-12 h-24 rounded-full"
                  style={{
                    background:
                      "radial-gradient(ellipse at center, rgba(255,107,107,0.3) 0%, transparent 70%)",
                    boxShadow: "0 0 40px rgba(255,107,107,0.2)",
                  }}
                />
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Song Info */}
      <div className="mb-4">{renderSongInfo(playerState.song)}</div>

      {/* Progress Bar */}
      <div className="w-full max-w-[300px] mb-4">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>
            {formatTime(
              (isSeeking || isScratching) && seekPreview !== null
                ? seekPreview
                : playerState.currentTime
            )}
          </span>
          <span>{formatTime(playerState.duration)}</span>
        </div>

        <div
          ref={seekBarRef}
          className={`relative flex-1 h-[14px] flex items-center mx-2 min-w-[100px] cursor-pointer seek-bar-container-${playerId}`}
          onMouseDown={handleSeekBarMouseDown}
          onTouchStart={handleSeekBarTouchStart}
          onClick={(e) => {
            console.log(
              `Seek bar clicked for player ${playerId}, duration: ${playerState.duration}`
            );
            if (playerState.duration > 0) {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const percent = Math.max(0, Math.min(1, x / rect.width));
              const newPosition = Math.floor(percent * playerState.duration);
              console.log(
                `Click seek: x=${x}, percent=${percent}, position=${newPosition}`
              );
              onSeek(newPosition);
            } else {
              console.log(`Cannot seek: duration is ${playerState.duration}`);
            }
          }}
        >
          <div className="absolute top-1/2 left-0 w-full h-2 -translate-y-1/2 bg-[var(--foreground)] opacity-12 rounded-md pointer-events-none z-0" />
          <motion.div
            className="absolute top-1/2 left-0 h-2 -translate-y-1/2 bg-red-500 rounded-md pointer-events-none z-10"
            style={{
              width: playerState.duration
                ? `${
                    (((isSeeking || isScratching) && seekPreview !== null
                      ? seekPreview
                      : playerState.currentTime) /
                      playerState.duration) *
                    100
                  }%`
                : "0%",
            }}
            transition={{ duration: 0.15, ease: "linear" }}
          />
          {/* Seek handle */}
          <motion.div
            className="absolute top-1/2 w-4 h-4 bg-red-400 rounded-full shadow-[0_0_10px_rgba(255,107,107,0.8)] pointer-events-none z-20"
            style={{
              left: playerState.duration
                ? `${
                    (((isSeeking || isScratching) && seekPreview !== null
                      ? seekPreview
                      : playerState.currentTime) /
                      playerState.duration) *
                    100
                  }%`
                : "0%",
              transform: "translate(-50%, -50%)",
            }}
            transition={{ duration: 0.15, ease: "linear" }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center items-center gap-3 mb-4">
        {renderControlButton(
          playerState.isPlaying ? onPause : onPlay,
          playerState.isPlaying
            ? renderIcon(FaPause, 20)
            : renderIcon(FaPlay, 20)
        )}
        {renderControlButton(onStop, renderIcon(FaStop, 20))}
        {renderControlButton(
          onMuteToggle,
          playerState.isMuted
            ? renderIcon(FaVolumeMute, 18)
            : renderIcon(FaVolumeUp, 18)
        )}
      </div>

      {/* Volume Slider */}
      <div className="flex items-center gap-2 w-full max-w-[250px]">
        <span className="text-white font-mono text-xs min-w-[32px] text-right">
          VOL
        </span>
        <div className="relative flex-1 h-2 bg-gray-700 rounded-full cursor-pointer">
          <div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-red-400 to-red-600 rounded-full transition-all duration-100"
            style={{ width: `${playerState.volume}%` }}
          />
          <input
            type="range"
            min="0"
            max="100"
            value={playerState.volume}
            onChange={(e) => onVolumeChange(Number(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
        <span className="text-white font-mono text-xs min-w-[24px]">
          {Math.round(playerState.volume)}
        </span>
      </div>
    </div>
  );
}
