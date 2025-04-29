"use client";

import { useContext, useEffect, useState, useRef } from "react";
import {
  FaPlay,
  FaPause,
  FaVolumeUp,
  FaVolumeMute,
  FaStop,
  FaFastForward,
} from "react-icons/fa";
import { PlayingContext } from "../../../context/Playing";
import { ServiceType } from "../../../types/playerTypes";
import Image from "next/image";

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    Spotify: {
      Player: typeof Spotify.Player;
    };
  }
}

export default function SpotifyPlayer() {
  const { currentSong, setCurrentSong, playlist } = useContext(PlayingContext);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const [activeDeviceId, setActiveDeviceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;
  const volumeUpdateTimeout = useRef<NodeJS.Timeout>();
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const playerRef = useRef<Spotify.Player | null>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const deviceTransferInProgress = useRef(false);
  const initializationInProgress = useRef(false);
  const [seekPreview, setSeekPreview] = useState<number | null>(null);
  const [isSeeking, setIsSeeking] = useState(false);
  const [isScratching, setIsScratching] = useState(false);
  const lastMouseX = useRef(0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isVolumeDragging, setIsVolumeDragging] = useState(false);
  const [displayVolume, setDisplayVolume] = useState(volume);

  const spotifyToken = localStorage.getItem("spotify_token");

  // Initialize Spotify Web Playback SDK
  useEffect(() => {
    if (!scriptRef.current) {
      scriptRef.current = document.createElement("script");
      scriptRef.current.src = "https://sdk.scdn.co/spotify-player.js";
      scriptRef.current.async = true;
      document.body.appendChild(scriptRef.current);
    }

    window.onSpotifyWebPlaybackSDKReady = () => {
      if (!spotifyToken) return;

      // Prevent multiple initializations
      if (initializationInProgress.current) {
        console.log("Initialization already in progress, skipping");
        return;
      }

      initializationInProgress.current = true;

      // Cleanup existing player
      if (playerRef.current) {
        playerRef.current.disconnect();
        playerRef.current = null;
      }

      // Create new player instance
      playerRef.current = new window.Spotify.Player({
        name: "ReAMP Player",
        getOAuthToken: (cb: (token: string) => void) => {
          cb(spotifyToken);
        },
        volume: volume / 100,
      });

      // Error handling
      playerRef.current.addListener(
        "initialization_error",
        ({ message }: { message: string }) => {
          console.error("Failed to initialize:", message);
          setIsLoading(false);
          setActiveDeviceId(null);
          initializationInProgress.current = false;
          setRetryCount(0);
        }
      );

      playerRef.current.addListener(
        "authentication_error",
        ({ message }: { message: string }) => {
          console.error("Failed to authenticate:", message);
          localStorage.removeItem("spotify_token");
          setIsLoading(false);
          setActiveDeviceId(null);
          initializationInProgress.current = false;
          setRetryCount(0);
        }
      );

      playerRef.current.addListener(
        "account_error",
        ({ message }: { message: string }) => {
          console.error("Failed to validate Spotify account:", message);
          setIsLoading(false);
          setActiveDeviceId(null);
          initializationInProgress.current = false;
          setRetryCount(0);
        }
      );

      // Playback status updates
      playerRef.current.addListener(
        "player_state_changed",
        (state: Spotify.PlaybackState | null) => {
          if (state) {
            setIsPlaying(!state.paused);
          }
        }
      );

      // Ready
      playerRef.current.addListener(
        "ready",
        async ({ device_id }: { device_id: string }) => {
          console.log("Ready with Device ID", device_id);

          // Only proceed if we don't already have an active device
          if (activeDeviceId === device_id) {
            console.log("Device already active, skipping transfer");
            initializationInProgress.current = false;
            return;
          }

          // Set device transfer in progress
          deviceTransferInProgress.current = true;

          try {
            // Transfer playback to our device
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
              throw new Error(
                `Failed to transfer playback: ${response.status}`
              );
            }

            setActiveDeviceId(device_id);
            setIsLoading(false);
            setRetryCount(0);
          } catch (error) {
            console.error("Error transferring playback:", error);

            // Retry if we haven't exceeded max retries
            if (retryCount < maxRetries) {
              setRetryCount(retryCount + 1);
              console.log(
                `Retrying device transfer (${retryCount + 1}/${maxRetries})...`
              );
              setTimeout(() => {
                if (playerRef.current) {
                  playerRef.current.connect();
                }
              }, 1000 * (retryCount + 1)); // Exponential backoff
              return;
            }

            // If transfer fails after retries, disconnect the player
            if (playerRef.current) {
              playerRef.current.disconnect();
              playerRef.current = null;
            }
            setActiveDeviceId(null);
            setIsLoading(false);
            setRetryCount(0);
          } finally {
            deviceTransferInProgress.current = false;
            initializationInProgress.current = false;
          }
        }
      );

      // Not Ready
      playerRef.current.addListener(
        "not_ready",
        ({ device_id }: { device_id: string }) => {
          console.log("Device ID has gone offline", device_id);
          if (activeDeviceId === device_id) {
            setActiveDeviceId(null);
            setIsLoading(false);
          }
        }
      );

      // Connect to the player
      playerRef.current.connect().then((success: boolean) => {
        if (success) {
          console.log("Successfully connected to Spotify!");
        } else {
          console.error("Failed to connect to Spotify");
          initializationInProgress.current = false;
          setRetryCount(0);
        }
      });
    };

    return () => {
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
      setIsLoading(false);
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
      setIsLoading(false);
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
      !isLoading
    ) {
      const token = localStorage.getItem("spotify_token");
      if (!token) return;

      // Play the track on the active device
      fetch(
        `https://api.spotify.com/v1/me/player/play?device_id=${activeDeviceId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            uris: [`spotify:track:${currentSong.id}`],
          }),
        }
      ).catch((error: Error) => {
        console.error("Error playing track:", error);
      });
    }
  }, [currentSong, activeDeviceId, isLoading]);

  // Add track completion handler
  useEffect(() => {
    if (!playerRef.current || isLoading) return;

    const handleTrackEnd = async () => {
      // Find the current track's index in the playlist
      const currentIndex = playlist.findIndex(
        (track) => track.id === currentSong?.id
      );

      // If we have a next track, play it
      if (currentIndex < playlist.length - 1) {
        const nextTrack = playlist[currentIndex + 1];
        if (nextTrack && nextTrack.type === ServiceType.Spotify) {
          setCurrentSong(nextTrack);
          // Ensure the track starts playing
          if (playerRef.current) {
            await playerRef.current.seek(0);
            await playerRef.current.resume();
          }
        }
      } else {
        // End of playlist
        setIsPlaying(false);
      }
    };

    const handleStateChange = (data: unknown) => {
      const state = data as Spotify.PlaybackState | null;
      if (state) {
        const wasPlaying = isPlaying;
        const isNowPlaying = !state.paused;
        setIsPlaying(isNowPlaying);

        // Check if track ended naturally (not by user pause)
        if (wasPlaying && !isNowPlaying && state.position === 0) {
          handleTrackEnd();
        }
      }
    };

    playerRef.current.addListener("player_state_changed", handleStateChange);

    return () => {
      if (playerRef.current) {
        playerRef.current.removeListener(
          "player_state_changed",
          handleStateChange
        );
      }
    };
  }, [playlist, isLoading, setCurrentSong, isPlaying, currentSong]);

  const togglePlay = () => {
    if (!activeDeviceId || isLoading) return;
    const token = localStorage.getItem("spotify_token");
    if (!token) return;

    // Get current playback state
    fetch(`https://api.spotify.com/v1/me/player`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        if (data.is_playing) {
          // Pause playback
          fetch(
            `https://api.spotify.com/v1/me/player/pause?device_id=${activeDeviceId}`,
            {
              method: "PUT",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          ).catch((error: Error) => {
            console.error("Error pausing:", error);
          });
          setIsPlaying(false);
        } else {
          // Resume playback
          fetch(
            `https://api.spotify.com/v1/me/player/play?device_id=${activeDeviceId}`,
            {
              method: "PUT",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          ).catch((error: Error) => {
            console.error("Error playing:", error);
          });
          setIsPlaying(true);
        }
      })
      .catch((error: Error) => {
        console.error("Error getting playback state:", error);
      });
  };

  const handleStop = () => {
    if (!activeDeviceId || isLoading) return;
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
    if (playerRef.current && !isLoading) {
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

    if (playerRef.current && !isLoading) {
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
    setIsVolumeDragging(true);
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

    if (playerRef.current && !isLoading) {
      playerRef.current.setVolume(newVolume / 100);
      setDisplayVolume(newVolume);
    }
  };

  const handleVolumeBarMouseUp = () => {
    setIsVolumeDragging(false);
    window.removeEventListener("mousemove", handleVolumeBarMove);
    window.removeEventListener("mouseup", handleVolumeBarMouseUp);
  };

  const toggleMute = async () => {
    if (!playerRef.current || isLoading) return;

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
    const timeout = volumeUpdateTimeout.current;
    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, []);

  // Add progress update effect
  useEffect(() => {
    if (isPlaying && !isLoading) {
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
  }, [isPlaying, isLoading]);

  // Add style tag for animations
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes needle-shake {
        0% { transform: rotate(30deg); }
        25% { transform: rotate(32deg); }
        50% { transform: rotate(30deg); }
        75% { transform: rotate(28deg); }
        100% { transform: rotate(30deg); }
      }
      .animate-needle-shake {
        animation: needle-shake 0.1s infinite;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
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
      <div className="bg-black/80 rounded-lg shadow-md p-6 flex flex-col items-center max-w-full w-full mx-auto">
        {/* Vinyl Section with Pickup Arm */}
        <div className="relative w-[340px] h-[340px] flex items-center justify-center mb-10">
          <div
            className={`relative w-4/5 h-4/5 min-w-[180px] min-h-[180px] max-w-[320px] max-h-[320px] aspect-square rounded-full bg-[url('/vinylDisk.png')] bg-center bg-no-repeat bg-[length:130%_130%] shadow-[0_0_0_8px_var(--background),0_0_32px_#0008_inset] flex items-center justify-center border-4 border-[var(--foreground)] transform-origin-center transition-transform duration-200 ease-out ${
              isPlaying ? "animate-spin" : ""
            } ${isScratching ? "animate-needle-shake" : ""}`}
            onMouseDown={handleSeekBarMouseDown}
            style={{ cursor: "pointer" }}
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/5 h-3/5 rounded-full bg-[var(--background)] shadow-[0_0_0_2px_var(--foreground),0_0_12px_#fff8_inset] overflow-hidden z-10 flex items-center justify-center">
              <div className="w-full h-full bg-gradient-to-br from-green-600 via-green-500 to-green-700 rounded-full shadow-[0_0_12px_#0008_inset]" />
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[var(--background)] border-2 border-[var(--foreground)] z-20" />
          </div>

          {/* SVG Pickup Arm/Needle */}
          <svg
            className={`absolute top-[10%] right-[-5%] w-3/5 h-3/5 pointer-events-none z-10 transform-origin-[84px_10px] transition-transform duration-500 ease-in-out ${
              isPlaying ? "rotate-[30deg]" : "rotate-[0deg]"
            } ${isScratching ? "animate-needle-shake" : ""}`}
            style={
              {
                "--needle-rotation": isPlaying ? "30deg" : "0deg",
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
    <div className="bg-black/80 rounded-lg shadow-md p-6 flex flex-col items-center max-w-full w-full mx-auto">
      {/* Vinyl Section with Pickup Arm */}
      <div className="relative w-[340px] h-[340px] flex items-center justify-center mb-10">
        <div
          className={`relative w-4/5 h-4/5 min-w-[180px] min-h-[180px] max-w-[320px] max-h-[320px] aspect-square rounded-full bg-[url('/vinylDisk.png')] bg-center bg-no-repeat bg-[length:130%_130%] shadow-[0_0_0_8px_var(--background),0_0_32px_#0008_inset] flex items-center justify-center border-4 border-[var(--foreground)] transform-origin-center transition-transform duration-200 ease-out ${
            isPlaying ? "animate-spin" : ""
          } ${isScratching ? "animate-needle-shake" : ""}`}
          onMouseDown={handleSeekBarMouseDown}
          style={{ cursor: "pointer" }}
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
          className={`absolute top-[10%] right-[-5%] w-3/5 h-3/5 pointer-events-none z-10 transform-origin-[84px_10px] transition-transform duration-500 ease-in-out ${
            isPlaying ? "rotate-[30deg]" : "rotate-[0deg]"
          } ${isScratching ? "animate-needle-shake" : ""}`}
          style={
            {
              "--needle-rotation": isPlaying ? "30deg" : "0deg",
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
      <div className="flex justify-center items-end gap-10 my-2">
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
      <div className="flex items-center gap-6 mt-9 mb-3">
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
      <div className="flex items-center gap-6 mb-3">
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
      <div className="mt-5 text-center">
        <span className="text-[var(--foreground)] font-mono text-base font-bold text-lg block">
          {currentSong.title}
        </span>
        <span className="text-[var(--foreground)] font-mono text-base text-sm block">
          {currentSong.artist.name}
        </span>
      </div>
    </div>
  );
}
