"use client";

import { useEffect, useState, useRef } from "react";
import {
  FaPlay,
  FaPause,
  FaStop,
  FaVolumeUp,
  FaVolumeMute,
  FaFastForward,
} from "react-icons/fa";
import { ServiceType } from "@/types/playerTypes";
import Image from "next/image";
import type { Player, PlaybackState } from "spotify-web-playback-sdk";
import { useSpotify } from "@/context/UnifiedContext";

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    Spotify: {
      Player: new (options: PlayerOptions) => Player;
    };
  }
}

interface PlayerOptions {
  name: string;
  getOAuthToken: (cb: (token: string) => void) => void;
  volume?: number;
}

export default function SpotifyPlayer() {
  const { currentSong, setCurrentSong, playlist } = useSpotify();
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume] = useState(50);
  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const playerRef = useRef<Player | null>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const deviceTransferInProgress = useRef(false);
  const initializationInProgress = useRef(false);
  const [seekPreview, setSeekPreview] = useState<number | null>(null);
  const [isSeeking, setIsSeeking] = useState(false);
  const [isScratching, setIsScratching] = useState(false);
  const lastMouseX = useRef(0);
  const [displayVolume, setDisplayVolume] = useState(volume);
  const [spotifyToken, setSpotifyToken] = useState<string | null>(null);
  const [activeDeviceId, setActiveDeviceId] = useState<string | null>(null);

  // Safely access localStorage only on client side
  useEffect(() => {
    if (typeof window !== "undefined") {
      setSpotifyToken(localStorage.getItem("spotify_token"));
    }
  }, []);

  // Configure WebGL
  useEffect(() => {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl") ||
      (canvas.getContext("experimental-webgl") as WebGLRenderingContext);
    if (gl) {
      gl.getExtension("WEBGL_debug_renderer_info");
      gl.getExtension("OES_standard_derivatives");
    }
  }, []);

  // Initialize Spotify Web Playback SDK
  useEffect(() => {
    if (!spotifyToken) {
      console.log("No Spotify token available, skipping initialization");
      return;
    }

    console.log("Initializing Spotify Web Playback SDK...");

    // Prevent multiple script loads
    if (scriptRef.current) {
      console.log("Spotify SDK script already loaded");
      return;
    }

    scriptRef.current = document.createElement("script");
    scriptRef.current.src = "https://sdk.scdn.co/spotify-player.js";
    scriptRef.current.async = true;

    window.onSpotifyWebPlaybackSDKReady = () => {
      console.log("Spotify Web Playback SDK is ready");
      if (!spotifyToken) {
        console.log("No Spotify token available after SDK ready");
        return;
      }

      // Prevent multiple initializations
      if (initializationInProgress.current || playerRef.current) {
        console.log(
          "Player already initialized or initialization in progress, skipping"
        );
        return;
      }

      initializationInProgress.current = true;
      console.log("Creating new Spotify player instance...");

      // Create new player instance with error handling
      try {
        const player = new window.Spotify.Player({
          name: "ReAMP Player",
          getOAuthToken: (cb: (token: string) => void) => {
            // Ensure we're using the latest token
            const currentToken = localStorage.getItem("spotify_token");
            if (!currentToken) {
              console.error("No Spotify token available in getOAuthToken");
              return;
            }
            console.log("Providing OAuth token to player");
            cb(currentToken);
          },
          volume: volume / 100,
        });

        playerRef.current = player;
        console.log("Player instance created successfully");

        // Error handling
        player.addListener(
          "initialization_error",
          async ({ message }: { message: string }) => {
            console.error("Failed to initialize:", message);
            setIsActive(false);
            initializationInProgress.current = false;
            setRetryCount(0);

            // If initialization fails, try to refresh the token
            if (
              message.includes("404") ||
              message.includes("MediaKeySystemAccess") ||
              message.includes("CloudPlaybackClientError")
            ) {
              try {
                console.log(
                  "Attempting to refresh token after initialization error"
                );
                const response = await fetch("/api/spotify/refresh");
                if (!response.ok) {
                  throw new Error("Failed to refresh token");
                }
                const data = await response.json();
                if (typeof window !== "undefined") {
                  localStorage.setItem("spotify_token", data.access_token);
                  setSpotifyToken(data.access_token);
                }
              } catch (error) {
                console.error("Error refreshing token:", error);
              }
            }
          }
        );

        player.addListener(
          "authentication_error",
          ({ message }: { message: string }) => {
            console.error("Failed to authenticate:", message);
            localStorage.removeItem("spotify_token");
            setIsActive(false);
            initializationInProgress.current = false;
            setRetryCount(0);
          }
        );

        player.addListener(
          "account_error",
          ({ message }: { message: string }) => {
            console.error("Failed to validate Spotify account:", message);
            setIsActive(false);
            initializationInProgress.current = false;
            setRetryCount(0);
          }
        );

        player.addListener(
          "playback_error",
          ({ message }: { message: string }) => {
            console.error("Playback error:", message);
            // Don't reset everything on playback error
            setIsActive(false);
          }
        );

        // Playback status updates
        player.addListener(
          "player_state_changed",
          (state: PlaybackState | null) => {
            console.log("Player state changed:", state);
            if (state) {
              setIsPlaying(!state.paused);
            }
          }
        );

        // Ready
        player.addListener(
          "ready",
          async ({ device_id }: { device_id: string }) => {
            console.log("Player is ready with Device ID:", device_id);

            // Only proceed if we don't already have an active device
            if (activeDeviceId === device_id) {
              console.log("Device already active, skipping transfer");
              initializationInProgress.current = false;
              return;
            }

            // Set device transfer in progress
            deviceTransferInProgress.current = true;

            try {
              // Transfer playback to our device with retry logic
              const transferPlayback = async (retryCount = 0) => {
                try {
                  console.log("Transferring playback to device:", device_id);
                  const response = await fetch(
                    `https://api.spotify.com/v1/me/player`,
                    {
                      method: "PUT",
                      headers: {
                        Authorization: `Bearer ${spotifyToken}`,
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        device_ids: [device_id],
                        play: false,
                      }),
                    }
                  );

                  if (!response.ok) {
                    if (response.status === 404 && retryCount < maxRetries) {
                      console.log(
                        `Retrying device transfer (${
                          retryCount + 1
                        }/${maxRetries})...`
                      );
                      await new Promise((resolve) =>
                        setTimeout(resolve, 1000 * (retryCount + 1))
                      );
                      return transferPlayback(retryCount + 1);
                    }
                    throw new Error(
                      `Failed to transfer playback: ${response.status}`
                    );
                  }

                  console.log("Successfully transferred playback to device");
                  setActiveDeviceId(device_id);
                  setIsActive(false);
                  setRetryCount(0);
                  deviceTransferInProgress.current = false;
                } catch (error) {
                  console.error("Error transferring playback:", error);
                  if (retryCount < maxRetries) {
                    await new Promise((resolve) =>
                      setTimeout(resolve, 1000 * (retryCount + 1))
                    );
                    return transferPlayback(retryCount + 1);
                  }
                  throw error;
                }
              };

              await transferPlayback();
            } catch (error) {
              console.error("Error in device transfer process:", error);
              setIsActive(false);
              deviceTransferInProgress.current = false;
              initializationInProgress.current = false;
            }
          }
        );

        // Not Ready
        player.addListener(
          "not_ready",
          ({ device_id }: { device_id: string }) => {
            console.log("Device ID has gone offline:", device_id);
            if (activeDeviceId === device_id) {
              setActiveDeviceId(null);
              setIsActive(false);
            }
          }
        );

        // Connect to the player
        console.log("Connecting to Spotify player...");
        player
          .connect()
          .then((success: boolean) => {
            if (success) {
              console.log("Successfully connected to Spotify!");
            } else {
              console.error("Failed to connect to Spotify");
              initializationInProgress.current = false;
              setRetryCount(0);
            }
          })
          .catch((error) => {
            console.error("Error connecting to Spotify:", error);
            initializationInProgress.current = false;
            setRetryCount(0);
          });
      } catch (error) {
        console.error("Error creating Spotify player:", error);
        initializationInProgress.current = false;
        setRetryCount(0);
      }
    };

    document.body.appendChild(scriptRef.current);
    console.log("Spotify SDK script added to document");

    return () => {
      console.log("Cleaning up Spotify player...");
      // Cleanup on unmount
      if (playerRef.current) {
        playerRef.current.disconnect();
        playerRef.current = null;
      }
      if (scriptRef.current) {
        document.body.removeChild(scriptRef.current);
        scriptRef.current = null;
      }
      setActiveDeviceId(null);
      setIsActive(false);
      deviceTransferInProgress.current = false;
      initializationInProgress.current = false;
      setRetryCount(0);
    };
  }, [spotifyToken, volume]);

  // Effect to handle token changes
  useEffect(() => {
    if (!spotifyToken) {
      if (playerRef.current) {
        playerRef.current.disconnect();
        playerRef.current = null;
      }
      setActiveDeviceId(null);
      setIsActive(false);
      deviceTransferInProgress.current = false;
      initializationInProgress.current = false;
      setRetryCount(0);
    }
  }, [spotifyToken]);

  // Effect to handle current song changes
  useEffect(() => {
    if (
      currentSong?.type === ServiceType.Spotify &&
      activeDeviceId &&
      !isActive
    ) {
      const token = localStorage.getItem("spotify_token");
      if (!token) return;

      // Play the track on the active device with retry logic
      const playTrack = async (retryCount = 0) => {
        try {
          const response = await fetch(
            `https://api.spotify.com/v1/me/player/play?device_id=${activeDeviceId}`,
            {
              method: "PUT",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                uris: [`spotify:track:${currentSong.id}`],
                position_ms: 0,
              }),
            }
          );

          if (!response.ok) {
            if (response.status === 404 && retryCount < maxRetries) {
              console.log(
                `Retrying track playback (${retryCount + 1}/${maxRetries})...`
              );
              await new Promise((resolve) =>
                setTimeout(resolve, 1000 * (retryCount + 1))
              );
              return playTrack(retryCount + 1);
            }
            throw new Error(`Failed to play track: ${response.status}`);
          }

          // Ensure playback starts
          if (playerRef.current) {
            await playerRef.current.resume();
            setIsPlaying(true);
          }
        } catch (error) {
          console.error("Error playing track:", error);
          if (retryCount < maxRetries) {
            await new Promise((resolve) =>
              setTimeout(resolve, 1000 * (retryCount + 1))
            );
            return playTrack(retryCount + 1);
          }
        }
      };

      playTrack();
    }
  }, [currentSong, activeDeviceId, isActive]);

  // Add track completion handler
  useEffect(() => {
    if (!playerRef.current) return;

    let isHandlingTrackEnd = false;
    let trackEndTimeout: NodeJS.Timeout | null = null;

    const handleTrackEnd = async () => {
      if (isHandlingTrackEnd) return;
      isHandlingTrackEnd = true;

      try {
        // Find the current track's index in the playlist
        const currentIndex = playlist.findIndex(
          (track) => track.id === currentSong?.id
        );

        // If we have a next track, play it
        if (currentIndex < playlist.length - 1) {
          const nextTrack = playlist[currentIndex + 1];
          if (nextTrack && nextTrack.type === ServiceType.Spotify) {
            try {
              // First, set the next track
              setCurrentSong(nextTrack);

              // Wait a moment for the state to update
              await new Promise((resolve) => setTimeout(resolve, 100));

              // Use the API to play the next track
              const response = await fetch(
                `https://api.spotify.com/v1/me/player/play?device_id=${activeDeviceId}`,
                {
                  method: "PUT",
                  headers: {
                    Authorization: `Bearer ${spotifyToken}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    uris: [`spotify:track:${nextTrack.id}`],
                    position_ms: 0,
                  }),
                }
              );

              if (!response.ok) {
                throw new Error(
                  `Failed to play next track: ${response.status}`
                );
              }

              // Ensure playback starts
              if (playerRef.current) {
                await playerRef.current.resume();
              }
            } catch (error) {
              console.error("Error transitioning to next track:", error);
              // If there's an error, try to refresh the token and retry
              try {
                const refreshResponse = await fetch("/api/spotify/refresh");
                if (!refreshResponse.ok) {
                  throw new Error("Failed to refresh token");
                }
                const data = await refreshResponse.json();
                if (typeof window !== "undefined") {
                  localStorage.setItem("spotify_token", data.access_token);
                  setSpotifyToken(data.access_token);
                }
              } catch (refreshError) {
                console.error("Error refreshing token:", refreshError);
              }
            }
          }
        } else {
          // End of playlist
          setIsPlaying(false);
        }
      } finally {
        isHandlingTrackEnd = false;
      }
    };

    const handleStateChange = (data: unknown) => {
      const state = data as PlaybackState | null;
      if (state) {
        const wasPlaying = isPlaying;
        const isNowPlaying = !state.paused;
        setIsPlaying(isNowPlaying);

        // Update progress and duration
        setProgress(state.position);
        setDuration(state.duration);

        // Check if track ended naturally (not by user pause)
        if (
          wasPlaying &&
          !isNowPlaying &&
          state.position >= state.duration - 1000
        ) {
          handleTrackEnd();
        }
      }
    };

    // Add progress update listener
    const progressInterval = setInterval(async () => {
      if (playerRef.current && isPlaying) {
        try {
          const state = await playerRef.current.getCurrentState();
          if (state) {
            setProgress(state.position);
            setDuration(state.duration);

            // Check if we're very close to the end (within 1 second)
            if (state.position >= state.duration - 1000 && !state.paused) {
              handleTrackEnd();
            }
          }
        } catch (error) {
          console.error("Error getting player state:", error);
        }
      }
    }, 1000);

    playerRef.current.addListener("player_state_changed", handleStateChange);

    return () => {
      if (playerRef.current) {
        playerRef.current.removeListener(
          "player_state_changed",
          handleStateChange
        );
      }
      clearInterval(progressInterval);
      if (trackEndTimeout) {
        clearTimeout(trackEndTimeout);
      }
    };
  }, [
    playlist,
    setCurrentSong,
    isPlaying,
    currentSong,
    activeDeviceId,
    spotifyToken,
  ]);

  const togglePlay = async () => {
    if (!activeDeviceId || isActive) return;
    const token = localStorage.getItem("spotify_token");
    if (!token) return;

    try {
      if (isPlaying) {
        // Pause playback
        const response = await fetch(
          `https://api.spotify.com/v1/me/player/pause?device_id=${activeDeviceId}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to pause: ${response.status}`);
        }

        setIsPlaying(false);
      } else {
        // Resume playback
        const response = await fetch(
          `https://api.spotify.com/v1/me/player/play?device_id=${activeDeviceId}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to play: ${response.status}`);
        }

        setIsPlaying(true);
      }
    } catch (error) {
      console.error("Error toggling playback:", error);
    }
  };

  const handleStop = () => {
    if (!activeDeviceId || isActive) return;
    const token = localStorage.getItem("spotify_token");
    if (!token) return;

    fetch(
      `https://api.spotify.com/v1/me/player/pause?device_id=${activeDeviceId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        setIsPlaying(false);
      })
      .catch((error: Error) => {
        console.error("Error stopping track:", error);
      });
  };

  const handleFastForward = () => {
    if (playerRef.current && !isActive) {
      const newPosition = Math.min(progress + 30000, duration);
      playerRef.current.seek(newPosition);
      setProgress(newPosition);
    }
  };

  // Drag handlers for seek bar
  const handleSeekBarMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsSeeking(true);
    setIsScratching(true);
    lastMouseX.current = e.clientX;
    handleSeekBarMove(e);
    window.addEventListener("mousemove", handleSeekBarMove);
    window.addEventListener("mouseup", handleSeekBarMouseUp);
  };

  const handleSeekBarMove = (e: MouseEvent | React.MouseEvent) => {
    const bar = document.querySelector(".seek-bar-container") as HTMLElement;
    if (!bar) return;
    const rect = bar.getBoundingClientRect();
    const x = (e as MouseEvent).clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    const newPosition = Math.floor(percent * duration);

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
    setIsSeeking(false);
    setIsScratching(false);
    const bar = document.querySelector(".seek-bar-container") as HTMLElement;
    if (!bar) return;
    const rect = bar.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    const newPosition = Math.floor(percent * duration);

    if (playerRef.current && !isActive) {
      playerRef.current.seek(newPosition).then(() => {
        setProgress(newPosition);
      });
    }

    setSeekPreview(null);
    window.removeEventListener("mousemove", handleSeekBarMove);
    window.removeEventListener("mouseup", handleSeekBarMouseUp);
  };

  // Drag handlers for volume bar
  const handleVolumeBarMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    handleVolumeBarMove(e);
    window.addEventListener("mousemove", handleVolumeBarMove);
    window.addEventListener("mouseup", handleVolumeBarMouseUp);
  };

  const handleVolumeBarMove = (e: MouseEvent | React.MouseEvent) => {
    const bar = document.querySelector(".volume-bar-container") as HTMLElement;
    if (!bar) return;
    const rect = bar.getBoundingClientRect();
    const x = (e as MouseEvent).clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    const newVolume = Math.round(percent * 100);

    if (playerRef.current && !isActive) {
      playerRef.current.setVolume(newVolume / 100);
      setDisplayVolume(newVolume);
    }
  };

  const handleVolumeBarMouseUp = () => {
    window.removeEventListener("mousemove", handleVolumeBarMove);
    window.removeEventListener("mouseup", handleVolumeBarMouseUp);
  };

  const toggleMute = async () => {
    if (!playerRef.current || isActive) return;

    try {
      if (isMuted) {
        // Unmute by setting volume back to 50%
        await playerRef.current.setVolume(0.5);
        setDisplayVolume(50);
        setIsMuted(false);
      } else {
        // Mute by setting volume to 0
        await playerRef.current.setVolume(0);
        setDisplayVolume(0);
        setIsMuted(true);
      }
    } catch (error) {
      console.error("Error toggling mute:", error);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    const timeout = progressInterval.current;
    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, []);

  // Add progress update effect
  useEffect(() => {
    if (isPlaying && !isActive) {
      const interval = setInterval(async () => {
        if (playerRef.current) {
          const state = await playerRef.current.getCurrentState();
          if (state) {
            setProgress(state.position);
            setDuration(state.duration);
          }
        }
      }, 1000);
      return () => {
        clearInterval(interval);
      };
    }
  }, [isPlaying, isActive]);

  // Add style tag for animations
  useEffect(() => {
    const style = document.createElement("style");
    style.id = "vinyl-animation-styles";
    style.textContent = `
      @keyframes vinyl-spin-slow {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      @keyframes scratch {
        0% { transform: rotate(0deg) scale(1); }
        25% { transform: rotate(3deg) scale(1.01); }
        50% { transform: rotate(0deg) scale(1); }
        75% { transform: rotate(-3deg) scale(0.99); }
        100% { transform: rotate(0deg) scale(1); }
      }
      @keyframes needle-shake {
        0% { transform: rotate(var(--needle-rotation)); }
        25% { transform: rotate(calc(var(--needle-rotation) + 1deg)); }
        50% { transform: rotate(var(--needle-rotation)); }
        75% { transform: rotate(calc(var(--needle-rotation) - 1deg)); }
        100% { transform: rotate(var(--needle-rotation)); }
      }
      @keyframes vinyl-shake {
        0% { transform: rotate(0deg); }
        25% { transform: rotate(1deg); }
        50% { transform: rotate(0deg); }
        75% { transform: rotate(-1deg); }
        100% { transform: rotate(0deg); }
      }
      .animate-spin {
        animation: vinyl-spin-slow 20s linear infinite !important;
      }
      .animate-scratch {
        animation: scratch 0.15s ease-in-out infinite !important;
      }
      .animate-needle-shake {
        animation: needle-shake 0.15s ease-in-out infinite !important;
      }
      .animate-vinyl-shake {
        animation: vinyl-shake 0.15s ease-in-out infinite !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      const existingStyle = document.getElementById("vinyl-animation-styles");
      if (existingStyle) {
        document.head.removeChild(existingStyle);
      }
    };
  }, []);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  if (!currentSong) {
    return (
      <div className="bg-black/80 rounded-lg shadow-md p-6 flex flex-col items-center w-full h-full">
        {/* Vinyl Section with Pickup Arm */}
        <div className="relative w-full max-w-[340px] aspect-square flex items-center justify-center mb-10 -mt-20">
          <div
            className={`relative w-4/5 h-4/5 min-w-[180px] min-h-[180px] max-w-[320px] max-h-[320px] aspect-square rounded-full bg-[url('/vinylDisk.png')] bg-center bg-no-repeat bg-[length:130%_130%] shadow-[0_0_0_8px_var(--background),0_0_32px_#0008_inset] flex items-center justify-center border-4 border-[var(--foreground)] transform-origin-center transition-transform duration-200 ease-out ${
              isPlaying ? "animate-spin" : ""
            } ${isScratching ? "animate-needle-shake" : ""}`}
            onMouseDown={handleSeekBarMouseDown}
            style={
              {
                cursor: "pointer",
                "--needle-rotation": "0deg",
              } as React.CSSProperties
            }
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/5 h-3/5 rounded-full bg-[var(--background)] shadow-[0_0_0_2px_var(--foreground),0_0_12px_#fff8_inset] overflow-hidden z-10 flex items-center justify-center">
              <div className="w-full h-full bg-gradient-to-br from-green-600 via-green-500 to-green-700 rounded-full shadow-[0_0_12px_#0008_inset]" />
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[var(--background)] border-2 border-[var(--foreground)] z-20" />
          </div>

          {/* SVG Pickup Arm/Needle */}
          <svg
            className={`absolute top-[15%] right-[-10%] w-2/3 h-2/3 pointer-events-none z-10 transition-transform duration-500 ease-in-out ${
              isPlaying ? "rotate-[20deg]" : "rotate-[0deg]"
            } ${isScratching ? "animate-needle-shake" : ""}`}
            style={
              {
                transform: `rotate(${isPlaying ? "20deg" : "0deg"})`,
                transformOrigin: "84px 10px",
                position: "absolute",
                top: "15%",
                right: "-10%",
                width: "66.666667%",
                height: "66.666667%",
                "--needle-rotation": isPlaying ? "20deg" : "0deg",
              } as React.CSSProperties
            }
            viewBox="0 0 120 120"
          >
            <rect
              x="80"
              y="10"
              width="8"
              height="60"
              rx="4"
              fill="var(--foreground)"
            />
            <rect
              x="85"
              y="65"
              width="6"
              height="30"
              rx="3"
              fill="var(--foreground)"
            />
            <rect
              x="87"
              y="95"
              width="2"
              height="15"
              rx="1"
              fill="var(--foreground)"
            />
            <circle
              cx="84"
              cy="10"
              r="7"
              fill="var(--background)"
              stroke="var(--foreground)"
              strokeWidth="2"
            />
          </svg>
        </div>
        {/* Nobs as Control Buttons (disabled) */}
        <div className="flex justify-center items-end gap-10 my-2">
          <button className="w-[54px] h-[54px] bg-gradient-to-br from-green-600 via-green-500 to-green-700 border-3 border-[var(--foreground)] rounded-full shadow-[0_2px_8px_#0003,0_0_0_2px_#fff8_inset] flex items-center justify-center cursor-pointer transition-shadow duration-200 hover:shadow-[0_1px_2px_#0006_inset] disabled">
            <FaPlay size={22} color="var(--foreground)" />
          </button>
          <button className="w-[54px] h-[54px] bg-gradient-to-br from-green-600 via-green-500 to-green-700 border-3 border-[var(--foreground)] rounded-full shadow-[0_2px_8px_#0003,0_0_0_2px_#fff8_inset] flex items-center justify-center cursor-pointer transition-shadow duration-200 hover:shadow-[0_1px_2px_#0006_inset] disabled">
            <FaStop size={22} color="var(--foreground)" />
          </button>
          <button className="w-[54px] h-[54px] bg-gradient-to-br from-green-600 via-green-500 to-green-700 border-3 border-[var(--foreground)] rounded-full shadow-[0_2px_8px_#0003,0_0_0_2px_#fff8_inset] flex items-center justify-center cursor-pointer transition-shadow duration-200 hover:shadow-[0_1px_2px_#0006_inset] disabled">
            <FaFastForward size={22} color="var(--foreground)" />
          </button>
          <button className="w-[54px] h-[54px] bg-gradient-to-br from-green-600 via-green-500 to-green-700 border-3 border-[var(--foreground)] rounded-full shadow-[0_2px_8px_#0003,0_0_0_2px_#fff8_inset] flex items-center justify-center cursor-pointer transition-shadow duration-200 hover:shadow-[0_1px_2px_#0006_inset] disabled">
            <FaVolumeUp size={20} color="var(--foreground)" />
          </button>
        </div>
        {/* Volume Bar (disabled) */}
        <div className="flex items-center gap-6 mt-9 mb-3">
          <span className="text-[var(--foreground)] font-mono text-base min-w-[36px] text-right">
            VOL
          </span>
          <div
            className="relative flex-1 h-[18px] flex items-center mx-2 min-w-[120px] cursor-pointer"
            style={{ pointerEvents: "none", opacity: 0.5 }}
          >
            <div className="absolute top-1/2 left-0 w-full h-2 -translate-y-1/2 bg-[var(--foreground)] opacity-12 rounded-md pointer-events-none z-0" />
            <div
              className="absolute top-1/2 left-0 h-2 -translate-y-1/2 bg-[var(--foreground)] opacity-35 rounded-md pointer-events-none z-10"
              style={{ width: `50%` }}
            />
          </div>
          <span className="text-[var(--foreground)] font-mono text-base min-w-[36px] text-right">
            50%
          </span>
        </div>
        {/* Seek Bar (disabled) */}
        <div className="flex items-center gap-6 mb-3">
          <span className="text-[var(--foreground)] font-mono text-base min-w-[36px] text-right">
            0:00
          </span>
          <div
            className="relative flex-1 h-[18px] flex items-center mx-2 min-w-[120px] cursor-pointer"
            style={{ pointerEvents: "none", opacity: 0.5 }}
          >
            <div className="absolute top-1/2 left-0 w-full h-2 -translate-y-1/2 bg-[var(--foreground)] opacity-12 rounded-md pointer-events-none z-0" />
            <div
              className="absolute top-1/2 left-0 h-2 -translate-y-1/2 bg-[var(--foreground)] opacity-35 rounded-md pointer-events-none z-10"
              style={{ width: `0%` }}
            />
          </div>
          <span className="text-[var(--foreground)] font-mono text-base min-w-[36px] text-right">
            0:00
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black/80 rounded-lg shadow-md p-6 flex flex-col items-center w-full h-full">
      {/* Vinyl Section with Pickup Arm */}
      <div className="relative w-full max-w-[340px] aspect-square flex items-center justify-center mb-10 -mt-20">
        <div
          className={`relative w-4/5 h-4/5 min-w-[180px] min-h-[180px] max-w-[320px] max-h-[320px] aspect-square rounded-full bg-[url('/vinylDisk.png')] bg-center bg-no-repeat bg-[length:130%_130%] shadow-[0_0_0_8px_var(--background),0_0_32px_#0008_inset] flex items-center justify-center border-4 border-[var(--foreground)] transform-origin-center transition-transform duration-200 ease-out ${
            isPlaying ? "animate-spin" : ""
          } ${isScratching ? "animate-needle-shake" : ""}`}
          onMouseDown={handleSeekBarMouseDown}
          style={
            {
              cursor: "pointer",
              "--needle-rotation": "0deg",
            } as React.CSSProperties
          }
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/5 h-3/5 rounded-full bg-[var(--background)] shadow-[0_0_0_2px_var(--foreground),0_0_12px_#fff8_inset] overflow-hidden z-10 flex items-center justify-center">
            <Image
              src={currentSong?.artwork?.big?.url || ""}
              alt={currentSong?.title || "Album Art"}
              width={currentSong?.artwork?.big?.width || 640}
              height={currentSong?.artwork?.big?.height || 640}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[var(--background)] border-2 border-[var(--foreground)] z-20" />
        </div>

        {/* SVG Pickup Arm/Needle */}
        <svg
          className={`absolute top-[15%] right-[-10%] w-2/3 h-2/3 pointer-events-none z-10 transition-transform duration-500 ease-in-out ${
            isPlaying ? "rotate-[20deg]" : "rotate-[0deg]"
          } ${isScratching ? "animate-needle-shake" : ""}`}
          style={
            {
              transform: `rotate(${isPlaying ? "20deg" : "0deg"})`,
              transformOrigin: "84px 10px",
              position: "absolute",
              top: "15%",
              right: "-10%",
              width: "66.666667%",
              height: "66.666667%",
              "--needle-rotation": isPlaying ? "20deg" : "0deg",
            } as React.CSSProperties
          }
          viewBox="0 0 120 120"
        >
          <rect
            x="80"
            y="10"
            width="8"
            height="60"
            rx="4"
            fill="var(--foreground)"
          />
          <rect
            x="85"
            y="65"
            width="6"
            height="30"
            rx="3"
            fill="var(--foreground)"
          />
          <rect
            x="87"
            y="95"
            width="2"
            height="15"
            rx="1"
            fill="var(--foreground)"
          />
          <circle
            cx="84"
            cy="10"
            r="7"
            fill="var(--background)"
            stroke="var(--foreground)"
            strokeWidth="2"
          />
        </svg>
      </div>

      {/* Control Buttons */}
      <div className="flex justify-center items-end gap-4 sm:gap-10 my-2 w-full max-w-[400px]">
        <button
          onClick={togglePlay}
          className="w-[54px] h-[54px] bg-gradient-to-br from-green-600 via-green-500 to-green-700 border-3 border-[var(--foreground)] rounded-full shadow-[0_2px_8px_#0003,0_0_0_2px_#fff8_inset] flex items-center justify-center cursor-pointer transition-shadow duration-200 hover:shadow-[0_1px_2px_#0006_inset]"
        >
          {isPlaying ? (
            <FaPause size={22} color="var(--foreground)" />
          ) : (
            <FaPlay size={22} color="var(--foreground)" />
          )}
        </button>
        <button
          onClick={handleStop}
          className="w-[54px] h-[54px] bg-gradient-to-br from-green-600 via-green-500 to-green-700 border-3 border-[var(--foreground)] rounded-full shadow-[0_2px_8px_#0003,0_0_0_2px_#fff8_inset] flex items-center justify-center cursor-pointer transition-shadow duration-200 hover:shadow-[0_1px_2px_#0006_inset]"
        >
          <FaStop size={22} color="var(--foreground)" />
        </button>
        <button
          onClick={handleFastForward}
          className="w-[54px] h-[54px] bg-gradient-to-br from-green-600 via-green-500 to-green-700 border-3 border-[var(--foreground)] rounded-full shadow-[0_2px_8px_#0003,0_0_0_2px_#fff8_inset] flex items-center justify-center cursor-pointer transition-shadow duration-200 hover:shadow-[0_1px_2px_#0006_inset]"
        >
          <FaFastForward size={22} color="var(--foreground)" />
        </button>
        <button
          onClick={toggleMute}
          className="w-[54px] h-[54px] bg-gradient-to-br from-green-600 via-green-500 to-green-700 border-3 border-[var(--foreground)] rounded-full shadow-[0_2px_8px_#0003,0_0_0_2px_#fff8_inset] flex items-center justify-center cursor-pointer transition-shadow duration-200 hover:shadow-[0_1px_2px_#0006_inset]"
        >
          {isMuted ? (
            <FaVolumeMute size={20} color="var(--foreground)" />
          ) : (
            <FaVolumeUp size={20} color="var(--foreground)" />
          )}
        </button>
      </div>

      {/* Volume Slider */}
      <div className="flex items-center gap-4 sm:gap-6 mt-6 sm:mt-9 mb-3 w-full max-w-[400px]">
        <span className="text-[var(--foreground)] font-mono text-base min-w-[36px] text-right">
          VOL
        </span>
        <div
          className="relative flex-1 h-[18px] flex items-center mx-2 min-w-[120px] cursor-pointer volume-bar-container"
          onMouseDown={handleVolumeBarMouseDown}
        >
          <div className="absolute top-1/2 left-0 w-full h-2 -translate-y-1/2 bg-[var(--foreground)] opacity-12 rounded-md pointer-events-none z-0" />
          <div
            className="absolute top-1/2 left-0 h-2 -translate-y-1/2 bg-green-500 rounded-md pointer-events-none z-10 transition-[width] duration-150"
            style={{
              width: `${displayVolume}%`,
            }}
          />
        </div>
        <span className="text-[var(--foreground)] font-mono text-base min-w-[36px] text-right">
          {displayVolume}%
        </span>
      </div>

      {/* Seek Slider */}
      <div className="flex items-center gap-4 sm:gap-6 mb-3 w-full max-w-[400px]">
        <span className="text-[var(--foreground)] font-mono text-base min-w-[36px] text-right">
          {formatTime(
            isSeeking && seekPreview !== null ? seekPreview : progress
          )}
        </span>
        <div
          className="relative flex-1 h-[18px] flex items-center mx-2 min-w-[120px] cursor-pointer seek-bar-container"
          onMouseDown={handleSeekBarMouseDown}
        >
          <div className="absolute top-1/2 left-0 w-full h-2 -translate-y-1/2 bg-[var(--foreground)] opacity-12 rounded-md pointer-events-none z-0" />
          <div
            className="absolute top-1/2 left-0 h-2 -translate-y-1/2 bg-green-500 rounded-md pointer-events-none z-10 transition-[width] duration-150 linear"
            style={{
              width: `${
                duration
                  ? ((isSeeking && seekPreview !== null
                      ? seekPreview
                      : progress) /
                      duration) *
                    100
                  : 0
              }%`,
            }}
          />
        </div>
        <span className="text-[var(--foreground)] font-mono text-base min-w-[36px] text-right">
          {formatTime(duration)}
        </span>
      </div>

      {/* Song Info */}
      <div className="mt-4 sm:mt-5 text-center w-full max-w-[400px]">
        <span className="text-[var(--foreground)] font-mono text-lg font-bold block">
          {currentSong.title}
        </span>
        <span className="text-[var(--foreground)] font-mono text-sm block">
          {currentSong.artist.name}
        </span>
      </div>
    </div>
  );
}
