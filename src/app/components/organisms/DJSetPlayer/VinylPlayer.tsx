"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useAnimation, AnimatePresence } from "framer-motion";

import { Song, ServiceType } from "@/app/types/playerTypes";
import { YoutubeVideo } from "@/app/types/youtubeTypes";

// Import atomic design components
import PlayerControls from "@/app/components/molecules/PlayerControls";
import ProgressBar from "@/app/components/atoms/ProgressBar";
import TimeDisplay from "@/app/components/atoms/TimeDisplay";
import VolumeControl from "@/app/components/molecules/VolumeControl";
import AlbumArt from "@/app/components/atoms/AlbumArt";

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
  onSeek: (position: number) => void;
}

export default function VinylPlayer({
  playerState,
  onPlay,
  onPause,
  onStop,
  onVolumeChange,
  onSeek,
}: VinylPlayerProps) {
  const vinylRef = useRef<HTMLDivElement>(null);
  const needleRef = useRef<HTMLDivElement>(null);
  const artworkRef = useRef<HTMLDivElement>(null);
  const vinylControls = useAnimation();
  const needleControls = useAnimation();

  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);

  // Handle vinyl drag to seek the song
  const handleVinylDragStart = (e: React.PointerEvent) => {
    setIsDragging(true);
    setDragStartX(e.clientX);
  };

  const handleVinylDragMove = (e: React.PointerEvent) => {
    if (!isDragging) return;

    const currentX = e.clientX;
    const dragDistance = currentX - dragStartX;
    const maxDragDistance = 100; // Maximum drag distance for full seek

    // Calculate seek percentage based on drag distance
    const seekPercentage = Math.max(
      -1,
      Math.min(1, dragDistance / maxDragDistance)
    );

    // Calculate new position (10 second increments)
    const seekSeconds = seekPercentage * 10;
    const newPosition = playerState.currentTime + seekSeconds * 1000; // Convert to milliseconds
    const clampedPosition = Math.max(
      0,
      Math.min(playerState.duration, newPosition)
    );

    // Call onSeek with the new position in milliseconds
    onSeek(clampedPosition);
  };

  const handleVinylDragEnd = () => {
    setIsDragging(false);
  };

  const getAlbumArtProps = (song: Song | YoutubeVideo | null) => {
    if (!song) {
      return {
        src: "",
        alt: "No Track",
        fallbackText: "No Track",
      };
    }

    // Check if it's a Spotify song by checking for the type property
    if ("type" in song && song.type === ServiceType.Spotify) {
      const spotifySong = song as Song;
      return {
        src: spotifySong.artwork.medium.url,
        alt: spotifySong.title,
        fallbackText: "No Artwork",
      };
    } else {
      const youtubeSong = song as YoutubeVideo;
      return {
        src: youtubeSong.snippet.thumbnails.medium.url,
        alt: youtubeSong.snippet.title,
        fallbackText: "No Thumbnail",
      };
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
    if (isDragging) {
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
  }, [playerState.isPlaying, isDragging, vinylControls]);

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
          onPointerDown={handleVinylDragStart}
          onPointerMove={handleVinylDragMove}
          onPointerUp={handleVinylDragEnd}
          onPointerLeave={handleVinylDragEnd}
          className="absolute inset-0 rounded-full bg-[url('/vinylDisk.png')] bg-center bg-no-repeat bg-[length:120%_120%] cursor-pointer will-change-transform"
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
              <AlbumArt
                {...getAlbumArtProps(playerState.song)}
                size="xl"
                variant="vinyl"
                className="w-full h-full"
                priority={true}
              />
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
        <div className="mb-1">
          <TimeDisplay
            currentTime={playerState.currentTime}
            duration={playerState.duration}
            format="mm:ss"
            size="sm"
            color="watermelon"
            className="text-center"
          />
        </div>

        <ProgressBar
          currentTime={playerState.currentTime}
          duration={playerState.duration}
          onSeek={onSeek}
          color="watermelon"
          height="md"
          className="flex-1 mx-2 min-w-[100px]"
        />
      </div>

      {/* Controls */}
      <div className="flex justify-center items-center gap-3 mb-4">
        <PlayerControls
          isPlaying={playerState.isPlaying}
          onPlay={onPlay}
          onPause={onPause}
          onStop={onStop}
          size="lg"
          variant="watermelon"
          disabled={false}
        />
      </div>

      {/* Volume Control */}
      <div className="w-full max-w-[250px] mb-4">
        <VolumeControl
          volume={playerState.volume}
          onVolumeChange={onVolumeChange}
          size="md"
          showIcon={true}
          showLabel={true}
          className="w-full"
        />
      </div>
    </div>
  );
}
