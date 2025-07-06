"use client";

import { useEffect, useState, useRef } from "react";
import {
  FaExchangeAlt,
  FaPlay,
  FaPause,
  FaStop,
  FaVolumeUp,
  FaVolumeMute,
} from "react-icons/fa";
import { Droppable } from "@hello-pangea/dnd";
import { useUnifiedContext } from "@/context/UnifiedContext";
import { ServiceType, Song } from "@/types/playerTypes";
import { YoutubeVideo } from "../Services/YtService";
import { motion, useAnimation, AnimatePresence } from "framer-motion";

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

interface DJSetPlayerProps {
  className?: string;
}

// Add minimal YT and Spotify type definitions if not present
// These should be replaced by proper types if available in the project

export type YTPlayerState = 0 | 1 | 2 | 3 | 5;
export interface YTPlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  stopVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  setVolume: (volume: number) => void;
  getPlayerState: () => YTPlayerState;
  getCurrentTime: () => number;
  getDuration: () => number;
  destroy: () => void;
}

export interface SpotifyPlayer {
  connect: () => Promise<boolean>;
  disconnect: () => void;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  seek: (position_ms: number) => Promise<void>;
  setVolume?: (volume: number) => Promise<void>;
  getCurrentState: () => Promise<SpotifyPlaybackState | null>;
  addListener: (event: string, cb: (...args: unknown[]) => void) => void;
  removeListener: (event: string, cb: (...args: unknown[]) => void) => void;
  _options?: { device_id?: string };
}
export interface SpotifyPlaybackState {
  position: number;
  duration: number;
  paused: boolean;
}

// YouTube Player Manager for multiple instances
class YouTubePlayerManager {
  private players: Map<string, YTPlayer> = new Map();
  private containers: Map<string, HTMLDivElement> = new Map();
  private isApiReady = false;

  async createPlayer(
    playerId: string,
    videoId: string,
    container: HTMLDivElement
  ) {
    // Clean up existing player if any
    this.destroyPlayer(playerId);

    // Store container reference
    this.containers.set(playerId, container);

    // Load YouTube API if not already loaded
    if (!this.isApiReady) {
      await this.loadYouTubeAPI();
    }

    return new Promise((resolve, reject) => {
      try {
        const player = new (window.YT.Player as unknown as new (
          ...args: unknown[]
        ) => YTPlayer)(container, {
          videoId: videoId,
          playerVars: {
            autoplay: 0,
            modestbranding: 1,
            rel: 0,
            enablejsapi: 1,
            playsinline: 1,
            controls: 0, // Hide controls for DJ interface
          },
          events: {
            onReady: () => {
              this.players.set(playerId, player as unknown as YTPlayer);
              resolve(player);
            },
            onStateChange: () => {
              // Handle state changes if needed
            },
          },
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  private loadYouTubeAPI(): Promise<void> {
    return new Promise((resolve) => {
      if (this.isApiReady) {
        resolve();
        return;
      }

      // Check if script already exists
      if (
        document.querySelector(
          'script[src="https://www.youtube.com/iframe_api"]'
        )
      ) {
        this.isApiReady = true;
        resolve();
        return;
      }

      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];

      try {
        if (firstScriptTag && firstScriptTag.parentNode) {
          firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        } else {
          document.head.appendChild(tag);
        }
      } catch (error) {
        console.error("Error loading YouTube API script:", error);
        document.head.appendChild(tag);
      }

      (
        window as unknown as { onYouTubeIframeAPIReady: () => void }
      ).onYouTubeIframeAPIReady = () => {
        this.isApiReady = true;
        resolve();
      };
    });
  }

  playPlayer(playerId: string) {
    const player = this.players.get(playerId);
    if (player && typeof player.playVideo === "function") {
      player.playVideo();
    }
  }

  pausePlayer(playerId: string) {
    const player = this.players.get(playerId);
    if (player && typeof player.pauseVideo === "function") {
      player.pauseVideo();
    }
  }

  stopPlayer(playerId: string) {
    const player = this.players.get(playerId);
    if (player && typeof player.stopVideo === "function") {
      player.stopVideo();
    }
  }

  seekPlayer(playerId: string, seconds: number) {
    const player = this.players.get(playerId);
    if (player && typeof player.seekTo === "function") {
      player.seekTo(seconds, true);
    }
  }

  setVolume(playerId: string, volume: number) {
    const player = this.players.get(playerId);
    if (player && typeof player.setVolume === "function") {
      player.setVolume(volume);
    }
  }

  getPlayerState(playerId: string): number {
    const player = this.players.get(playerId);
    return player && typeof player.getPlayerState === "function"
      ? player.getPlayerState()
      : -1;
  }

  getCurrentTime(playerId: string): number {
    const player = this.players.get(playerId);
    return player && typeof player.getCurrentTime === "function"
      ? player.getCurrentTime()
      : 0;
  }

  getDuration(playerId: string): number {
    const player = this.players.get(playerId);
    return player && typeof player.getDuration === "function"
      ? player.getDuration()
      : 0;
  }

  destroyPlayer(playerId: string) {
    const player = this.players.get(playerId);
    if (player && typeof player.destroy === "function") {
      try {
        player.destroy();
      } catch (error) {
        console.error("Error destroying YouTube player:", error);
      }
      this.players.delete(playerId);
    }

    const container = this.containers.get(playerId);
    if (container) {
      container.innerHTML = "";
      this.containers.delete(playerId);
    }
  }

  destroyAll() {
    for (const playerId of this.players.keys()) {
      this.destroyPlayer(playerId);
    }
  }
}

// Spotify Player Manager for multiple instances using Web Playback SDK
class SpotifyPlayerManager {
  private players: Map<string, SpotifyPlayer> = new Map();
  private tokens: Map<string, string> = new Map();
  private deviceIds: Map<string, string> = new Map();
  trackInfo: Map<string, { trackId: string; token: string }> = new Map();
  private isApiReady = false;
  private scriptLoadPromise: Promise<void> | null = null;
  private globalPlayerInstance: SpotifyPlayer | null = null;
  private globalPlayerInitializing = false;

  private async loadSpotifySDK(): Promise<void> {
    if (this.isApiReady) return;

    if (this.scriptLoadPromise) {
      return this.scriptLoadPromise;
    }

    if (
      document.querySelector(
        'script[src="https://sdk.scdn.co/spotify-player.js"]'
      )
    ) {
      this.isApiReady = true;
      return Promise.resolve();
    }

    this.scriptLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://sdk.scdn.co/spotify-player.js";
      script.async = true;

      script.onload = () => {
        this.isApiReady = true;
        resolve();
      };

      script.onerror = () => {
        this.scriptLoadPromise = null;
        reject(new Error("Failed to load Spotify SDK"));
      };

      (
        window as unknown as { onSpotifyWebPlaybackSDKReady: () => void }
      ).onSpotifyWebPlaybackSDKReady = () => {
        this.isApiReady = true;
        resolve();
      };

      document.body.appendChild(script);
    });

    return this.scriptLoadPromise;
  }

  private async refreshToken(): Promise<string> {
    try {
      const response = await fetch("/api/spotify/refresh");
      if (!response.ok) {
        // If refresh fails, redirect to login
        window.location.href = "/api/spotify/login?origin=/reamp";
        throw new Error("Failed to refresh token");
      }
      const data = await response.json();
      const newToken = data.access_token;
      localStorage.setItem("spotify_token", newToken);
      return newToken;
    } catch (error) {
      console.error("Error refreshing Spotify token:", error);
      // Redirect to login if refresh fails
      window.location.href = "/api/spotify/login?origin=/reamp";
      throw error;
    }
  }

  private async createSpotifyPlayer(playerId: string): Promise<SpotifyPlayer> {
    if (this.globalPlayerInitializing) {
      // Wait for existing initialization
      while (this.globalPlayerInitializing) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      return this.globalPlayerInstance!;
    }

    if (this.globalPlayerInstance) {
      return this.globalPlayerInstance;
    }

    this.globalPlayerInitializing = true;

    try {
      const playerOptions = {
        name: `ReAMP DJ Player ${playerId}`,
        getOAuthToken: async (cb: (token: string) => void) => {
          try {
            let currentToken = localStorage.getItem("spotify_token");
            if (!currentToken) {
              console.error("No Spotify token available");
              return;
            }

            // Try to refresh the token to ensure it's valid
            try {
              const response = await fetch("/api/spotify/refresh");
              if (response.ok) {
                const data = await response.json();
                currentToken = data.access_token;
                if (currentToken) {
                  localStorage.setItem("spotify_token", currentToken);
                }
              }
            } catch (refreshError) {
              console.error("Failed to refresh token:", refreshError);
              // Continue with current token if refresh fails
            }

            if (currentToken) {
              cb(currentToken);
            }
          } catch (error) {
            console.error("Error in getOAuthToken:", error);
          }
        },
      };

      const sdkWindow = window as Window & {
        Spotify: {
          Player: new (config: {
            name: string;
            getOAuthToken: (cb: (token: string) => void) => void;
          }) => SpotifyPlayer;
        };
      };
      if (!sdkWindow.Spotify?.Player) {
        throw new Error("Spotify SDK not loaded");
      }

      const player = new sdkWindow.Spotify.Player(playerOptions);

      // Add event listeners for state tracking
      player.addListener(
        "player_state_changed",
        (state: SpotifyPlaybackState) => {
          if (state) {
            const currentTime = state.position || 0;
            const duration = state.duration || 0;
            const isPlaying = !state.paused;

            // Update state for all active players
            for (const [pid] of this.players) {
              this.setPlayerState(pid, { currentTime, duration, isPlaying });
            }
          }
        }
      );

      player.addListener("ready", ((data: { device_id: string }) => {
        console.log("Spotify player ready:", data);
      }) as (...args: unknown[]) => void);

      player.addListener("not_ready", ((data: { device_id: string }) => {
        console.log("Spotify player not ready:", data);
      }) as (...args: unknown[]) => void);

      player.addListener(
        "authentication_error",
        async (data: { message: string }) => {
          console.error("Spotify authentication error:", data);
          try {
            // Try to refresh the token
            await this.refreshToken();
            // Reconnect the player with the new token
            await player.connect();
          } catch (error) {
            console.error("Failed to refresh token after auth error:", error);
            // Redirect to login if refresh fails
            window.location.href = "/api/spotify/login?origin=/reamp";
          }
        }
      );

      player.addListener(
        "initialization_error",
        (data: { message: string }) => {
          console.error("Spotify initialization error:", data);
        }
      );

      player.addListener("playback_error", (data: { message: string }) => {
        console.error("Spotify playback error:", data);
      });

      await player.connect();

      this.globalPlayerInstance = player;
      this.globalPlayerInitializing = false;

      return player;
    } catch (error) {
      this.globalPlayerInitializing = false;
      throw error;
    }
  }

  async createPlayer(playerId: string, trackId: string, token: string) {
    // Store token
    this.tokens.set(playerId, token);

    // Load Spotify SDK if not already loaded
    await this.loadSpotifySDK();

    // Check if we already have a global player instance
    if (!this.globalPlayerInstance) {
      // Create the first player
      const player = await this.createSpotifyPlayer(playerId);
      this.globalPlayerInstance = player;
      this.players.set(playerId, player);

      // Get the device ID from the player
      const deviceId = await this.getDeviceId(player);
      this.deviceIds.set(playerId, deviceId);

      // Play the track using the Web Playback SDK approach
      await this.playTrack(playerId, trackId);
    } else {
      // For subsequent players, use the existing global player
      // but store the track info for this player
      this.players.set(playerId, this.globalPlayerInstance);

      // Store the track info for this player
      this.trackInfo.set(playerId, { trackId, token });

      // Don't play immediately - let the user control it
      console.log(
        `Spotify player ${playerId} initialized with existing player`
      );
    }

    return this.deviceIds.get(playerId) || "shared-device";
  }

  private async getDeviceId(player: SpotifyPlayer): Promise<string> {
    return new Promise((resolve) => {
      const readyHandler = ((data: { device_id: string }) => {
        player.removeListener(
          "ready",
          readyHandler as (...args: unknown[]) => void
        );
        resolve(data.device_id);
      }) as (...args: unknown[]) => void;
      player.addListener("ready", readyHandler);

      // If player is already ready, get device ID immediately
      if (player._options && player._options.device_id) {
        resolve(player._options.device_id);
      }
    });
  }

  async playTrack(playerId: string, trackId: string): Promise<void> {
    // For secondary players, use the primary player's device and token
    let deviceId = this.deviceIds.get(playerId);
    let token = this.tokens.get(playerId);

    // If this player doesn't have device/token, use the first available one
    if (!deviceId || !token) {
      const firstPlayerId = Array.from(this.deviceIds.keys())[0];
      if (firstPlayerId) {
        deviceId = this.deviceIds.get(firstPlayerId);
        token = this.tokens.get(firstPlayerId);
      }
    }

    if (!deviceId || !token) {
      throw new Error("No device or token available");
    }

    try {
      // Check if there's already an active player
      const activePlayers = Array.from(this.players.keys());
      const isFirstPlayer = activePlayers.length === 1;

      if (isFirstPlayer) {
        // First player - transfer playback and start
        await fetch(`https://api.spotify.com/v1/me/player`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            device_ids: [deviceId],
            play: false,
          }),
        });

        // Wait a moment for the device to be ready
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // For secondary players, we need to pause the current track first
      if (!isFirstPlayer) {
        console.log(`Pausing current track to play ${trackId} on ${playerId}`);
        // Pause the current playback
        await fetch(
          `https://api.spotify.com/v1/me/player/pause?device_id=${deviceId}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        // Wait a moment
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      // Then try to play the track
      const response = await fetch(
        `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            uris: [`spotify:track:${trackId}`],
            position_ms: 0,
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, try to refresh
          console.log("Token expired during play, attempting refresh...");
          const newToken = await this.refreshToken();
          this.tokens.set(playerId, newToken);
          // Retry with new token
          await this.playTrack(playerId, trackId);
          return;
        }
        const errorText = await response.text();
        console.error("Spotify play error:", errorText);
        throw new Error(`Failed to play track: ${response.status}`);
      }

      // Ensure playback starts using the Web Playback SDK
      const player = this.players.get(playerId);
      if (player) {
        await player.resume();

        // Initialize state tracking with default values
        this.setPlayerState(playerId, {
          currentTime: 0,
          duration: 0,
          isPlaying: true,
        });
      }
    } catch (error) {
      console.error("Error playing track:", error);
      throw error;
    }
  }

  async pausePlayer(playerId: string): Promise<void> {
    const player = this.players.get(playerId);
    if (player) {
      try {
        await player.pause();
      } catch (error) {
        console.error("Error pausing:", error);
      }
    }
  }

  async resumePlayer(playerId: string): Promise<void> {
    const player = this.players.get(playerId);
    if (player) {
      try {
        await player.resume();
      } catch (error) {
        console.error("Error resuming:", error);
      }
    }
  }

  async setVolume(playerId: string, volume: number): Promise<void> {
    const player = this.players.get(playerId);
    if (player && typeof player.setVolume === "function") {
      try {
        await player.setVolume(volume / 100);
      } catch (error) {
        console.error("Error setting volume:", error);
      }
    }
  }

  playerStates: Map<
    string,
    { currentTime: number; duration: number; isPlaying: boolean }
  > = new Map();

  getPlayerState(playerId: string): number {
    const state = this.playerStates.get(playerId);
    return state?.isPlaying ? 1 : 0;
  }

  getCurrentTime(playerId: string): number {
    const state = this.playerStates.get(playerId);
    return state?.currentTime || 0;
  }

  getDuration(playerId: string): number {
    const state = this.playerStates.get(playerId);
    return state?.duration || 0;
  }

  async updatePlayerState(playerId: string): Promise<void> {
    const player = this.players.get(playerId);
    if (player && typeof player.getCurrentState === "function") {
      try {
        const state = await player.getCurrentState();
        if (state) {
          this.setPlayerState(playerId, {
            currentTime: state.position || 0,
            duration: state.duration || 0,
            isPlaying: !state.paused,
          });
        }
      } catch (error) {
        console.error("Error updating Spotify player state:", error);
      }
    }
  }

  setPlayerState(
    playerId: string,
    state: { currentTime: number; duration: number; isPlaying: boolean }
  ) {
    this.playerStates.set(playerId, state);
  }

  getPlayer(playerId: string): SpotifyPlayer | undefined {
    return this.players.get(playerId);
  }

  destroyPlayer(playerId: string) {
    const player = this.players.get(playerId);
    if (player) {
      player.disconnect();
    }
    this.players.delete(playerId);
    this.tokens.delete(playerId);
    this.deviceIds.delete(playerId);
  }

  destroyAll() {
    for (const playerId of this.players.keys()) {
      this.destroyPlayer(playerId);
    }
    if (this.globalPlayerInstance) {
      this.globalPlayerInstance.disconnect();
      this.globalPlayerInstance = null;
    }
  }
}

// Global player managers
const youtubeManager = new YouTubePlayerManager();
const spotifyManager = new SpotifyPlayerManager();

const VinylPlayer = ({
  playerId,
  playerState,
  onPlay,
  onPause,
  onStop,
  onVolumeChange,
  onMuteToggle,
  onScratch,
  onSeek,
}: {
  playerId: "A" | "B";
  playerState: DJPlayerState;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onVolumeChange: (volume: number) => void;
  onMuteToggle: () => void;
  onScratch: (direction: "forward" | "backward") => void;
  onSeek: (position: number) => void;
}) => {
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
        <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
          <span className="text-gray-400 text-xs">No Track</span>
        </div>
      );
    }

    // Check if it's a Spotify song by checking for the type property
    if ("type" in song && song.type === ServiceType.Spotify) {
      const spotifySong = song as Song;
      return (
        <img
          src={spotifySong.artwork.medium.url}
          alt={spotifySong.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = "/vinylDisk.png";
          }}
        />
      );
    } else {
      const youtubeSong = song as YoutubeVideo;
      return (
        <img
          src={youtubeSong.snippet.thumbnails.medium.url}
          alt={youtubeSong.snippet.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = "/vinylDisk.png";
          }}
        />
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
              <div className="w-full h-full flex items-center justify-center rounded-full overflow-hidden">
                {renderAlbumArt(playerState.song)}
              </div>
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
};

export default function DJSetPlayer({ className = "" }: DJSetPlayerProps) {
  const { youtube, spotify, unified } = useUnifiedContext();
  const [players, setPlayers] = useState<{
    A: DJPlayerState;
    B: DJPlayerState;
  }>({
    A: {
      service: null,
      song: null,
      isPlaying: false,
      volume: 50,
      isMuted: false,
      crossfade: 0,
      currentTime: 0,
      duration: 0,
      isActive: false,
      playerId: "A",
    },
    B: {
      service: null,
      song: null,
      isPlaying: false,
      volume: 50,
      isMuted: false,
      crossfade: 0,
      currentTime: 0,
      duration: 0,
      isActive: false,
      playerId: "B",
    },
  });

  // Get the currently playing YouTube videos
  const getCurrentYouTubeVideos = () => {
    const videos: { playerId: "A" | "B"; video: YoutubeVideo }[] = [];

    if (
      players.A.isActive &&
      players.A.service === ServiceType.Youtube &&
      players.A.isPlaying
    ) {
      videos.push({ playerId: "A", video: players.A.song as YoutubeVideo });
    }
    if (
      players.B.isActive &&
      players.B.service === ServiceType.Youtube &&
      players.B.isPlaying
    ) {
      videos.push({ playerId: "B", video: players.B.song as YoutubeVideo });
    }
    return videos;
  };

  const [crossfade, setCrossfade] = useState(0);
  const progressIntervals = useRef<{
    A: NodeJS.Timeout | null;
    B: NodeJS.Timeout | null;
  }>({
    A: null,
    B: null,
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      youtubeManager.destroyAll();
      spotifyManager.destroyAll();
      if (progressIntervals.current.A)
        clearInterval(progressIntervals.current.A);
      if (progressIntervals.current.B)
        clearInterval(progressIntervals.current.B);
    };
  }, []);

  const initializePlayer = async (
    playerId: "A" | "B",
    song: Song | YoutubeVideo,
    service: ServiceType
  ) => {
    try {
      if (service === ServiceType.Youtube) {
        const youtubeSong = song as YoutubeVideo;
        const container = document.createElement("div");
        container.style.position = "absolute";
        container.style.left = "-9999px";
        container.style.top = "-9999px";
        container.style.width = "1px";
        container.style.height = "1px";
        document.body.appendChild(container);

        await youtubeManager.createPlayer(
          playerId,
          youtubeSong.id.videoId,
          container
        );
      } else {
        const spotifySong = song as Song;
        const token = localStorage.getItem("spotify_token");
        if (!token) {
          throw new Error("No Spotify token available");
        }
        await spotifyManager.createPlayer(playerId, spotifySong.id, token);
      }

      setPlayers((prev) => ({
        ...prev,
        [playerId]: {
          ...prev[playerId],
          service,
          song,
          isActive: true,
          currentTime: 0,
          duration: 0,
        },
      }));

      // Start progress tracking
      startProgressTracking(playerId);

      // Get initial duration after a short delay to ensure player is ready
      setTimeout(async () => {
        if (service === ServiceType.Youtube) {
          try {
            const duration = youtubeManager.getDuration(playerId) * 1000; // Convert to ms
            if (duration > 0) {
              setPlayers((prev) => ({
                ...prev,
                [playerId]: {
                  ...prev[playerId],
                  duration,
                },
              }));
            }
          } catch (error) {
            console.error(
              `Error getting YouTube duration for ${playerId}:`,
              error
            );
          }
        } else {
          try {
            const player = spotifyManager.getPlayer(playerId);
            if (player && typeof player.getCurrentState === "function") {
              const state = await player.getCurrentState();
              if (state && state.duration > 0) {
                setPlayers((prev) => ({
                  ...prev,
                  [playerId]: {
                    ...prev[playerId],
                    duration: state.duration,
                  },
                }));
              }
            }
          } catch (error) {
            console.error(
              `Error getting Spotify duration for ${playerId}:`,
              error
            );
          }
        }
      }, 1000);
    } catch (error) {
      console.error(`Error initializing ${playerId} player:`, error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      // Provide more helpful error messages for common issues
      if (errorMessage.includes("No devices available")) {
        alert(
          `Spotify player ${playerId}: Please open Spotify on any device and start playing a song, then try again. The app will wait for a device to become available.`
        );
      } else {
        alert(`Failed to initialize ${playerId} player: ${errorMessage}`);
      }
    }
  };

  const handleSeek = async (playerId: "A" | "B", position: number) => {
    const playerState = players[playerId];
    if (!playerState.isActive || !playerState.song) return;

    if (playerState.service === ServiceType.Youtube) {
      youtubeManager.seekPlayer(playerId, position / 1000); // Convert to seconds for YouTube API
    } else {
      // For Spotify, use the Web Playback SDK
      const player = spotifyManager.getPlayer(playerId);
      if (player && typeof player.seek === "function") {
        await player.seek(position); // Already in milliseconds for Spotify
      }
    }

    // Update the progress immediately
    setPlayers((prev) => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        currentTime: position,
      },
    }));

    // Also update the internal state for Spotify
    if (playerState.service === ServiceType.Spotify) {
      spotifyManager.setPlayerState(playerId, {
        currentTime: position,
        duration: playerState.duration,
        isPlaying: playerState.isPlaying,
      });
    }
  };

  const startProgressTracking = (playerId: "A" | "B") => {
    // Clear existing interval
    if (progressIntervals.current[playerId]) {
      clearInterval(progressIntervals.current[playerId]);
    }

    // Start new interval - use 50ms for very responsive updates
    progressIntervals.current[playerId] = setInterval(async () => {
      const playerState = players[playerId];
      if (!playerState.isActive || !playerState.song) return;

      if (playerState.service === ServiceType.Youtube) {
        try {
          const currentTime = youtubeManager.getCurrentTime(playerId) * 1000; // Convert to ms
          const duration = youtubeManager.getDuration(playerId) * 1000; // Convert to ms
          const playerStateNum = youtubeManager.getPlayerState(playerId);

          // Only update if we have valid values and time has changed
          if (currentTime >= 0 && currentTime !== playerState.currentTime) {
            setPlayers((prev) => ({
              ...prev,
              [playerId]: {
                ...prev[playerId],
                currentTime,
                duration: duration > 0 ? duration : prev[playerId].duration,
                isPlaying: playerStateNum === 1,
              },
            }));
          }
        } catch (error) {
          console.error(
            `Error tracking YouTube progress for ${playerId}:`,
            error
          );
        }
      } else {
        // For Spotify, use the same approach as working SpotifyPlayer
        try {
          const player = spotifyManager.getPlayer(playerId);
          if (player && typeof player.getCurrentState === "function") {
            const state = await player.getCurrentState();
            if (state) {
              const newCurrentTime = state.position || 0;
              const newDuration = state.duration || 0;
              const newIsPlaying = !state.paused;

              // Only update if values have changed
              if (
                newCurrentTime !== playerState.currentTime ||
                newDuration !== playerState.duration ||
                newIsPlaying !== playerState.isPlaying
              ) {
                setPlayers((prev) => ({
                  ...prev,
                  [playerId]: {
                    ...prev[playerId],
                    currentTime: newCurrentTime,
                    duration: newDuration,
                    isPlaying: newIsPlaying,
                  },
                }));
              }
            } else {
              // Fallback to internal state tracking
              const internalState = spotifyManager.playerStates.get(playerId);
              if (internalState) {
                const newCurrentTime = internalState.currentTime;
                const newDuration = internalState.duration;
                const newIsPlaying = internalState.isPlaying;

                // Only update if values have changed
                if (
                  newCurrentTime !== playerState.currentTime ||
                  newDuration !== playerState.duration ||
                  newIsPlaying !== playerState.isPlaying
                ) {
                  setPlayers((prev) => ({
                    ...prev,
                    [playerId]: {
                      ...prev[playerId],
                      currentTime: newCurrentTime,
                      duration: newDuration,
                      isPlaying: newIsPlaying,
                    },
                  }));
                }
              }
            }
          } else {
            // Fallback to internal state tracking
            const internalState = spotifyManager.playerStates.get(playerId);
            if (internalState) {
              const newCurrentTime = internalState.currentTime;
              const newDuration = internalState.duration;
              const newIsPlaying = internalState.isPlaying;

              // Only update if values have changed
              if (
                newCurrentTime !== playerState.currentTime ||
                newDuration !== playerState.duration ||
                newIsPlaying !== playerState.isPlaying
              ) {
                setPlayers((prev) => ({
                  ...prev,
                  [playerId]: {
                    ...prev[playerId],
                    currentTime: newCurrentTime,
                    duration: newDuration,
                    isPlaying: newIsPlaying,
                  },
                }));
              }
            }
          }
        } catch (error) {
          console.error(
            `Error tracking Spotify progress for ${playerId}:`,
            error
          );
          // Fallback to internal state tracking
          const internalState = spotifyManager.playerStates.get(playerId);
          if (internalState) {
            const newCurrentTime = internalState.currentTime;
            const newDuration = internalState.duration;
            const newIsPlaying = internalState.isPlaying;

            // Only update if values have changed
            if (
              newCurrentTime !== playerState.currentTime ||
              newDuration !== playerState.duration ||
              newIsPlaying !== playerState.isPlaying
            ) {
              setPlayers((prev) => ({
                ...prev,
                [playerId]: {
                  ...prev[playerId],
                  currentTime: newCurrentTime,
                  duration: newDuration,
                  isPlaying: newIsPlaying,
                },
              }));
            }
          }
        }
      }
    }, 50); // Use 50ms for very responsive updates
  };

  const handlePlay = async (playerId: "A" | "B") => {
    const playerState = players[playerId];
    if (!playerState.isActive || !playerState.song) return;

    if (playerState.service === ServiceType.Youtube) {
      youtubeManager.playPlayer(playerId);
    } else {
      // For Spotify, check if this is a secondary player
      const trackInfo = spotifyManager.trackInfo.get(playerId);
      if (trackInfo) {
        // This is a secondary player, need to load the track first
        await spotifyManager.playTrack(playerId, trackInfo.trackId);
      } else {
        // Primary player, just resume
        await spotifyManager.resumePlayer(playerId);
      }
    }

    setPlayers((prev) => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        isPlaying: true,
      },
    }));
  };

  const handlePause = async (playerId: "A" | "B") => {
    const playerState = players[playerId];
    if (!playerState.isActive || !playerState.song) return;

    if (playerState.service === ServiceType.Youtube) {
      youtubeManager.pausePlayer(playerId);
    } else {
      await spotifyManager.pausePlayer(playerId);
    }

    setPlayers((prev) => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        isPlaying: false,
      },
    }));
  };

  const handleStop = async (playerId: "A" | "B") => {
    const playerState = players[playerId];
    if (!playerState.isActive || !playerState.song) return;

    if (playerState.service === ServiceType.Youtube) {
      youtubeManager.stopPlayer(playerId);
    } else {
      await spotifyManager.pausePlayer(playerId);
    }

    setPlayers((prev) => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        isPlaying: false,
        currentTime: 0,
      },
    }));
  };

  const handleVolumeChange = (playerId: "A" | "B", volume: number) => {
    const playerState = players[playerId];
    if (!playerState.isActive || !playerState.song) return;

    if (playerState.service === ServiceType.Youtube) {
      youtubeManager.setVolume(playerId, volume);
    } else {
      spotifyManager.setVolume(playerId, volume);
    }

    setPlayers((prev) => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        volume,
      },
    }));
  };

  const handleMuteToggle = (playerId: "A" | "B") => {
    const playerState = players[playerId];
    if (!playerState.isActive || !playerState.song) return;

    const newMuted = !playerState.isMuted;
    const targetVolume = newMuted ? 0 : playerState.volume;

    if (playerState.service === ServiceType.Youtube) {
      youtubeManager.setVolume(playerId, targetVolume);
    } else {
      spotifyManager.setVolume(playerId, targetVolume);
    }

    setPlayers((prev) => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        isMuted: newMuted,
      },
    }));
  };

  const handleScratch = (
    playerId: "A" | "B",
    direction: "forward" | "backward"
  ) => {
    const playerState = players[playerId];
    if (!playerState.isActive || !playerState.song) return;

    if (playerState.service === ServiceType.Youtube) {
      const currentTime = youtubeManager.getCurrentTime(playerId) * 1000; // Convert to ms
      const newTime =
        direction === "forward"
          ? Math.min(currentTime + 5000, playerState.duration) // 5 seconds in ms
          : Math.max(currentTime - 5000, 0);
      youtubeManager.seekPlayer(playerId, newTime / 1000); // Convert back to seconds for YouTube API

      // Update the progress immediately
      setPlayers((prev) => ({
        ...prev,
        [playerId]: {
          ...prev[playerId],
          currentTime: newTime,
        },
      }));
    } else {
      // For Spotify, use the Web Playback SDK to seek
      const currentTime = spotifyManager.getCurrentTime(playerId);
      const newTime =
        direction === "forward"
          ? Math.min(currentTime + 5000, playerState.duration) // 5 seconds in ms
          : Math.max(currentTime - 5000, 0);

      // Only seek if we have a valid duration and the new time is within bounds
      if (
        playerState.duration > 0 &&
        newTime >= 0 &&
        newTime <= playerState.duration
      ) {
        const player = spotifyManager.getPlayer(playerId);
        if (player && typeof player.seek === "function") {
          player.seek(newTime);
        }
      }

      // Update the progress immediately
      setPlayers((prev) => ({
        ...prev,
        [playerId]: {
          ...prev[playerId],
          currentTime: newTime,
        },
      }));
    }
  };

  const handleCrossfade = async () => {
    // Implement crossfade logic here
    console.log("Crossfade triggered");
  };

  // Handle drops from search results
  useEffect(() => {
    const handleDJPlayerDrop = (event: CustomEvent) => {
      const { playerId, service, id } = event.detail;
      if (playerId === "A" || playerId === "B") {
        // Find the actual song/video object based on the service and id
        let song: Song | YoutubeVideo | null = null;

        if (service === ServiceType.Youtube) {
          // Look in search results first, then in playlist
          song =
            youtube.searchResults.find((v) => v.id.videoId === id) ||
            (unified.playlist.find(
              (item) => item.id === id && item.type === ServiceType.Youtube
            )?.data as YoutubeVideo);
        } else if (service === ServiceType.Spotify) {
          // Look in search results first, then in playlist
          song =
            spotify.searchResults.find((s) => s.id === id) ||
            (unified.playlist.find(
              (item) => item.id === id && item.type === ServiceType.Spotify
            )?.data as Song);
        }

        if (song) {
          console.log(`Initializing ${playerId} player with:`, {
            song,
            service,
          });

          if (service === ServiceType.Spotify) {
            console.log(
              `Attempting to initialize Spotify player ${playerId}...`
            );
          }

          initializePlayer(playerId, song, service);
        } else {
          console.error(`Could not find ${service} item with id: ${id}`);
          alert(`Could not find ${service} item. Please try searching again.`);
        }
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
  }, [youtube.searchResults, spotify.searchResults, unified.playlist]);

  const renderPlayerDropZone = (
    playerId: "A" | "B",
    playerState: DJPlayerState
  ) => {
    return (
      <Droppable droppableId={`dj-player-${playerId}`}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`w-full h-full rounded-lg border-2 border-dashed transition-all duration-200 ${
              snapshot.isDraggingOver
                ? "border-red-400 bg-red-400/10"
                : "border-gray-600 bg-black/20"
            }`}
            onDrop={(e) => {
              e.preventDefault();
              const songData = e.dataTransfer.getData("application/json");
              if (songData) {
                try {
                  const { song, service } = JSON.parse(songData);
                  initializePlayer(playerId, song, service);
                } catch (error) {
                  console.error("Error parsing dropped song:", error);
                }
              }
            }}
            onDragOver={(e) => e.preventDefault()}
          >
            {playerState.isActive ? (
              <VinylPlayer
                playerId={playerId}
                playerState={playerState}
                onPlay={() => handlePlay(playerId)}
                onPause={() => handlePause(playerId)}
                onStop={() => handleStop(playerId)}
                onVolumeChange={(volume) =>
                  handleVolumeChange(playerId, volume)
                }
                onMuteToggle={() => handleMuteToggle(playerId)}
                onScratch={(direction) => handleScratch(playerId, direction)}
                onSeek={(position) => handleSeek(playerId, position)}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <div className="text-lg font-mono mb-2">DECK {playerId}</div>
                  <div className="text-sm">Drop a track here</div>
                </div>
              </div>
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    );
  };

  return (
    <div
      className={`w-full h-full bg-black/20 rounded-lg p-6 flex flex-col ${className}`}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-6 flex-shrink-0">
        <h2 className="text-2xl font-bold text-white font-mono">
          DJ SET PLAYER
        </h2>
        <div className="flex items-center gap-4">
          <button
            onClick={handleCrossfade}
            className="px-4 py-2 bg-gradient-to-r from-red-400 to-red-600 rounded-lg text-white font-mono text-sm hover:shadow-[0_0_20px_rgba(255,107,107,0.6)] transition-all duration-200"
          >
            <FaExchangeAlt className="inline mr-2" />
            CROSSFADE
          </button>
        </div>
      </div>

      {/* YouTube Video Display */}
      {(() => {
        const currentVideos = getCurrentYouTubeVideos();
        if (currentVideos.length > 0) {
          return (
            <div className="mb-4 flex-shrink-0">
              {currentVideos.length === 1 ? (
                // Single video - full width layout
                <div className="w-full">
                  {currentVideos.map(({ playerId, video }) => (
                    <div key={playerId} className="w-full">
                      <div className="relative w-full max-h-64 aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
                        <iframe
                          src={`https://www.youtube.com/embed/${video.id.videoId}?autoplay=1&controls=0&modestbranding=1&rel=0&showinfo=0&loop=1&playlist=${video.id.videoId}&mute=1&enablejsapi=1`}
                          title={video.snippet.title}
                          className="w-full h-full pointer-events-none"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                        <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                          DECK {playerId}
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                          <h3 className="text-white font-semibold text-xs truncate">
                            {video.snippet.title}
                          </h3>
                          <p className="text-gray-300 text-xs truncate">
                            {video.snippet.channelTitle}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Multiple videos - grid layout
                <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                  {currentVideos.map(({ playerId, video }) => (
                    <div key={playerId} className="flex justify-center">
                      <div className="relative w-full max-w-xl max-h-48 aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
                        <iframe
                          src={`https://www.youtube.com/embed/${video.id.videoId}?autoplay=1&controls=0&modestbranding=1&rel=0&showinfo=0&loop=1&playlist=${video.id.videoId}&mute=1&enablejsapi=1`}
                          title={video.snippet.title}
                          className="w-full h-full pointer-events-none"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                        <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                          DECK {playerId}
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                          <h3 className="text-white font-semibold text-xs truncate">
                            {video.snippet.title}
                          </h3>
                          <p className="text-gray-300 text-xs truncate">
                            {video.snippet.channelTitle}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        }
        return null;
      })()}

      {/* Main DJ Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 min-h-0">
        {/* Player A */}
        <div className="bg-black/30 rounded-lg p-6 border border-gray-700 flex flex-col min-h-0">
          <div className="text-center mb-4 flex-shrink-0">
            <h3 className="text-xl font-bold text-red-400 font-mono">DECK A</h3>
          </div>
          <div className="flex-1 min-h-0">
            {renderPlayerDropZone("A", players.A)}
          </div>
        </div>

        {/* Player B */}
        <div className="bg-black/30 rounded-lg p-6 border border-gray-700 flex flex-col min-h-0">
          <div className="text-center mb-4 flex-shrink-0">
            <h3 className="text-xl font-bold text-red-400 font-mono">DECK B</h3>
          </div>
          <div className="flex-1 min-h-0">
            {renderPlayerDropZone("B", players.B)}
          </div>
        </div>
      </div>

      {/* Crossfade Slider */}
      <div className="mt-6 flex-shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-white font-mono text-sm">CROSSFADE</span>
          <div className="flex-1 h-2 bg-gray-700 rounded-full">
            <input
              type="range"
              min="0"
              max="100"
              value={crossfade}
              onChange={(e) => setCrossfade(Number(e.target.value))}
              className="w-full h-full opacity-0 cursor-pointer"
            />
            <div
              className="h-full bg-gradient-to-r from-red-400 to-red-600 rounded-full transition-all duration-100"
              style={{ width: `${crossfade}%` }}
            />
          </div>
          <span className="text-white font-mono text-sm">{crossfade}%</span>
        </div>
      </div>
    </div>
  );
}
