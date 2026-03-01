import React, { useState, useCallback, useEffect, useRef } from "react";
import { ServiceType, Song } from "@/app/types/playerTypes";
import { YoutubeVideo } from "@/app/types/youtubeTypes";
import {
  UnifiedPlayerManager,
  PlayerInstance,
  CrossfadeState,
} from "@/app/managers/UnifiedPlayerManager";
import { useAuth } from "@/app/context/AuthContext";

interface UseUnifiedPlayerProps {
  onPlayerStateChange?: (deckId: "A" | "B", state: PlayerInstance) => void;
  onCrossfadeStateChange?: (state: CrossfadeState) => void;
  /** Ref to call with fresh manager state so auto-crossfade can run from the progress loop */
  autoCrossfadeCheckRef?: React.MutableRefObject<
    ((states: { A: PlayerInstance; B: PlayerInstance }) => void) | null
  >;
}

export function useUnifiedPlayer({
  onPlayerStateChange,
  onCrossfadeStateChange,
  autoCrossfadeCheckRef,
}: UseUnifiedPlayerProps = {}) {
  const { getSpotifyToken } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const [playerStates, setPlayerStates] = useState<{
    A: PlayerInstance;
    B: PlayerInstance;
  }>({
    A: {
      id: "A",
      service: ServiceType.Youtube,
      isReady: false,
      isPlaying: false,
      currentTrack: null,
      currentTime: 0,
      duration: 0,
      volume: 50,
      isMuted: false,
      lastActivity: Date.now(),
      errorCount: 0,
    },
    B: {
      id: "B",
      service: ServiceType.Youtube,
      isReady: false,
      isPlaying: false,
      currentTrack: null,
      currentTime: 0,
      duration: 0,
      volume: 50,
      isMuted: false,
      lastActivity: Date.now(),
      errorCount: 0,
    },
  });

  const [crossfadeState, setCrossfadeState] = useState<CrossfadeState>({
    isActive: false,
    fromDeck: null,
    toDeck: null,
    progress: 0,
    startTime: 0,
  });

  const managerRef = useRef<UnifiedPlayerManager | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSeekRef = useRef<{ time: number; deckId: string } | null>(null);
  const SEEK_THROTTLE_MS = 80;

  // Initialize the manager
  useEffect(() => {
    const initManager = async () => {
      try {
        const manager = new UnifiedPlayerManager();

        // Set the Spotify token getter
        manager.setSpotifyTokenGetter(getSpotifyToken);

        await manager.initialize();
        managerRef.current = manager;
        setIsInitialized(true);
        console.log("✅ useUnifiedPlayer initialized successfully");
      } catch (error) {
        console.error("❌ Failed to initialize useUnifiedPlayer:", error);
      }
    };

    initManager();

    return () => {
      if (managerRef.current) {
        managerRef.current.setOnEmbedDisabled(() => {});
        managerRef.current.destroy();
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [getSpotifyToken]);

  // Update player states from manager
  const updatePlayerStates = useCallback(() => {
    if (!managerRef.current) return;

    const newStates = {
      A: managerRef.current.getPlayerState("A"),
      B: managerRef.current.getPlayerState("B"),
    };

    setPlayerStates(newStates);

    // Notify parent components
    if (onPlayerStateChange) {
      onPlayerStateChange("A", newStates.A);
      onPlayerStateChange("B", newStates.B);
    }
  }, [onPlayerStateChange]);

  // When YouTube reports embed disabled (150/101), refresh state so UI shows "Watch on YouTube"
  useEffect(() => {
    const manager = managerRef.current;
    if (!manager || !isInitialized) return;
    manager.setOnEmbedDisabled(() => {
      updatePlayerStates();
    });
    return () => {
      manager.setOnEmbedDisabled(() => {});
    };
  }, [isInitialized, updatePlayerStates]);

  // Update crossfade state from manager
  const updateCrossfadeState = useCallback(() => {
    if (!managerRef.current) return;

    const newCrossfadeState = managerRef.current.getCrossfadeState();
    setCrossfadeState(newCrossfadeState);

    // Notify parent components
    if (onCrossfadeStateChange) {
      onCrossfadeStateChange(newCrossfadeState);
    }
  }, [onCrossfadeStateChange]);

  // Start progress tracking
  useEffect(() => {
    if (!isInitialized) return;

    const startProgressTracking = () => {
      progressIntervalRef.current = setInterval(async () => {
        if (!managerRef.current) return;

        // Update progress from service managers
        await managerRef.current.updateProgress();

        // Update UI states and crossfade state (so isActive stays in sync during/after crossfade)
        updatePlayerStates();
        updateCrossfadeState();

        // Run smart auto-crossfade check with fresh state (every ~1s)
        try {
          const now = Date.now();
          const shouldCheckCrossfade = now % 1000 < 250;
          if (shouldCheckCrossfade && autoCrossfadeCheckRef?.current) {
            const freshStates = {
              A: managerRef.current.getPlayerState("A"),
              B: managerRef.current.getPlayerState("B"),
            };
            autoCrossfadeCheckRef.current(freshStates);
          }
        } catch (error) {
          console.warn("Error checking auto-crossfade:", error);
        }
      }, 250); // Update every 250ms for smooth progress
    };

    startProgressTracking();

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refs and stable callbacks only
  }, [isInitialized, updatePlayerStates, updateCrossfadeState]);

  // Load track into a deck
  const loadTrack = useCallback(
    async (deckId: "A" | "B", track: Song | YoutubeVideo) => {
      if (!managerRef.current) {
        throw new Error("Player manager not initialized");
      }

      try {
        await managerRef.current.loadTrack(deckId, track);
        updatePlayerStates();
        // Track loading success is already logged in UnifiedPlayerManager
      } catch (error) {
        console.error(`❌ Failed to load track into deck ${deckId}:`, error);
        throw error;
      }
    },
    [updatePlayerStates]
  );

  // Play a deck - now calls service managers directly
  const playDeck = useCallback(
    async (deckId: "A" | "B") => {
      if (!managerRef.current) {
        throw new Error("Player manager not initialized");
      }

      try {
        const player = managerRef.current.getPlayerState(deckId);

        if (!player.isReady || !player.currentTrack) {
          throw new Error(`Deck ${deckId} is not ready to play`);
        }

        if (player.service === ServiceType.Youtube) {
          const youtubeManager = managerRef.current!.youtubeManager;
          youtubeManager.playPlayer(deckId);
        } else if (player.service === ServiceType.Spotify) {
          const spotifyManager = managerRef.current!.spotifyManager;
          const trackId = (player.currentTrack as Song).id;
          await spotifyManager.playTrack(deckId, trackId);
        }

        // Update player state
        managerRef.current!.updatePlayerState(deckId, {
          isPlaying: true,
          lastActivity: Date.now(),
        });

        updatePlayerStates();
        console.log(`▶️ Started playing deck ${deckId}`);
      } catch (error) {
        console.error(`❌ Failed to play deck ${deckId}:`, error);
        throw error;
      }
    },
    [updatePlayerStates]
  );

  // Pause a deck - now calls service managers directly
  const pauseDeck = useCallback(
    async (deckId: "A" | "B") => {
      if (!managerRef.current) {
        throw new Error("Player manager not initialized");
      }

      try {
        const player = managerRef.current.getPlayerState(deckId);

        if (!player.isReady) return;

        if (player.service === ServiceType.Youtube) {
          const youtubeManager = managerRef.current!.youtubeManager;
          youtubeManager.pausePlayer(deckId);
        } else if (player.service === ServiceType.Spotify) {
          const spotifyManager = managerRef.current!.spotifyManager;
          await spotifyManager.pausePlayer(deckId);
        }

        // Update player state
        managerRef.current!.updatePlayerState(deckId, {
          isPlaying: false,
          lastActivity: Date.now(),
        });

        updatePlayerStates();
        console.log(`⏸️ Paused deck ${deckId}`);
      } catch (error) {
        console.error(`❌ Failed to pause deck ${deckId}:`, error);
        throw error;
      }
    },
    [updatePlayerStates]
  );

  // Stop a deck - now calls service managers directly
  const stopDeck = useCallback(
    async (deckId: "A" | "B") => {
      if (!managerRef.current) {
        throw new Error("Player manager not initialized");
      }

      try {
        const player = managerRef.current.getPlayerState(deckId);

        if (!player.isReady) return;

        if (player.service === ServiceType.Youtube) {
          const youtubeManager = managerRef.current!.youtubeManager;
          youtubeManager.stopPlayer(deckId);
          // Clear video container to remove the video display
          youtubeManager.clearVideoContainer(deckId);
          console.log(`🧹 Cleared YouTube video container for deck ${deckId}`);
        } else if (player.service === ServiceType.Spotify) {
          const spotifyManager = managerRef.current!.spotifyManager;
          await spotifyManager.pausePlayer(deckId);
        }

        // Update player state
        managerRef.current!.updatePlayerState(deckId, {
          isPlaying: false,
          currentTime: 0,
          lastActivity: Date.now(),
        });

        updatePlayerStates();
        console.log(`⏹️ Stopped deck ${deckId}`);
      } catch (error) {
        console.error(`❌ Failed to stop deck ${deckId}:`, error);
        throw error;
      }
    },
    [updatePlayerStates]
  );

  // Set volume for a deck - now calls service managers directly
  const setDeckVolume = useCallback(
    async (deckId: "A" | "B", volume: number) => {
      if (!managerRef.current) {
        throw new Error("Player manager not initialized");
      }

      try {
        const player = managerRef.current.getPlayerState(deckId);

        if (!player.isReady) return;

        if (player.service === ServiceType.Youtube) {
          const youtubeManager = managerRef.current!.youtubeManager;
          youtubeManager.setVolume(deckId, volume);
        } else if (player.service === ServiceType.Spotify) {
          const spotifyManager = managerRef.current!.spotifyManager;
          await spotifyManager.setVolume(deckId, volume);
        }

        // Update player state
        managerRef.current!.updatePlayerState(deckId, {
          volume,
          lastActivity: Date.now(),
        });

        updatePlayerStates();
        console.log(`🔊 Set deck ${deckId} volume to ${volume}`);
      } catch (error) {
        console.error(`❌ Failed to set volume for deck ${deckId}:`, error);
        throw error;
      }
    },
    [updatePlayerStates]
  );

  // Seek in a deck - throttled so scratching doesn't flood Spotify API (429) or break YouTube
  const seekDeck = useCallback(
    async (deckId: "A" | "B", position: number) => {
      if (!managerRef.current) {
        throw new Error("Player manager not initialized");
      }

      const now = Date.now();
      const last = lastSeekRef.current;
      if (
        last &&
        last.deckId === deckId &&
        now - last.time < SEEK_THROTTLE_MS
      ) {
        return;
      }
      lastSeekRef.current = { time: now, deckId };

      try {
        const player = managerRef.current.getPlayerState(deckId);

        if (!player.isReady) return;

        if (player.service === ServiceType.Youtube) {
          const youtubeManager = managerRef.current!.youtubeManager;
          youtubeManager.seekPlayer(deckId, position / 1000);
        } else if (player.service === ServiceType.Spotify) {
          const spotifyManager = managerRef.current!.spotifyManager;
          const spotifyPlayer = spotifyManager.getPlayer(deckId);
          if (spotifyPlayer && typeof spotifyPlayer.seek === "function") {
            await spotifyPlayer.seek(position);
          }
        }

        managerRef.current!.updatePlayerState(deckId, {
          currentTime: position,
          lastActivity: Date.now(),
        });

        updatePlayerStates();
      } catch (error) {
        console.error(`❌ Failed to seek deck ${deckId}:`, error);
        throw error;
      }
    },
    [updatePlayerStates]
  );

  // Start crossfade
  const startCrossfade = useCallback(
    async (fromDeck: "A" | "B", toDeck: "A" | "B", duration?: number) => {
      if (!managerRef.current) {
        throw new Error("Player manager not initialized");
      }

      try {
        // Start crossfade; manager sets isActive = true synchronously before first await
        const promise = managerRef.current.startCrossfade(
          fromDeck,
          toDeck,
          duration ?? 2000
        );
        // Sync crossfade state immediately so isCrossfadeActive() is true during crossfade (prevents double-trigger and keeps UI correct)
        updateCrossfadeState();

        await promise;
        updatePlayerStates();
        updateCrossfadeState();
        console.log(`🔄 Crossfade started from ${fromDeck} to ${toDeck}`);
      } catch (error) {
        console.error(`❌ Failed to start crossfade:`, error);
        updateCrossfadeState(); // sync so isActive becomes false after error
        throw error;
      }
    },
    [updatePlayerStates, updateCrossfadeState]
  );

  // Trigger auto-crossfade
  const triggerAutoCrossfade = useCallback(
    async (deckId: "A" | "B") => {
      if (!managerRef.current) {
        throw new Error("Player manager not initialized");
      }

      try {
        await managerRef.current!.triggerAutoCrossfadeIfNeeded(deckId);
        updatePlayerStates();
        updateCrossfadeState();
        console.log(`🔄 Auto-crossfade triggered for deck ${deckId}`);
      } catch (error) {
        console.error(
          `❌ Failed to trigger auto-crossfade for deck ${deckId}:`,
          error
        );
        throw error;
      }
    },
    [updatePlayerStates, updateCrossfadeState]
  );

  // Clear a deck
  const clearDeck = useCallback(
    async (deckId: "A" | "B") => {
      if (!managerRef.current) {
        throw new Error("Player manager not initialized");
      }

      try {
        await managerRef.current.clearDeck(deckId);
        updatePlayerStates();
        console.log(`🧹 Cleared deck ${deckId}`);
      } catch (error) {
        console.error(`❌ Failed to clear deck ${deckId}:`, error);
        throw error;
      }
    },
    [updatePlayerStates]
  );

  // Check if crossfade is active
  const isCrossfadeActive = useCallback(() => {
    return crossfadeState.isActive;
  }, [crossfadeState.isActive]);

  // Get deck state
  const getDeckState = useCallback(
    (deckId: "A" | "B") => {
      return playerStates[deckId];
    },
    [playerStates]
  );

  // Check if deck is ready
  const isDeckReady = useCallback(
    (deckId: "A" | "B") => {
      return playerStates[deckId].isReady;
    },
    [playerStates]
  );

  // Check if deck is playing
  const isDeckPlaying = useCallback(
    (deckId: "A" | "B") => {
      return playerStates[deckId].isPlaying;
    },
    [playerStates]
  );

  // Check if deck has a track
  const hasTrack = useCallback(
    (deckId: "A" | "B") => {
      return !!playerStates[deckId].currentTrack;
    },
    [playerStates]
  );

  // Check if auto-crossfade is available for a deck
  const canAutoCrossfade = useCallback(() => {
    if (!managerRef.current) return false;
    return managerRef.current["shouldAutoCrossfade"]();
  }, []);

  return {
    // State
    isInitialized,
    playerStates,
    crossfadeState,

    // Actions
    loadTrack,
    playDeck,
    pauseDeck,
    stopDeck,
    setDeckVolume,
    seekDeck,
    startCrossfade,
    triggerAutoCrossfade,
    clearDeck,

    // Queries
    isCrossfadeActive,
    getDeckState,
    isDeckReady,
    isDeckPlaying,
    hasTrack,
    canAutoCrossfade,

    // Manager reference (for advanced operations)
    manager: managerRef.current,
  };
}
