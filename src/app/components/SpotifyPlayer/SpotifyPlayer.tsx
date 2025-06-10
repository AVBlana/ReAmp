"use client";

import { useEffect, useState, useRef, useCallback } from "react";
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
import type {
  Player,
  PlaybackState,
  PlayerOptions,
} from "spotify-web-playback-sdk";
import { useSpotify } from "@/context/UnifiedContext";

// Define proper types for the song object
interface Artist {
  name: string;
}

interface Artwork {
  big: {
    url: string;
    width: number;
    height: number;
  };
}

interface Song {
  id: string;
  title: string;
  artist: Artist;
  artwork: Artwork;
  type: ServiceType;
}

// Constants
const MAX_RETRIES = 3;
const FAST_FORWARD_AMOUNT = 30000;

// Type guard for Player with setVolume
interface PlayerWithVolume extends Player {
  setVolume(volume: number): Promise<void>;
}

function hasSetVolume(player: unknown): player is PlayerWithVolume {
  return typeof player === "object" && player !== null && "setVolume" in player;
}

// Define Spotify SDK window interface
type SpotifySDKWindow = Window & {
  Spotify?: {
    Player: new (config: PlayerOptions) => unknown;
  };
  onSpotifyWebPlaybackSDKReady?: () => void;
};

// Add a global player instance reference
let globalPlayerInstance: Player | null = null;
let globalPlayerInitializing = false;

// Add a global script loading state
let scriptLoadPromise: Promise<void> | null = null;

// Add proper types for event handlers
// type SpotifyPlayerEventHandlers = { ... }

export default function SpotifyPlayer() {
  const { currentSong, setCurrentSong, playlist } = useSpotify();
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume] = useState(50);
  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [seekPreview, setSeekPreview] = useState<number | null>(null);
  const [isSeeking, setIsSeeking] = useState(false);
  const [isScratching, setIsScratching] = useState(false);
  const [displayVolume, setDisplayVolume] = useState(volume);
  const [spotifyToken, setSpotifyToken] = useState<string | null>(null);
  const [activeDeviceId, setActiveDeviceId] = useState<string | null>(null);
  const [tokenExpiryTime, setTokenExpiryTime] = useState<number | null>(null);

  // Refs
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const playerRef = useRef<Player | null>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const deviceTransferInProgress = useRef(false);
  const initializationInProgress = useRef(false);
  const lastMouseX = useRef(0);
  const isHandlingTrackEndRef = useRef(false);

  // Add a ref to track if we've already attempted to load the script
  const hasAttemptedScriptLoad = useRef(false);

  // Move refreshToken and transferPlayback before setupPlayerListeners
  const refreshToken = async () => {
    const lastRefresh = localStorage.getItem("spotify_token_last_refresh");
    const now = Date.now();

    // Prevent refreshing more than once every 30 seconds
    if (lastRefresh && now - parseInt(lastRefresh) < 30000) {
      console.log("Token refresh rate limited");
      return;
    }

    try {
      console.log("Refreshing Spotify token...");
      const response = await fetch("/api/spotify/refresh");
      if (!response.ok) {
        throw new Error("Failed to refresh token");
      }
      const data = await response.json();
      if (typeof window !== "undefined") {
        localStorage.setItem("spotify_token", data.access_token);
        localStorage.setItem("spotify_token_last_refresh", now.toString());
        setSpotifyToken(data.access_token);

        // Don't reconnect player, just update the token
        if (playerRef.current) {
          // The player will automatically use the new token on next request
          console.log(
            "Token refreshed, player will use new token automatically"
          );
        }
      }
    } catch (error) {
      console.error("Error refreshing token:", error);
      // If refresh fails, redirect to login
      window.location.href = "/api/spotify/login";
    }
  };

  const transferPlayback = async (deviceId: string, retryCount = 0) => {
    try {
      const response = await fetch(`https://api.spotify.com/v1/me/player`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${spotifyToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          device_ids: [deviceId],
          play: false,
        }),
      });

      if (!response.ok) {
        if (response.status === 404 && retryCount < MAX_RETRIES) {
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * (retryCount + 1))
          );
          return transferPlayback(deviceId, retryCount + 1);
        }
        throw new Error(`Failed to transfer playback: ${response.status}`);
      }

      setActiveDeviceId(deviceId);
      setIsActive(false);
      deviceTransferInProgress.current = false;
    } catch (error) {
      console.error("Error transferring playback:", error);
      if (retryCount < MAX_RETRIES) {
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * (retryCount + 1))
        );
        return transferPlayback(deviceId, retryCount + 1);
      }
      throw error;
    }
  };

  // Modify the setupPlayerListeners function to use proper types
  const setupPlayerListeners = useCallback(
    (player: Player) => {
      // Add listeners individually with proper type casting
      player.addListener(
        "initialization_error",
        (data: { message: string }) => {
          console.error("Failed to initialize:", data.message);
          setIsActive(false);
          initializationInProgress.current = false;

          if (
            data.message.includes("404") ||
            data.message.includes("MediaKeySystemAccess")
          ) {
            void refreshToken();
          }
        }
      );

      player.addListener(
        "authentication_error",
        async (data: { message: string }) => {
          console.error("Failed to authenticate:", data.message);
          try {
            await refreshToken();
          } catch (refreshError) {
            console.error("Token refresh failed:", refreshError);
            localStorage.removeItem("spotify_token");
            setIsActive(false);
            initializationInProgress.current = false;
            window.location.href = "/api/spotify/login";
          }
        }
      );

      player.addListener("account_error", (data: { message: string }) => {
        console.error("Failed to validate Spotify account:", data.message);
        setIsActive(false);
        initializationInProgress.current = false;
      });

      player.addListener("playback_error", (data: { message: string }) => {
        console.error("Playback error:", data.message);
        setIsActive(false);
      });

      player.addListener(
        "player_state_changed",
        (state: PlaybackState | null) => {
          if (state) {
            setIsPlaying(!state.paused);
            setProgress(state.position);
            setDuration(state.duration);
          }
        }
      );

      player.addListener("ready", async (data: { device_id: string }) => {
        console.log("Player is ready with Device ID:", data.device_id);
        if (activeDeviceId === data.device_id) {
          initializationInProgress.current = false;
          return;
        }

        deviceTransferInProgress.current = true;
        try {
          await transferPlayback(data.device_id);
        } catch (error) {
          console.error("Error in device transfer:", error);
          setIsActive(false);
          deviceTransferInProgress.current = false;
          initializationInProgress.current = false;
        }
      });

      player.addListener("not_ready", (data: { device_id: string }) => {
        console.log("Device ID has gone offline:", data.device_id);
        if (activeDeviceId === data.device_id) {
          setActiveDeviceId(null);
          setIsActive(false);
        }
      });
    },
    [
      activeDeviceId,
      refreshToken,
      transferPlayback,
      setIsActive,
      setIsPlaying,
      setProgress,
      setDuration,
      setActiveDeviceId,
    ]
  );

  // Initialize token from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      setSpotifyToken(localStorage.getItem("spotify_token"));
    }
  }, []);

  // Add cleanup function for player listeners
  const cleanupPlayerListeners = useCallback(
    (player: Player) => {
      // Store references to the event handlers
      const handlers = {
        initialization_error: (data: unknown) => {
          const { message } = data as { message: string };
          console.error("Failed to initialize:", message);
        },
        authentication_error: async (data: unknown) => {
          const { message } = data as { message: string };
          console.error("Failed to authenticate:", message);
        },
        account_error: (data: unknown) => {
          const { message } = data as { message: string };
          console.error("Failed to validate Spotify account:", message);
        },
        playback_error: (data: unknown) => {
          const { message } = data as { message: string };
          console.error("Playback error:", message);
        },
        player_state_changed: (data: unknown) => {
          const state = data as PlaybackState | null;
          if (state) {
            setIsPlaying(!state.paused);
            setProgress(state.position);
            setDuration(state.duration);
          }
        },
        ready: async (data: unknown) => {
          const { device_id } = data as { device_id: string };
          console.log("Player is ready with Device ID:", device_id);
        },
        not_ready: (data: unknown) => {
          const { device_id } = data as { device_id: string };
          console.log("Device ID has gone offline:", device_id);
        },
      };

      // Remove all listeners using the stored handlers
      (Object.keys(handlers) as Array<keyof typeof handlers>).forEach(
        (event) => {
          player.removeListener(event, handlers[event]);
        }
      );
    },
    [setIsPlaying, setProgress, setDuration]
  );

  // Modify the initialization effect
  useEffect(() => {
    if (!spotifyToken) {
      console.log("No Spotify token available, skipping initialization");
      return;
    }

    // If we've already attempted to load the script, don't try again
    if (hasAttemptedScriptLoad.current) {
      return;
    }

    const loadScript = () => {
      if (scriptLoadPromise) {
        return scriptLoadPromise;
      }

      if (
        document.querySelector(
          'script[src="https://sdk.scdn.co/spotify-player.js"]'
        )
      ) {
        scriptLoadPromise = Promise.resolve();
        return scriptLoadPromise;
      }

      hasAttemptedScriptLoad.current = true;

      scriptLoadPromise = new Promise((resolve, reject) => {
        scriptRef.current = document.createElement("script");
        scriptRef.current.src = "https://sdk.scdn.co/spotify-player.js";
        scriptRef.current.async = true;

        scriptRef.current.onload = () => {
          resolve();
        };

        scriptRef.current.onerror = (error) => {
          scriptLoadPromise = null;
          reject(error);
        };

        (window as unknown as SpotifySDKWindow).onSpotifyWebPlaybackSDKReady =
          () => {
            initializePlayer();
            resolve();
          };

        document.body.appendChild(scriptRef.current);
      });

      return scriptLoadPromise;
    };

    const initializePlayer = async () => {
      if (globalPlayerInitializing || globalPlayerInstance) {
        return;
      }

      globalPlayerInitializing = true;
      initializationInProgress.current = true;

      try {
        const playerOptions: PlayerOptions = {
          name: "ReAMP Player",
          getOAuthToken: (cb) => {
            const currentToken = localStorage.getItem("spotify_token");
            if (!currentToken) {
              console.error("No Spotify token available");
              return;
            }
            cb(currentToken);
          },
        };

        const sdkWindow = window as unknown as SpotifySDKWindow;
        if (!sdkWindow.Spotify?.Player) {
          throw new Error("Spotify SDK not loaded");
        }

        // Use global instance if it exists
        if (globalPlayerInstance) {
          playerRef.current = globalPlayerInstance;
          setupPlayerListeners(globalPlayerInstance);
          return;
        }

        const rawPlayer = new sdkWindow.Spotify.Player(playerOptions);
        const player = rawPlayer as unknown as Player;

        // Set initial volume after player creation
        await player.connect();
        if (hasSetVolume(player)) {
          await player.setVolume(volume / 100);
        }

        setupPlayerListeners(player);
        playerRef.current = player;
        globalPlayerInstance = player;
      } catch (error) {
        console.error("Error creating Spotify player:", error);
        initializationInProgress.current = false;
        globalPlayerInitializing = false;
      }
    };

    // Load the script and initialize the player
    loadScript().catch((error) => {
      console.error("Failed to load Spotify SDK:", error);
      hasAttemptedScriptLoad.current = false;
      scriptLoadPromise = null;
    });

    return () => {
      if (playerRef.current) {
        cleanupPlayerListeners(playerRef.current);
        playerRef.current = null;
      }
      setActiveDeviceId(null);
      setIsActive(false);
      deviceTransferInProgress.current = false;
      initializationInProgress.current = false;
    };
  }, [spotifyToken, volume, setupPlayerListeners, cleanupPlayerListeners]);

  // Modify the play track effect to handle 404 errors better
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
          const token = localStorage.getItem("spotify_token");
          if (!token) {
            await refreshToken();
            return playTrack(retryCount);
          }

          // First, ensure the device is active
          await fetch(`https://api.spotify.com/v1/me/player`, {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              device_ids: [activeDeviceId],
              play: false,
            }),
          });

          // Wait a moment for the device to be ready
          await new Promise((resolve) => setTimeout(resolve, 500));

          // Then try to play the track
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
            if (response.status === 401) {
              await refreshToken();
              return playTrack(retryCount);
            }

            if (response.status === 404 && retryCount < MAX_RETRIES) {
              console.log(
                `Retrying track playback (${retryCount + 1}/${MAX_RETRIES})...`
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
          if (retryCount < MAX_RETRIES) {
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

    const handleTrackEnd = async () => {
      if (isHandlingTrackEndRef.current) return;
      isHandlingTrackEndRef.current = true;

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
        isHandlingTrackEndRef.current = false;
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
      const newPosition = Math.min(progress + FAST_FORWARD_AMOUNT, duration);
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

    if (playerRef.current && !isActive && hasSetVolume(playerRef.current)) {
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
        if (hasSetVolume(playerRef.current)) {
          await playerRef.current.setVolume(0.5);
        }
        setDisplayVolume(50);
        setIsMuted(false);
      } else {
        // Mute by setting volume to 0
        if (hasSetVolume(playerRef.current)) {
          await playerRef.current.setVolume(0);
        }
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
      @keyframes holographic-glow {
        0%, 100% {
          box-shadow: 
            0 0 20px rgba(29,185,84,0.6),
            0 0 40px rgba(29,185,84,0.4),
            inset 0 0 20px rgba(29,185,84,0.4),
            0 0 60px rgba(29,185,84,0.2);
          filter: brightness(1) hue-rotate(0deg);
        }
        50% {
          box-shadow: 
            0 0 30px rgba(29,185,84,0.8),
            0 0 60px rgba(29,185,84,0.6),
            inset 0 0 30px rgba(29,185,84,0.6),
            0 0 90px rgba(29,185,84,0.4);
          filter: brightness(1.2) hue-rotate(10deg);
        }
      }

      @keyframes holographic-shine {
        0% {
          background-position: -200% center;
        }
        100% {
          background-position: 200% center;
        }
      }

      @keyframes icon-pulse {
        0%, 100% {
          transform: scale(1);
          filter: drop-shadow(0 0 8px rgba(29,185,84,0.8));
        }
        50% {
          transform: scale(1.1);
          filter: drop-shadow(0 0 12px rgba(29,185,84,1));
        }
      }

      .futuristic-button {
        background: linear-gradient(
          135deg,
          rgba(29,185,84,0.9) 0%,
          rgba(46,213,115,0.95) 25%,
          rgba(29,185,84,0.9) 50%,
          rgba(46,213,115,0.95) 75%,
          rgba(29,185,84,0.9) 100%
        );
        background-size: 200% 200%;
        position: relative;
        border: 2px solid rgba(255,255,255,0.2);
        backdrop-filter: blur(5px);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        overflow: hidden;
      }

      .futuristic-button::before {
        content: '';
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: linear-gradient(
          45deg,
          transparent 0%,
          rgba(255,255,255,0.1) 45%,
          rgba(255,255,255,0.2) 50%,
          rgba(255,255,255,0.1) 55%,
          transparent 100%
        );
        transform: rotate(45deg);
        animation: holographic-shine 3s linear infinite;
        pointer-events: none;
      }

      .futuristic-button:hover {
        animation: holographic-glow 2s ease-in-out infinite;
        transform: translateY(-2px) scale(1.05);
        border-color: rgba(255,255,255,0.4);
      }

      .futuristic-button:hover svg {
        animation: icon-pulse 1.5s ease-in-out infinite;
      }

      .futuristic-button:active {
        transform: scale(0.95) translateY(0);
        animation: none;
        box-shadow: 
          0 0 15px rgba(29,185,84,0.4),
          inset 0 0 10px rgba(29,185,84,0.3);
      }

      .futuristic-button.disabled {
        opacity: 0.5;
        filter: grayscale(0.7);
        animation: none;
        pointer-events: none;
      }

      .futuristic-button.disabled:hover {
        transform: none;
        animation: none;
      }

      .futuristic-button.disabled:hover svg {
        animation: none;
      }

      @keyframes marquee {
        0% { transform: translateX(0); }
        100% { transform: translateX(-50%); }
      }
      .marquee-container {
        width: 100%;
        overflow: hidden;
        white-space: nowrap;
        position: relative;
      }
      .marquee-content {
        display: inline-block;
        white-space: nowrap;
      }
      .marquee-content.overflowing {
        display: inline-flex;
        animation: marquee 20s linear infinite;
      }
      .marquee-content.overflowing::after {
        content: attr(data-text);
        padding-left: 2rem;
      }
      .marquee-content.overflowing:hover {
        animation-play-state: paused;
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

  const renderControlButton = (
    onClick: (() => void) | undefined,
    icon: React.ReactNode,
    disabled = false
  ) => (
    <button
      onClick={onClick}
      className={`futuristic-button relative z-20 w-[54px] h-[54px] rounded-full flex items-center justify-center cursor-pointer ${
        disabled ? "disabled" : ""
      }`}
      disabled={disabled}
      style={{ pointerEvents: disabled ? "none" : "auto" }}
    >
      {icon}
    </button>
  );

  const renderIcon = (
    Icon: React.ComponentType<{ size: number; className?: string }>,
    size: number
  ) => (
    <Icon
      size={size}
      className="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]"
    />
  );

  const renderAlbumArt = (song: Song | null) => {
    if (!song?.artwork?.big?.url) {
      return (
        <div className="w-full h-full bg-gradient-to-br from-green-600 via-green-500 to-green-700 rounded-full shadow-[0_0_12px_#0008_inset]" />
      );
    }

    return (
      <Image
        src={song.artwork.big.url}
        alt={song.title || "Album Art"}
        width={song.artwork.big.width || 640}
        height={song.artwork.big.height || 640}
        className="w-full h-full object-cover"
        priority
      />
    );
  };

  const MarqueeText = ({
    text,
    className,
  }: {
    text: string;
    className: string;
  }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const [isOverflowing, setIsOverflowing] = useState(false);

    useEffect(() => {
      const checkOverflow = () => {
        if (containerRef.current && contentRef.current) {
          const isOverflow =
            contentRef.current.scrollWidth > containerRef.current.clientWidth;
          setIsOverflowing(isOverflow);
        }
      };

      checkOverflow();
      window.addEventListener("resize", checkOverflow);
      return () => window.removeEventListener("resize", checkOverflow);
    }, [text]);

    return (
      <div ref={containerRef} className="marquee-container">
        <div
          ref={contentRef}
          className={`marquee-content ${isOverflowing ? "overflowing" : ""}`}
          data-text={text}
        >
          <span className={className}>{text}</span>
        </div>
      </div>
    );
  };

  const renderSongInfo = (song: Song | null) => (
    <div className="w-full max-w-[400px] px-4">
      <MarqueeText
        text={song?.title || "No song selected"}
        className="text-[var(--foreground)] font-mono text-lg font-bold"
      />
      <MarqueeText
        text={song?.artist?.name || "Unknown artist"}
        className="text-[var(--foreground)] font-mono text-sm mt-1"
      />
    </div>
  );

  // Remove the token expiry check effect and split it into two separate effects
  // First effect: Set initial token expiry time when token changes
  useEffect(() => {
    if (!spotifyToken) return;

    // Set token expiry time (1 hour from now)
    const expiryTime = Date.now() + 55 * 60 * 1000; // 55 minutes to be safe
    setTokenExpiryTime(expiryTime);
  }, [spotifyToken]); // Only depend on spotifyToken

  // Second effect: Check token expiry periodically
  useEffect(() => {
    if (!tokenExpiryTime) return;

    const checkInterval = setInterval(() => {
      if (Date.now() >= tokenExpiryTime) {
        void refreshToken();
      }
    }, 60 * 1000);

    return () => {
      clearInterval(checkInterval);
    };
  }, [tokenExpiryTime]); // Only depend on tokenExpiryTime

  if (!currentSong) {
    return (
      <div className="bg-black/80 rounded-lg shadow-md p-4 sm:p-6 flex flex-col items-center w-full h-full">
        {/* Vinyl Section with Pickup Arm */}
        <div className="w-full max-w-[90%] aspect-square flex items-center justify-center z-0 mb-8">
          <div
            className={`relative w-4/5 h-4/5 min-w-[200px] min-h-[200px] max-w-[320px] max-h-[320px] aspect-square rounded-full bg-[url('/vinylDisk.png')] bg-center bg-no-repeat bg-[length:130%_130%] shadow-[0_0_0_8px_var(--background),0_0_32px_#0008_inset] flex items-center justify-center border-4 border-[var(--foreground)] transform-origin-center transition-transform duration-200 ease-out ${
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
              {renderAlbumArt(currentSong as Song | null)}
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[var(--background)] border-2 border-[var(--foreground)] z-20" />
          </div>

          {/* SVG Pickup Arm/Needle */}
          <svg
            className={`absolute top-[15%] right-[-5%] w-1/2 h-1/2 pointer-events-none z-20 transition-transform duration-500 ease-in-out ${
              isPlaying ? "rotate-[20deg]" : "rotate-[0deg]"
            } ${isScratching ? "animate-needle-shake" : ""}`}
            style={
              {
                transform: `rotate(${isPlaying ? "20deg" : "0deg"})`,
                transformOrigin: "84px 10px",
                position: "absolute",
                top: "15%",
                right: "-5%",
                width: "50%",
                height: "50%",
                "--needle-rotation": isPlaying ? "20deg" : "0deg",
                filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
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
        <div className="flex justify-center items-end gap-4 sm:gap-10 mb-4 w-full max-w-[400px] px-4">
          {renderControlButton(undefined, renderIcon(FaPlay, 22), true)}
          {renderControlButton(undefined, renderIcon(FaStop, 22), true)}
          {renderControlButton(undefined, renderIcon(FaFastForward, 22), true)}
          {renderControlButton(undefined, renderIcon(FaVolumeUp, 20), true)}
        </div>

        {/* Volume Slider */}
        <div className="flex items-center gap-4 sm:gap-6 mb-3 w-full max-w-[400px] px-4">
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
              style={{ width: `${displayVolume}%` }}
            />
          </div>
          <span className="text-[var(--foreground)] font-mono text-base min-w-[36px] text-right">
            {displayVolume}%
          </span>
        </div>

        {/* Seek Slider */}
        <div className="flex items-center gap-4 sm:gap-6 mb-3 w-full max-w-[400px] px-4">
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
        <div className="mt-auto mb-8 w-full max-w-[400px] px-4">
          {renderSongInfo(currentSong as Song | null)}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black/80 rounded-lg shadow-md p-4 sm:p-6 flex flex-col items-center w-full h-full">
      {/* Vinyl Section with Pickup Arm */}
      <div className="w-full max-w-[90%] aspect-square flex items-center justify-center z-0 mb-8">
        <div
          className={`relative w-4/5 h-4/5 min-w-[200px] min-h-[200px] max-w-[320px] max-h-[320px] aspect-square rounded-full bg-[url('/vinylDisk.png')] bg-center bg-no-repeat bg-[length:130%_130%] shadow-[0_0_0_8px_var(--background),0_0_32px_#0008_inset] flex items-center justify-center border-4 border-[var(--foreground)] transform-origin-center transition-transform duration-200 ease-out ${
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
            {renderAlbumArt(currentSong as Song | null)}
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[var(--background)] border-2 border-[var(--foreground)] z-20" />
        </div>

        {/* SVG Pickup Arm/Needle */}
        <svg
          className={`absolute top-[15%] right-[-5%] w-1/2 h-1/2 pointer-events-none z-20 transition-transform duration-500 ease-in-out ${
            isPlaying ? "rotate-[20deg]" : "rotate-[0deg]"
          } ${isScratching ? "animate-needle-shake" : ""}`}
          style={
            {
              transform: `rotate(${isPlaying ? "20deg" : "0deg"})`,
              transformOrigin: "84px 10px",
              position: "absolute",
              top: "15%",
              right: "-5%",
              width: "50%",
              height: "50%",
              "--needle-rotation": isPlaying ? "20deg" : "0deg",
              filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
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
      <div className="flex justify-center items-end gap-4 sm:gap-10 mb-4 w-full max-w-[400px] px-4">
        {renderControlButton(
          togglePlay,
          isPlaying ? renderIcon(FaPause, 22) : renderIcon(FaPlay, 22)
        )}
        {renderControlButton(handleStop, renderIcon(FaStop, 22))}
        {renderControlButton(handleFastForward, renderIcon(FaFastForward, 22))}
        {renderControlButton(
          toggleMute,
          isMuted ? renderIcon(FaVolumeMute, 20) : renderIcon(FaVolumeUp, 20)
        )}
      </div>

      {/* Volume Slider */}
      <div className="flex items-center gap-4 sm:gap-6 mb-3 w-full max-w-[400px] px-4">
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
            style={{ width: `${displayVolume}%` }}
          />
        </div>
        <span className="text-[var(--foreground)] font-mono text-base min-w-[36px] text-right">
          {displayVolume}%
        </span>
      </div>

      {/* Seek Slider */}
      <div className="flex items-center gap-4 sm:gap-6 mb-3 w-full max-w-[400px] px-4">
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
      <div className="text-center w-full max-w-[400px] px-4 mt-auto mb-4">
        {renderSongInfo(currentSong as Song | null)}
      </div>
    </div>
  );
}
