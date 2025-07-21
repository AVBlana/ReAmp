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
  playerStates: Map<
    string,
    { currentTime: number; duration: number; isPlaying: boolean }
  > = new Map();

  async createPlayer(
    playerId: string,
    videoId: string,
    container: HTMLDivElement
  ) {
    console.log(`🎯 YouTubeManager.createPlayer called for ${playerId}:`, {
      videoId,
      containerExists: !!container,
      apiReady: this.isApiReady,
      windowYT: !!window.YT,
      windowYTPlayer: !!(window.YT && window.YT.Player),
    });

    // Clean up existing player if any
    this.destroyPlayer(playerId);

    // Store container reference
    this.containers.set(playerId, container);

    // Load YouTube API if not already loaded
    if (!this.isApiReady) {
      console.log(`📡 Loading YouTube API for ${playerId}...`);
      await this.loadYouTubeAPI();
    }

    // Double-check that the API is ready
    if (!window.YT || !window.YT.Player) {
      console.error(`❌ YouTube API not loaded properly for ${playerId}`);
      throw new Error("YouTube API not loaded properly");
    }

    console.log(`✅ YouTube API ready for ${playerId}, creating player...`);

    return new Promise((resolve, reject) => {
      try {
        // Add timeout to prevent hanging
        const timeout = setTimeout(() => {
          reject(new Error(`YouTube player ${playerId} creation timed out`));
        }, 10000); // 10 second timeout

        const player = new (window.YT.Player as unknown as new (
          ...args: unknown[]
        ) => YTPlayer)(container, {
          videoId: videoId,
          playerVars: {
            autoplay: 0, // Ensure no autoplay
            modestbranding: 1,
            rel: 0,
            enablejsapi: 1,
            playsinline: 1,
            controls: 0, // Hide controls for DJ interface
          },
          events: {
            onReady: () => {
              clearTimeout(timeout);
              this.players.set(playerId, player as unknown as YTPlayer);
              console.log(
                `🎉 YouTube player ${playerId} initialized with video ${videoId} (not auto-playing)`
              );
              resolve(player);
            },
            onError: (error: unknown) => {
              clearTimeout(timeout);
              console.error(`💥 YouTube player ${playerId} error:`, error);
              reject(
                new Error(
                  `YouTube player error: ${
                    (error as { data?: string })?.data || "Unknown error"
                  }`
                )
              );
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
    console.log(`YouTube playPlayer called for ${playerId}:`, {
      player: !!player,
      hasPlayVideo: player && typeof player.playVideo === "function",
    });
    if (player && typeof player.playVideo === "function") {
      try {
        player.playVideo();
        console.log(`YouTube playVideo called for ${playerId}`);
      } catch (error) {
        console.error(`Error calling playVideo for ${playerId}:`, error);
      }
    } else {
      console.error(`YouTube player ${playerId} not found or not ready`);
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
    console.log(`YouTube seekPlayer called for ${playerId}:`, {
      player: !!player,
      hasSeekTo: player && typeof player.seekTo === "function",
      seconds,
    });
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

  setPlayerState(
    playerId: string,
    state: { currentTime: number; duration: number; isPlaying: boolean }
  ) {
    this.playerStates.set(playerId, state);
  }

  getPlayerState(playerId: string): number {
    const player = this.players.get(playerId);
    if (player && typeof player.getPlayerState === "function") {
      const state = player.getPlayerState();
      // Update internal state tracking for consistency
      const currentState = this.playerStates.get(playerId);
      if (currentState) {
        this.setPlayerState(playerId, {
          ...currentState,
          isPlaying: state === 1,
        });
      }
      return state;
    }
    return -1;
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

  getContainer(playerId: string): HTMLDivElement | undefined {
    return this.containers.get(playerId);
  }

  getPlayer(playerId: string): YTPlayer | undefined {
    return this.players.get(playerId);
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
  eventListeners: Map<string, (...args: unknown[]) => void> = new Map();
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

      player.addListener(
        "playback_error",
        async (data: { message: string }) => {
          console.error("Spotify playback error:", {
            data,
            message: data?.message || "Unknown error",
            timestamp: new Date().toISOString(),
            playerId: "global",
          });

          // Try to get more context about the error
          try {
            const currentState = await player.getCurrentState();
            console.error("Spotify error context:", {
              currentState,
              deviceId: (player as SpotifyPlayer)._options?.device_id,
            });
          } catch (contextError) {
            console.error("Could not get error context:", contextError);
          }
        }
      );

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

      // Store the track info for this player but DON'T play automatically
      this.trackInfo.set(playerId, { trackId, token });
      console.log(
        `Spotify player ${playerId} initialized with track ${trackId} (not auto-playing)`
      );
    } else {
      // For subsequent players, use the existing global player
      // but store the track info for this player
      this.players.set(playerId, this.globalPlayerInstance);

      // Store the track info for this player
      this.trackInfo.set(playerId, { trackId, token });

      // Don't play immediately - let the user control it
      console.log(
        `Spotify player ${playerId} initialized with existing player (not auto-playing)`
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

      // Get the current position from the player state
      const currentState = this.playerStates.get(playerId);
      const startPosition = currentState ? currentState.currentTime : 0;

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
            position_ms: startPosition,
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

        // Initialize state tracking with current values
        this.setPlayerState(playerId, {
          currentTime: startPosition,
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
        // Update the internal state to reflect that we're playing
        const currentState = this.playerStates.get(playerId);
        if (currentState) {
          this.setPlayerState(playerId, {
            ...currentState,
            isPlaying: true,
          });
        }
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
    // Clean up event listeners
    for (const [playerId, listener] of this.eventListeners) {
      const player = this.players.get(playerId);
      if (player) {
        player.removeListener("player_state_changed", listener);
      }
    }
    this.eventListeners.clear();

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
      players.A.song
    ) {
      videos.push({ playerId: "A", video: players.A.song as YoutubeVideo });
    }
    if (
      players.B.isActive &&
      players.B.service === ServiceType.Youtube &&
      players.B.song
    ) {
      videos.push({ playerId: "B", video: players.B.song as YoutubeVideo });
    }

    return videos;
  };

  const [crossfade, setCrossfade] = useState(0);
  const [isCrossfadeEnabled, setIsCrossfadeEnabled] = useState(false);
  const [crossfadeInProgress, setCrossfadeInProgress] = useState(false);
  const progressIntervals = useRef<{
    A: { timeout: NodeJS.Timeout | null; lastCheckTime: number };
    B: { timeout: NodeJS.Timeout | null; lastCheckTime: number };
  }>({
    A: { timeout: null, lastCheckTime: 0 },
    B: { timeout: null, lastCheckTime: 0 },
  });

  // Track which players have already triggered crossfade to prevent re-triggering
  const crossfadeTriggered = useRef<{
    A: boolean;
    B: boolean;
  }>({
    A: false,
    B: false,
  });

  // Global crossfade lock to prevent any crossfade from starting while one is in progress
  const globalCrossfadeLock = useRef(false);

  // Track intended volumes for each player (the volume the user wants, not the current volume)
  const intendedVolumes = useRef<{
    A: number;
    B: number;
  }>({
    A: 50,
    B: 50,
  });

  // Use ref to track current players state in intervals
  const playersRef = useRef(players);
  playersRef.current = players;

  // Use ref to track current crossfade state in intervals
  const crossfadeRef = useRef(crossfade);
  crossfadeRef.current = crossfade;

  const isCrossfadeEnabledRef = useRef(isCrossfadeEnabled);
  isCrossfadeEnabledRef.current = isCrossfadeEnabled;

  const crossfadeInProgressRef = useRef(crossfadeInProgress);
  crossfadeInProgressRef.current = crossfadeInProgress;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      youtubeManager.destroyAll();
      spotifyManager.destroyAll();
      if (progressIntervals.current.A.timeout)
        clearInterval(progressIntervals.current.A.timeout);
      if (progressIntervals.current.B.timeout)
        clearInterval(progressIntervals.current.B.timeout);
    };
  }, []);

  // Cleanup progress tracking when player becomes inactive
  useEffect(() => {
    if (!players.A.isActive && progressIntervals.current.A.timeout) {
      clearInterval(progressIntervals.current.A.timeout);
      progressIntervals.current.A = { timeout: null, lastCheckTime: 0 };
    }
    if (!players.B.isActive && progressIntervals.current.B.timeout) {
      clearInterval(progressIntervals.current.B.timeout);
      progressIntervals.current.B = { timeout: null, lastCheckTime: 0 };
    }
  }, [players.A.isActive, players.B.isActive]);

  // Move YouTube players to visible containers when they become available
  // Disabled for now since we're creating players in visible containers from the start
  /*
  useEffect(() => {
    const currentVideos = getCurrentYouTubeVideos();
    if (currentVideos.length > 0) {
      // Use a timeout to ensure the DOM containers are rendered
      const timeoutId = setTimeout(() => {
        moveYouTubePlayersToVisibleContainers();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [players.A.song, players.B.song, players.A.isActive, players.B.isActive]);
  */

  // Handle track ending when crossfade is disabled
  useEffect(() => {
    const checkTrackEnding = () => {
      ["A", "B"].forEach((playerId) => {
        const player = playersRef.current[playerId as "A" | "B"];
        if (player.isActive && player.isPlaying && player.duration > 0) {
          const timeRemaining = player.duration - player.currentTime;

          // If track is within 1 second of ending and crossfade is disabled
          if (
            timeRemaining <= 1000 &&
            !isCrossfadeEnabledRef.current &&
            !crossfadeInProgressRef.current
          ) {
            console.log(
              `🎵 Track ending on ${playerId}, stopping player (${Math.round(
                timeRemaining / 1000
              )}s remaining)`
            );
            handleStop(playerId as "A" | "B");
          }
        }
      });
    };

    const interval = setInterval(checkTrackEnding, 500);
    return () => clearInterval(interval);
  }, []);

  // Add refs for YouTube player containers
  const playerAContainerRef = useRef<HTMLDivElement>(null);
  const playerBContainerRef = useRef<HTMLDivElement>(null);

  // Update initializePlayer to accept a container for YouTube
  const initializePlayer = async (
    playerId: "A" | "B",
    song: Song | YoutubeVideo,
    service: ServiceType,
    containerOverride?: HTMLDivElement
  ) => {
    console.log(`🚀 Starting initializePlayer for ${playerId}:`, {
      service,
      songTitle:
        service === ServiceType.Youtube
          ? (song as YoutubeVideo).snippet.title
          : (song as Song).title,
    });

    try {
      if (service === ServiceType.Youtube) {
        const youtubeSong = song as YoutubeVideo;
        // Use the provided container (from ref) or try to get by ID
        let container = containerOverride;
        if (!container) {
          container = document.getElementById(
            `youtube-player-${playerId}`
          ) as HTMLDivElement;
        }
        if (!container) {
          console.error(
            `❌ YouTube player container for ${playerId} not found!`
          );
          return;
        }
        console.log(
          `🎬 Creating YouTube player ${playerId} with video ${youtubeSong.id.videoId}`
        );
        await youtubeManager.createPlayer(
          playerId,
          youtubeSong.id.videoId,
          container
        );
        console.log(`✅ YouTube player ${playerId} created successfully`);
      } else {
        const spotifySong = song as Song;
        const token = localStorage.getItem("spotify_token");
        if (!token) {
          throw new Error("No Spotify token available");
        }
        await spotifyManager.createPlayer(playerId, spotifySong.id, token);
      }

      // Get duration from track data for Spotify, or set to 0 for YouTube (will be updated later)
      let initialDuration = 0;

      if (service === ServiceType.Spotify) {
        if ("duration" in song && song.duration) {
          initialDuration = song.duration;
        } else {
          // Try to get duration from Spotify API directly
          try {
            const token = localStorage.getItem("spotify_token");
            if (token) {
              const response = await fetch(
                `https://api.spotify.com/v1/tracks/${song.id}`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );
              if (response.ok) {
                const trackData = await response.json();
                initialDuration = trackData.duration_ms;
                console.log(
                  `Fetched duration for Spotify track ${song.id}: ${initialDuration}ms`
                );
              }
            }
          } catch (error) {
            console.error("Error fetching Spotify track duration:", error);
          }
        }
      }

      console.log(`Initializing player ${playerId}:`, {
        service,
        hasDuration: "duration" in song,
        duration: "duration" in song ? song.duration : "not found",
        initialDuration,
        finalDuration: initialDuration,
      });

      setPlayers((prev) => ({
        ...prev,
        [playerId]: {
          ...prev[playerId],
          service,
          song,
          isActive: true,
          currentTime: 0,
          duration: initialDuration,
        },
      }));

      // Reset crossfade trigger flag for this player when loading a new track
      crossfadeTriggered.current[playerId] = false;

      // Reset last check time for crossfade trigger
      progressIntervals.current[playerId].lastCheckTime = 0;

      // Ensure volume is set to default if not already set
      if (players[playerId].volume === 0) {
        const defaultVolume = 50;
        setPlayers((prev) => ({
          ...prev,
          [playerId]: {
            ...prev[playerId],
            volume: defaultVolume, // Default volume
          },
        }));

        // Update intended volume
        intendedVolumes.current[playerId] = defaultVolume;
      } else {
        // Update intended volume to current volume
        intendedVolumes.current[playerId] = players[playerId].volume;
      }

      // Start progress tracking
      startProgressTracking(playerId);

      // Get initial duration after a short delay to ensure player is ready
      setTimeout(async () => {
        if (service === ServiceType.Youtube) {
          try {
            const duration = youtubeManager.getDuration(playerId) * 1000; // Convert to ms
            if (duration > 0) {
              // Initialize the internal state
              youtubeManager.setPlayerState(playerId, {
                currentTime: 0,
                duration,
                isPlaying: false,
              });

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
                // Initialize the internal state
                spotifyManager.setPlayerState(playerId, {
                  currentTime: state.position || 0,
                  duration: state.duration,
                  isPlaying: !state.paused,
                });

                setPlayers((prev) => ({
                  ...prev,
                  [playerId]: {
                    ...prev[playerId],
                    duration: state.duration,
                    currentTime: state.position || 0,
                    isPlaying: !state.paused,
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
      console.error(`❌ Error initializing ${playerId} player:`, error);
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
    if (!playerState.isActive || !playerState.song) {
      console.log(`Cannot seek player ${playerId}: not active or no song`);
      return;
    }

    console.log(`Seeking player ${playerId} to position ${position}ms`, {
      service: playerState.service,
      currentTime: playerState.currentTime,
      duration: playerState.duration,
      isActive: playerState.isActive,
    });

    if (playerState.service === ServiceType.Youtube) {
      console.log(`Seeking YouTube player ${playerId} to ${position / 1000}s`);
      youtubeManager.seekPlayer(playerId, position / 1000); // Convert to seconds for YouTube API
    } else {
      // For Spotify, use the Web Playback SDK
      const player = spotifyManager.getPlayer(playerId);
      if (player && typeof player.seek === "function") {
        console.log(`Seeking Spotify player ${playerId} to ${position}ms`);
        await player.seek(position); // Already in milliseconds for Spotify
      } else {
        console.log(
          `Spotify player ${playerId} not available or seek method not found`
        );
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

    // Also update the internal state for both services
    if (playerState.service === ServiceType.Spotify) {
      spotifyManager.setPlayerState(playerId, {
        currentTime: position,
        duration: playerState.duration,
        isPlaying: playerState.isPlaying,
      });
    } else if (playerState.service === ServiceType.Youtube) {
      youtubeManager.setPlayerState(playerId, {
        currentTime: position,
        duration: playerState.duration,
        isPlaying: playerState.isPlaying,
      });
    }
  };

  const startProgressTracking = (playerId: "A" | "B") => {
    // Clear existing interval
    if (progressIntervals.current[playerId].timeout) {
      clearInterval(progressIntervals.current[playerId].timeout);
    }

    console.log(`Starting progress tracking for player ${playerId}`);

    // For Spotify, add event listener for player_state_changed (like SpotifyPlayer)
    if (players[playerId].service === ServiceType.Spotify) {
      const player = spotifyManager.getPlayer(playerId);
      if (player) {
        const handleStateChange = (data: unknown) => {
          const state = data as SpotifyPlaybackState | null;
          if (state) {
            console.log(`Spotify state change for ${playerId}:`, {
              position: state.position,
              duration: state.duration,
              paused: state.paused,
            });

            setPlayers((prev) => ({
              ...prev,
              [playerId]: {
                ...prev[playerId],
                currentTime: state.position || 0,
                duration: state.duration || 0,
                isPlaying: !state.paused,
              },
            }));
          }
        };

        player.addListener("player_state_changed", handleStateChange);

        // Store the listener for cleanup
        if (!spotifyManager.eventListeners) {
          spotifyManager.eventListeners = new Map();
        }
        spotifyManager.eventListeners.set(playerId, handleStateChange);
      }
    }

    // Start interval for both YouTube and Spotify (like SpotifyPlayer uses 1000ms)
    const timeout = setInterval(async () => {
      // Store the timeout in the progressIntervals structure
      progressIntervals.current[playerId].timeout = timeout;
      const playerState = playersRef.current[playerId];
      if (!playerState.isActive || !playerState.song) return;

      if (playerState.service === ServiceType.Youtube) {
        try {
          const currentTime = youtubeManager.getCurrentTime(playerId) * 1000; // Convert to ms
          const duration = youtubeManager.getDuration(playerId) * 1000; // Convert to ms
          const playerStateNum = youtubeManager.getPlayerState(playerId);

          // Update the UI state directly (like SpotifyPlayer)
          setPlayers((prev) => ({
            ...prev,
            [playerId]: {
              ...prev[playerId],
              currentTime,
              duration: duration > 0 ? duration : prev[playerId].duration,
              isPlaying: playerStateNum === 1,
            },
          }));

          // Check for crossfade trigger
          if (
            isCrossfadeEnabledRef.current &&
            !crossfadeInProgressRef.current &&
            !crossfadeTriggered.current[playerId] &&
            !globalCrossfadeLock.current &&
            duration > 0 &&
            playerStateNum === 1 // Only trigger if actually playing
          ) {
            // Double-check to prevent race conditions
            if (
              crossfadeInProgressRef.current ||
              crossfadeTriggered.current[playerId] ||
              globalCrossfadeLock.current
            ) {
              console.log(
                `🎵 Crossfade already in progress or triggered for ${playerId}, skipping`
              );
              return;
            }
            const crossfadeStartTime =
              duration - (duration * crossfadeRef.current) / 100;
            console.log(`Crossfade check for ${playerId}:`, {
              currentTime: Math.round(currentTime / 1000),
              crossfadeStartTime: Math.round(crossfadeStartTime / 1000),
              duration: Math.round(duration / 1000),
              shouldTrigger: currentTime >= crossfadeStartTime,
              alreadyTriggered: crossfadeTriggered.current[playerId],
            });

            // Only trigger if we just crossed the threshold (not continuously after)
            const timeSinceLastCheck =
              progressIntervals.current[playerId]?.lastCheckTime || 0;
            const justCrossedThreshold =
              timeSinceLastCheck < crossfadeStartTime &&
              currentTime >= crossfadeStartTime;

            if (justCrossedThreshold) {
              console.log(
                `🎵 CROSSFADE TRIGGER for ${playerId} at ${Math.round(
                  currentTime / 1000
                )}s (${crossfadeRef.current}% of ${Math.round(
                  duration / 1000
                )}s)`
              );
              console.log(`🎵 Crossfade trigger state before:`, {
                playerId,
                alreadyTriggered: crossfadeTriggered.current[playerId],
                crossfadeInProgress: crossfadeInProgressRef.current,
              });

              // Mark this player as having triggered crossfade IMMEDIATELY
              crossfadeTriggered.current[playerId] = true;
              crossfadeInProgressRef.current = true;
              globalCrossfadeLock.current = true;

              // Set crossfade in progress immediately to prevent multiple triggers
              setCrossfadeInProgress(true);

              console.log(`🎵 Crossfade trigger state after:`, {
                playerId,
                alreadyTriggered: crossfadeTriggered.current[playerId],
                crossfadeInProgress: crossfadeInProgressRef.current,
              });

              triggerCrossfade(playerId);
            }

            // Update the last check time
            if (progressIntervals.current[playerId]) {
              progressIntervals.current[playerId].lastCheckTime = currentTime;
            }
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
              // Update the UI state directly (like SpotifyPlayer)
              setPlayers((prev) => ({
                ...prev,
                [playerId]: {
                  ...prev[playerId],
                  currentTime: state.position || 0,
                  duration: state.duration || 0,
                  isPlaying: !state.paused,
                },
              }));

              // Check for crossfade trigger
              if (
                isCrossfadeEnabledRef.current &&
                !crossfadeInProgressRef.current &&
                !crossfadeTriggered.current[playerId] &&
                !globalCrossfadeLock.current &&
                state.duration > 0 &&
                !state.paused // Only trigger if actually playing
              ) {
                // Double-check to prevent race conditions
                if (
                  crossfadeInProgressRef.current ||
                  crossfadeTriggered.current[playerId] ||
                  globalCrossfadeLock.current
                ) {
                  console.log(
                    `🎵 Crossfade already in progress or triggered for ${playerId}, skipping`
                  );
                  return;
                }
                const crossfadeStartTime =
                  state.duration -
                  (state.duration * crossfadeRef.current) / 100;
                console.log(`Crossfade check for ${playerId}:`, {
                  currentTime: Math.round(state.position / 1000),
                  crossfadeStartTime: Math.round(crossfadeStartTime / 1000),
                  duration: Math.round(state.duration / 1000),
                  shouldTrigger: state.position >= crossfadeStartTime,
                  alreadyTriggered: crossfadeTriggered.current[playerId],
                });

                // Only trigger if we just crossed the threshold (not continuously after)
                const timeSinceLastCheck =
                  progressIntervals.current[playerId]?.lastCheckTime || 0;
                const justCrossedThreshold =
                  timeSinceLastCheck < crossfadeStartTime &&
                  state.position >= crossfadeStartTime;

                if (justCrossedThreshold) {
                  console.log(
                    `🎵 CROSSFADE TRIGGER for ${playerId} at ${Math.round(
                      state.position / 1000
                    )}s (${crossfadeRef.current}% of ${Math.round(
                      state.duration / 1000
                    )}s)`
                  );
                  console.log(`🎵 Crossfade trigger state before:`, {
                    playerId,
                    alreadyTriggered: crossfadeTriggered.current[playerId],
                    crossfadeInProgress: crossfadeInProgressRef.current,
                  });

                  // Mark this player as having triggered crossfade
                  crossfadeTriggered.current[playerId] = true;
                  crossfadeInProgressRef.current = true;
                  globalCrossfadeLock.current = true;

                  // Set crossfade in progress immediately to prevent multiple triggers
                  setCrossfadeInProgress(true);

                  console.log(`🎵 Crossfade trigger state after:`, {
                    playerId,
                    alreadyTriggered: crossfadeTriggered.current[playerId],
                    crossfadeInProgress: crossfadeInProgressRef.current,
                  });

                  triggerCrossfade(playerId);
                }

                // Update the last check time
                if (progressIntervals.current[playerId]) {
                  progressIntervals.current[playerId].lastCheckTime =
                    state.position;
                }
              }
            }
          }
        } catch (error) {
          console.error(
            `Error tracking Spotify progress for ${playerId}:`,
            error
          );
        }
      }
    }, 1000); // Use 1000ms like SpotifyPlayer

    // Store the timeout in the progressIntervals structure
    progressIntervals.current[playerId].timeout = timeout;
  };

  const handlePlay = async (playerId: "A" | "B") => {
    const playerState = players[playerId];
    if (!playerState.isActive || !playerState.song) return;

    console.log(`Playing player ${playerId}, service: ${playerState.service}`);

    if (playerState.service === ServiceType.Youtube) {
      // Check if player exists before trying to play
      const player = youtubeManager.getPlayer(playerId);
      console.log(`YouTube player ${playerId} check:`, {
        playerExists: !!player,
        playerType: typeof player,
        hasPlayVideo: player && typeof player.playVideo === "function",
      });

      if (!player) {
        console.error(
          `YouTube player ${playerId} not found - player may not have been created properly`
        );
        return;
      }

      youtubeManager.playPlayer(playerId);
    } else {
      // For Spotify, check if this track is already loaded
      const trackInfo = spotifyManager.trackInfo.get(playerId);
      if (trackInfo) {
        // Check if this track is already loaded (not necessarily playing)
        const currentState = spotifyManager.playerStates.get(playerId);
        console.log(`Player ${playerId} track info:`, trackInfo);
        console.log(`Player ${playerId} current state:`, currentState);

        if (currentState && currentState.currentTime > 0) {
          // Track is loaded and has progress, just resume from current position
          console.log(
            `Resuming player ${playerId} from current position: ${currentState.currentTime}ms`
          );
          await spotifyManager.resumePlayer(playerId);
        } else {
          // This is a new track or no progress, need to load it first
          console.log(`Loading new track for player ${playerId}`);
          await spotifyManager.playTrack(playerId, trackInfo.trackId);
        }
      } else {
        // Primary player, just resume
        console.log(`Resuming primary player ${playerId}`);
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

    // Ensure the player's volume is set correctly using intended volume
    const intendedVolume = intendedVolumes.current[playerId];
    if (playerState.service === ServiceType.Youtube) {
      youtubeManager.setVolume(playerId, intendedVolume);
    } else {
      spotifyManager.setVolume(playerId, intendedVolume);
    }

    // Update UI state to match intended volume
    setPlayers((prev) => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        volume: intendedVolume,
      },
    }));
  };

  const handlePause = async (playerId: "A" | "B") => {
    const playerState = players[playerId];
    if (!playerState.isActive || !playerState.song) return;

    console.log(`Pausing player ${playerId}, service: ${playerState.service}`);

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
        // Preserve the intended volume even when stopping
        volume: intendedVolumes.current[playerId],
      },
    }));
  };

  const handleVolumeChange = (playerId: "A" | "B", volume: number) => {
    const playerState = players[playerId];
    if (!playerState.isActive || !playerState.song) return;

    // Update intended volume
    intendedVolumes.current[playerId] = volume;

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

  const triggerCrossfade = async (endingPlayerId: "A" | "B") => {
    const otherPlayerId = endingPlayerId === "A" ? "B" : "A";
    const endingPlayer = playersRef.current[endingPlayerId];
    const otherPlayer = playersRef.current[otherPlayerId];

    console.log(`🎵 Crossfade check:`, {
      endingPlayer: {
        id: endingPlayerId,
        isActive: endingPlayer.isActive,
        hasSong: !!endingPlayer.song,
        isPlaying: endingPlayer.isPlaying,
        volume: endingPlayer.volume,
      },
      otherPlayer: {
        id: otherPlayerId,
        isActive: otherPlayer.isActive,
        hasSong: !!otherPlayer.song,
        isPlaying: otherPlayer.isPlaying,
        volume: otherPlayer.volume,
      },
    });

    // Check if other player has a track loaded
    if (!otherPlayer.isActive || !otherPlayer.song) {
      console.log(`❌ No track loaded on ${otherPlayerId}, cannot crossfade`);
      setCrossfadeInProgress(false); // Reset since we can't crossfade
      return;
    }

    console.log(
      `🎵 Starting crossfade from ${endingPlayerId} to ${otherPlayerId}`
    );

    // Start the other player if it's not playing
    if (!otherPlayer.isPlaying) {
      console.log(`🎵 Starting ${otherPlayerId} for crossfade`);
      console.log(`🎵 ${otherPlayerId} state before starting:`, {
        isActive: otherPlayer.isActive,
        hasSong: !!otherPlayer.song,
        service: otherPlayer.service,
        currentTime: otherPlayer.currentTime,
        duration: otherPlayer.duration,
      });

      // For crossfade, ensure the track starts from the beginning
      if (otherPlayer.service === ServiceType.Spotify) {
        const player = spotifyManager.getPlayer(otherPlayerId);
        if (player && typeof player.seek === "function") {
          console.log(`🎵 Seeking ${otherPlayerId} to beginning for crossfade`);
          await player.seek(0);
        }
      } else if (otherPlayer.service === ServiceType.Youtube) {
        console.log(`🎵 Seeking ${otherPlayerId} to beginning for crossfade`);
        youtubeManager.seekPlayer(otherPlayerId, 0);
      }

      // Directly start the player instead of using handlePlay to avoid state conflicts
      if (otherPlayer.service === ServiceType.Youtube) {
        console.log(`🎵 Directly starting YouTube player ${otherPlayerId}`);
        try {
          // Check if player exists before trying to start it
          const playerState = youtubeManager.getPlayerState(otherPlayerId);
          console.log(
            `🎵 YouTube player ${otherPlayerId} state before start:`,
            {
              playerState,
              isPlaying: playerState === 1,
            }
          );

          youtubeManager.playPlayer(otherPlayerId);

          // Check if the player actually started
          setTimeout(() => {
            const newPlayerState = youtubeManager.getPlayerState(otherPlayerId);
            console.log(
              `🎵 YouTube player ${otherPlayerId} state after start:`,
              {
                playerState: newPlayerState,
                isPlaying: newPlayerState === 1,
              }
            );

            // If still not playing, try again
            if (newPlayerState !== 1) {
              console.log(`🎵 Retrying YouTube player ${otherPlayerId} start`);
              youtubeManager.playPlayer(otherPlayerId);
            }
          }, 1000);
        } catch (error) {
          console.error(
            `🎵 Error starting YouTube player ${otherPlayerId}:`,
            error
          );
        }
      } else {
        console.log(`🎵 Directly starting Spotify player ${otherPlayerId}`);
        try {
          const trackInfo = spotifyManager.trackInfo.get(otherPlayerId);
          if (trackInfo) {
            await spotifyManager.playTrack(otherPlayerId, trackInfo.trackId);
          } else {
            await spotifyManager.resumePlayer(otherPlayerId);
          }
        } catch (error) {
          console.error(
            `🎵 Error starting Spotify player ${otherPlayerId}:`,
            error
          );
        }
      }

      // Update UI state to reflect the reset position and playing state
      setPlayers((prev) => ({
        ...prev,
        [otherPlayerId]: {
          ...prev[otherPlayerId],
          currentTime: 0,
          isPlaying: true,
          // Ensure volume is set to intended volume
          volume: intendedVolumes.current[otherPlayerId],
        },
      }));

      // Update the ref immediately to reflect the state change
      playersRef.current[otherPlayerId] = {
        ...playersRef.current[otherPlayerId],
        isPlaying: true,
        currentTime: 0, // Reset to beginning for crossfade
        volume: intendedVolumes.current[otherPlayerId], // Ensure volume is correct
      };

      // Wait a moment and check if it actually started
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const updatedOtherPlayer = playersRef.current[otherPlayerId];
      console.log(`🎵 After starting ${otherPlayerId}:`, {
        isPlaying: updatedOtherPlayer.isPlaying,
        volume: updatedOtherPlayer.volume,
        service: updatedOtherPlayer.service,
        hasSong: !!updatedOtherPlayer.song,
        currentTime: updatedOtherPlayer.currentTime,
        duration: updatedOtherPlayer.duration,
      });

      // Start progress tracking for the other player if not already tracking
      if (!progressIntervals.current[otherPlayerId].timeout) {
        console.log(`🎵 Starting progress tracking for ${otherPlayerId}`);
        startProgressTracking(otherPlayerId);
      }
    } else {
      console.log(`🎵 ${otherPlayerId} is already playing, skipping start`);
    }

    // Calculate crossfade duration - use a fixed duration instead of percentage
    // Convert percentage to seconds: 10% = 1 second, 20% = 2 seconds, etc.
    const crossfadeDuration = (crossfadeRef.current / 10) * 1000; // Convert to milliseconds
    const steps = 20; // Number of volume steps
    const stepDuration = crossfadeDuration / steps;

    console.log(`🎵 Crossfade parameters:`, {
      crossfadeDuration: Math.round(crossfadeDuration / 1000),
      steps,
      stepDuration: Math.round(stepDuration / 1000),
      percentage: crossfadeRef.current,
    });

    // Store intended volumes - use the intended volumes which represent what the user wants
    const originalEndingVolume = intendedVolumes.current[endingPlayerId];
    const originalOtherVolume = intendedVolumes.current[otherPlayerId];

    console.log(`🎵 Intended volumes for crossfade:`, {
      endingPlayer: originalEndingVolume,
      otherPlayer: originalOtherVolume,
      currentEndingVolume: endingPlayer.volume,
      currentOtherVolume: otherPlayer.volume,
    });

    // Perform volume crossfade
    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;
      const endingVolume = originalEndingVolume * (1 - progress);
      const otherVolume = originalOtherVolume * progress;

      console.log(`🎵 Crossfade step ${i}/${steps}:`, {
        endingVolume: Math.round(endingVolume),
        otherVolume: Math.round(otherVolume),
      });

      // Set volumes with safeguards
      const safeEndingVolume = Math.max(0, Math.min(100, endingVolume));
      const safeOtherVolume = Math.max(0, Math.min(100, otherVolume));

      if (endingPlayer.service === ServiceType.Youtube) {
        youtubeManager.setVolume(endingPlayerId, safeEndingVolume);
      } else {
        spotifyManager.setVolume(endingPlayerId, safeEndingVolume);
      }

      if (otherPlayer.service === ServiceType.Youtube) {
        youtubeManager.setVolume(otherPlayerId, safeOtherVolume);
      } else {
        spotifyManager.setVolume(otherPlayerId, safeOtherVolume);
      }

      // Update UI state
      setPlayers((prev) => ({
        ...prev,
        [endingPlayerId]: {
          ...prev[endingPlayerId],
          volume: endingVolume,
        },
        [otherPlayerId]: {
          ...prev[otherPlayerId],
          volume: otherVolume,
        },
      }));

      // Wait for next step
      await new Promise((resolve) => setTimeout(resolve, stepDuration));
    }

    // Stop the ending player directly
    console.log(`🎵 Stopping ${endingPlayerId} after crossfade`);
    if (endingPlayer.service === ServiceType.Youtube) {
      youtubeManager.stopPlayer(endingPlayerId);
    } else {
      await spotifyManager.pausePlayer(endingPlayerId);
    }

    // Update the ref and UI state immediately
    playersRef.current[endingPlayerId] = {
      ...playersRef.current[endingPlayerId],
      isPlaying: false,
      currentTime: 0,
    };

    setPlayers((prev) => ({
      ...prev,
      [endingPlayerId]: {
        ...prev[endingPlayerId],
        isPlaying: false,
        currentTime: 0,
      },
    }));

    // Reset volumes with debugging
    console.log(`🎵 Resetting volume for ${otherPlayerId}:`, {
      intendedVolume: originalOtherVolume,
      currentVolume: otherPlayer.volume,
      service: otherPlayer.service,
    });

    // Immediately set the volume on the player
    if (otherPlayer.service === ServiceType.Youtube) {
      youtubeManager.setVolume(otherPlayerId, originalOtherVolume);
      console.log(
        `🎵 Set YouTube volume for ${otherPlayerId} to ${originalOtherVolume}`
      );
    } else {
      spotifyManager.setVolume(otherPlayerId, originalOtherVolume);
      console.log(
        `🎵 Set Spotify volume for ${otherPlayerId} to ${originalOtherVolume}`
      );
    }

    // Update UI state immediately
    setPlayers((prev) => ({
      ...prev,
      [otherPlayerId]: {
        ...prev[otherPlayerId],
        volume: originalOtherVolume,
      },
    }));

    // Update ref immediately
    playersRef.current[otherPlayerId] = {
      ...playersRef.current[otherPlayerId],
      volume: originalOtherVolume,
    };

    // Double-check volume after a short delay and force restore if needed
    setTimeout(() => {
      const currentPlayer = playersRef.current[otherPlayerId];
      console.log(`🎵 Volume check for ${otherPlayerId} after reset:`, {
        uiVolume: currentPlayer.volume,
        intendedVolume: originalOtherVolume,
        isPlaying: currentPlayer.isPlaying,
      });

      // Force restore volume if it's not correct
      if (Math.abs(currentPlayer.volume - originalOtherVolume) > 1) {
        console.log(
          `🎵 Force restoring volume for ${otherPlayerId} from ${currentPlayer.volume} to ${originalOtherVolume}`
        );
        if (otherPlayer.service === ServiceType.Youtube) {
          youtubeManager.setVolume(otherPlayerId, originalOtherVolume);
        } else {
          spotifyManager.setVolume(otherPlayerId, originalOtherVolume);
        }

        setPlayers((prev) => ({
          ...prev,
          [otherPlayerId]: {
            ...prev[otherPlayerId],
            volume: originalOtherVolume,
          },
        }));

        // Update ref again
        playersRef.current[otherPlayerId] = {
          ...playersRef.current[otherPlayerId],
          volume: originalOtherVolume,
        };
      }
    }, 500);

    setCrossfadeInProgress(false);
    crossfadeInProgressRef.current = false;
    globalCrossfadeLock.current = false;
    console.log(
      `✅ Crossfade completed from ${endingPlayerId} to ${otherPlayerId}`
    );
  };

  const handleCrossfade = async () => {
    const newEnabled = !isCrossfadeEnabled;
    setIsCrossfadeEnabled(newEnabled);
    console.log("Crossfade toggled:", newEnabled);

    // Reset crossfade trigger state when toggling
    if (newEnabled) {
      // When enabling crossfade, reset trigger states to allow new crossfades
      crossfadeTriggered.current.A = false;
      crossfadeTriggered.current.B = false;
      progressIntervals.current.A.lastCheckTime = 0;
      progressIntervals.current.B.lastCheckTime = 0;
      console.log("🎵 Crossfade enabled - reset trigger states");
    } else {
      // When disabling crossfade, clear any in-progress crossfade
      if (crossfadeInProgressRef.current) {
        crossfadeInProgressRef.current = false;
        globalCrossfadeLock.current = false;
        setCrossfadeInProgress(false);
        console.log("🎵 Crossfade disabled - cleared in-progress state");
      }
    }
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

          // Only update the state, do NOT call initializePlayer here!
          if (playerId === "A" || playerId === "B") {
            const deck = playerId as "A" | "B";
            setPlayers((prev) => ({
              ...prev,
              [deck]: {
                ...prev[deck],
                service,
                song,
                isActive: true,
              },
            }));
          }
        } else {
          console.error(`Could not find ${service} item with id: ${id}`);
          console.log(
            `Available YouTube search results:`,
            youtube.searchResults.map((v) => ({
              id: v.id.videoId,
              title: v.snippet.title,
            }))
          );
          console.log(
            `Available Spotify search results:`,
            spotify.searchResults.map((s) => ({ id: s.id, title: s.title }))
          );
          console.log(
            `Available playlist items:`,
            unified.playlist.map((item) => ({
              id: item.id,
              type: item.type,
              title:
                item.type === ServiceType.Spotify
                  ? (item.data as Song).title
                  : (item.data as YoutubeVideo).snippet?.title || "Unknown",
            }))
          );
          alert(
            `Could not find ${service} item with ID "${id}". Please try searching again or check if the item is still available.`
          );
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
              console.log(`📥 Drop event triggered for ${playerId}`);
              const songData = e.dataTransfer.getData("application/json");
              console.log(`📦 Song data received:`, songData ? "Yes" : "No");
              if (songData) {
                try {
                  const { song, service } = JSON.parse(songData);
                  console.log(`🎵 Parsed song data for ${playerId}:`, {
                    service,
                    songTitle:
                      service === ServiceType.Youtube
                        ? (song as YoutubeVideo).snippet.title
                        : (song as Song).title,
                  });
                  initializePlayer(playerId, song, service);
                } catch (error) {
                  console.error("Error parsing dropped song:", error);
                }
              } else {
                console.error(
                  `❌ No song data found in drop event for ${playerId}`
                );
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

  // Add useEffect for Deck A YouTube player initialization
  useEffect(() => {
    if (
      players.A.isActive &&
      players.A.service === ServiceType.Youtube &&
      players.A.song &&
      playerAContainerRef.current
    ) {
      initializePlayer(
        "A",
        players.A.song,
        ServiceType.Youtube,
        playerAContainerRef.current
      );
    }
    // Only run when the song/service/active state or ref changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    players.A.song,
    players.A.isActive,
    players.A.service,
    playerAContainerRef.current,
  ]);

  // Add useEffect for Deck B YouTube player initialization
  useEffect(() => {
    if (
      players.B.isActive &&
      players.B.service === ServiceType.Youtube &&
      players.B.song &&
      playerBContainerRef.current
    ) {
      initializePlayer(
        "B",
        players.B.song,
        ServiceType.Youtube,
        playerBContainerRef.current
      );
    }
    // Only run when the song/service/active state or ref changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    players.B.song,
    players.B.isActive,
    players.B.service,
    playerBContainerRef.current,
  ]);

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
            disabled={crossfadeInProgress}
            className={`px-4 py-2 rounded-lg text-white font-mono text-sm transition-all duration-200 ${
              crossfadeInProgress
                ? "bg-gradient-to-r from-yellow-400 to-yellow-600 shadow-[0_0_20px_rgba(234,179,8,0.6)] cursor-not-allowed"
                : isCrossfadeEnabled
                ? "bg-gradient-to-r from-green-400 to-green-600 shadow-[0_0_20px_rgba(34,197,94,0.6)]"
                : "bg-gradient-to-r from-red-400 to-red-600 hover:shadow-[0_0_20px_rgba(255,107,107,0.6)]"
            }`}
          >
            <FaExchangeAlt
              className={`inline mr-2 ${
                crossfadeInProgress ? "animate-spin" : ""
              }`}
            />
            {crossfadeInProgress
              ? "CROSSFADING..."
              : isCrossfadeEnabled
              ? "CROSSFADE ON"
              : "CROSSFADE"}
          </button>
        </div>
      </div>

      {/* YouTube Video Display - Using API Players */}
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
                        {/* YouTube API Player Container */}
                        <div
                          id={`youtube-player-${playerId}`}
                          className="w-full h-full"
                          ref={
                            playerId === "A"
                              ? playerAContainerRef
                              : playerBContainerRef
                          }
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
                        {/* YouTube API Player Container */}
                        <div
                          id={`youtube-player-${playerId}`}
                          className="w-full h-full"
                          ref={
                            playerId === "A"
                              ? playerAContainerRef
                              : playerBContainerRef
                          }
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
          <span
            className={`font-mono text-sm ${
              isCrossfadeEnabled ? "text-white" : "text-gray-500"
            }`}
          >
            CROSSFADE
          </span>
          <div
            className={`flex-1 h-2 rounded-full relative ${
              isCrossfadeEnabled ? "bg-gray-700" : "bg-gray-800"
            }`}
          >
            <input
              type="range"
              min="0"
              max="100"
              value={crossfade}
              onChange={(e) => setCrossfade(Number(e.target.value))}
              disabled={!isCrossfadeEnabled}
              className={`absolute inset-0 w-full h-full opacity-0 ${
                isCrossfadeEnabled ? "cursor-pointer" : "cursor-not-allowed"
              }`}
            />
            <div
              className={`absolute top-0 left-0 h-full rounded-full transition-all duration-100 ${
                isCrossfadeEnabled
                  ? "bg-gradient-to-r from-red-400 to-red-600"
                  : "bg-gray-600"
              }`}
              style={{ width: `${crossfade}%` }}
            />
          </div>
          <span
            className={`font-mono text-sm ${
              isCrossfadeEnabled ? "text-white" : "text-gray-500"
            }`}
          >
            {isCrossfadeEnabled ? `${crossfade}%` : "OFF"}
          </span>
        </div>
      </div>
    </div>
  );
}
