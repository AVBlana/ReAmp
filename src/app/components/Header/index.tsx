"use client";

import Link from "next/link";
import { FaHome } from "react-icons/fa";
import { ReactNode, useEffect, useState, useRef } from "react";
import { useUnifiedContext } from "@/context/UnifiedContext";
import { motion, useAnimation } from "framer-motion";

interface HeaderProps {
  icon?: ReactNode;
  title: string;
  searchComponent: ReactNode;
  onLogout?: () => void;
  showLogout?: boolean;
}

// YouTube player interface
interface YouTubePlayer {
  getPlayerState: () => number;
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  addEventListener: (
    event: string,
    listener: (event: { data: number }) => void
  ) => void;
  removeEventListener: (
    event: string,
    listener: (event: { data: number }) => void
  ) => void;
  destroy: () => void;
}

// Global YouTube player reference
let globalYouTubePlayer: YouTubePlayer | null = null;

// Function to set the global YouTube player reference
export const setGlobalYouTubePlayer = (player: YouTubePlayer | null) => {
  globalYouTubePlayer = player;
};

// Custom hook to monitor actual playback states
const usePlaybackState = () => {
  const { youtube, spotify } = useUnifiedContext();
  const [youtubeIsPlaying, setYoutubeIsPlaying] = useState(false);
  const [spotifyIsPlaying, setSpotifyIsPlaying] = useState(false);

  // Monitor YouTube playback state
  useEffect(() => {
    if (youtube.selectedVideo) {
      // For YouTube, we need to check the actual player state
      const checkYouTubeState = () => {
        try {
          if (
            globalYouTubePlayer &&
            typeof globalYouTubePlayer.getPlayerState === "function"
          ) {
            const playerState = globalYouTubePlayer.getPlayerState();
            // YouTube PlayerState: PLAYING = 1, PAUSED = 2, ENDED = 0, etc.
            const isPlaying = playerState === 1; // PLAYING state
            setYoutubeIsPlaying(isPlaying);
          } else {
            // Fallback: assume playing if video is selected
            setYoutubeIsPlaying(true);
          }
        } catch (error) {
          console.error("Error checking YouTube state:", error);
          setYoutubeIsPlaying(false);
        }
      };

      checkYouTubeState();
      const interval = setInterval(checkYouTubeState, 1000);

      return () => clearInterval(interval);
    } else {
      setYoutubeIsPlaying(false);
    }
  }, [youtube.selectedVideo]);

  // Monitor Spotify playback state by checking the actual player state
  useEffect(() => {
    if (spotify.currentSong) {
      // For Spotify, we can check the actual player state
      const checkSpotifyState = async () => {
        try {
          const token = localStorage.getItem("spotify_token");
          if (!token) {
            setSpotifyIsPlaying(false);
            return;
          }

          const response = await fetch("https://api.spotify.com/v1/me/player", {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          if (response.status === 204) {
            // No active device
            setSpotifyIsPlaying(false);
          } else if (response.ok) {
            const data = await response.json();
            setSpotifyIsPlaying(data.is_playing || false);
          } else {
            setSpotifyIsPlaying(false);
          }
        } catch (error) {
          console.error("Error checking Spotify state:", error);
          setSpotifyIsPlaying(false);
        }
      };

      checkSpotifyState();
      const interval = setInterval(checkSpotifyState, 1000);

      return () => clearInterval(interval);
    } else {
      setSpotifyIsPlaying(false);
    }
  }, [spotify.currentSong]);

  return {
    youtubeIsPlaying,
    spotifyIsPlaying,
    isAnyPlaying: youtubeIsPlaying || spotifyIsPlaying,
  };
};

export default function Header({
  icon,
  title,
  searchComponent,
  onLogout,
  showLogout = false,
}: HeaderProps) {
  const { youtube, spotify } = useUnifiedContext();
  const { isAnyPlaying } = usePlaybackState();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousPlaybackStateRef = useRef<string | null>(null);
  const logoControls = useAnimation();

  // Check if any music is currently playing
  useEffect(() => {
    const currentPlaybackState =
      youtube.selectedVideo || spotify.currentSong?.id || null;
    const hasActivePlayback = !!currentPlaybackState;
    const previousState = previousPlaybackStateRef.current;

    // Clear any existing timeout
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }

    // Check if playback state actually changed
    const stateChanged = currentPlaybackState !== previousState;
    const playingStateChanged = isAnyPlaying !== isPlaying;

    if (stateChanged || playingStateChanged) {
      if (hasActivePlayback && isAnyPlaying && !isPlaying) {
        // Music started - animate logo turning on
        console.log("Logo: Turning ON - Music started");
        setIsAnimating(true);
        animationTimeoutRef.current = setTimeout(() => {
          setIsPlaying(true);
          setIsAnimating(false);
        }, 800);
      } else if ((!hasActivePlayback || !isAnyPlaying) && isPlaying) {
        // Music stopped - animate logo turning off
        console.log("Logo: Turning OFF - Music stopped");
        setIsAnimating(true);
        animationTimeoutRef.current = setTimeout(() => {
          setIsPlaying(false);
          setIsAnimating(false);
        }, 800);
      } else if (
        hasActivePlayback &&
        isAnyPlaying &&
        isPlaying &&
        currentPlaybackState !== previousState
      ) {
        // Song changed while playing - brief animation
        console.log("Logo: Song changed - Brief animation");
        setIsAnimating(true);
        animationTimeoutRef.current = setTimeout(() => {
          setIsAnimating(false);
        }, 400);
      }

      // Update the previous state
      previousPlaybackStateRef.current = currentPlaybackState;
    }

    // Cleanup function
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, [youtube.selectedVideo, spotify.currentSong?.id, isAnyPlaying, isPlaying]);

  // Logo animation effect
  useEffect(() => {
    if (isAnimating) {
      if (isPlaying) {
        // Turn on animation
        logoControls.start({
          opacity: [0.3, 1, 1],
          filter: [
            "none",
            "drop-shadow(0 0 20px rgba(255, 107, 107, 1)) drop-shadow(0 0 40px rgba(255, 107, 107, 0.8)) drop-shadow(0 0 60px rgba(255, 107, 107, 0.6))",
            "drop-shadow(0 0 8px rgba(255, 107, 107, 0.8)) drop-shadow(0 0 16px rgba(255, 107, 107, 0.6)) drop-shadow(0 0 24px rgba(255, 107, 107, 0.4)) drop-shadow(0 0 32px rgba(255, 107, 107, 0.2))",
          ],
          scale: [1, 1.2, 1],
        });
      } else {
        // Turn off animation
        logoControls.start({
          opacity: [1, 0.8, 0.3],
          filter: [
            "drop-shadow(0 0 8px rgba(255, 107, 107, 0.8)) drop-shadow(0 0 16px rgba(255, 107, 107, 0.6)) drop-shadow(0 0 24px rgba(255, 107, 107, 0.4)) drop-shadow(0 0 32px rgba(255, 107, 107, 0.2))",
            "drop-shadow(0 0 15px rgba(255, 107, 107, 0.6)) drop-shadow(0 0 30px rgba(255, 107, 107, 0.4))",
            "none",
          ],
          scale: [1, 1.1, 1],
        });
      }
    } else {
      // Set final state without animation
      logoControls.set({
        opacity: isPlaying ? 1 : 0.3,
        filter: isPlaying
          ? "drop-shadow(0 0 8px rgba(255, 107, 107, 0.8)) drop-shadow(0 0 16px rgba(255, 107, 107, 0.6)) drop-shadow(0 0 24px rgba(255, 107, 107, 0.4)) drop-shadow(0 0 32px rgba(255, 107, 107, 0.2))"
          : "none",
        scale: 1,
      });
    }
  }, [isPlaying, isAnimating, logoControls]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  return (
    <header className="bg-black/80 border-b border-white/10 sticky top-0 z-50 backdrop-blur-sm w-full">
      <div className="p-6">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* Left section with icon and title */}
          <div className="flex items-center space-x-3 w-full lg:w-auto justify-between lg:justify-start">
            <div className="flex items-center space-x-3">
              {icon && icon}
              <motion.h1
                className="text-2xl font-bold text-transparent tracking-tighter relative"
                style={{
                  WebkitTextStroke: "1px #ff6b6b",
                }}
                animate={logoControls}
                transition={{
                  duration: 0.8,
                  ease: [0.4, 0, 0.2, 1],
                }}
              >
                {title}
              </motion.h1>
            </div>
            {/* Show home and logout on mobile */}
            <div className="flex items-center space-x-2 lg:hidden">
              <Link
                href="/"
                className="text-gray-400 hover:text-white transition-colors p-1.5"
                aria-label="Home"
              >
                <FaHome size={18} />
              </Link>
              {showLogout && onLogout && (
                <button
                  onClick={onLogout}
                  className="px-2 py-1 bg-red-500/90 hover:bg-red-600 text-white text-xs rounded-md transition-colors"
                >
                  Logout
                </button>
              )}
            </div>
          </div>

          {/* Center section with search */}
          <div className="w-full lg:flex-1 lg:max-w-2xl lg:mx-4 order-3 lg:order-2">
            {searchComponent}
          </div>

          {/* Right section with home and logout - hidden on mobile */}
          <div className="hidden lg:flex items-center space-x-3 min-w-[120px] justify-end order-2 lg:order-3">
            <Link
              href="/"
              className="text-gray-400 hover:text-white transition-colors p-2"
              aria-label="Home"
            >
              <FaHome size={20} />
            </Link>
            {showLogout && onLogout && (
              <button
                onClick={onLogout}
                className="px-3 py-1.5 bg-red-500/90 hover:bg-red-600 text-white text-sm rounded-md transition-colors"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
