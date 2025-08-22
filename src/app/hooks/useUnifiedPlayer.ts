import { useState, useCallback, useEffect, useRef } from "react";
import { ServiceType, Song } from "@/app/types/playerTypes";
import { YoutubeVideo } from "@/app/types/youtubeTypes";
import {
  UnifiedPlayerManager,
  PlayerInstance,
  CrossfadeState,
} from "@/app/managers/UnifiedPlayerManager";

interface UseUnifiedPlayerProps {
  onPlayerStateChange?: (deckId: "A" | "B", state: PlayerInstance) => void;
  onCrossfadeStateChange?: (state: CrossfadeState) => void;
}

export function useUnifiedPlayer({
  onPlayerStateChange,
  onCrossfadeStateChange,
}: UseUnifiedPlayerProps = {}) {
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

  // Initialize the manager
  useEffect(() => {
    const initManager = async () => {
      try {
        const manager = new UnifiedPlayerManager();
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
        managerRef.current.destroy();
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  // Update player states from manager
  const updatePlayerStates = useCallback(() => {
    if (!managerRef.current) return;

    const newStates = {
      A: managerRef.current.getPlayerState("A"),
      B: managerRef.current.getPlayerState("B"),
    };

    setPlayerStates(newStates);

    // Notify parent components
    onPlayerStateChange?.("A", newStates.A);
    onPlayerStateChange?.("B", newStates.B);
  }, [onPlayerStateChange]);

  // Update crossfade state from manager
  const updateCrossfadeState = useCallback(() => {
    if (!managerRef.current) return;

    const newCrossfadeState = managerRef.current.getCrossfadeState();
    setCrossfadeState(newCrossfadeState);
    onCrossfadeStateChange?.(newCrossfadeState);
  }, [onCrossfadeStateChange]);

  // Start progress tracking
  useEffect(() => {
    if (!isInitialized || !managerRef.current) return;

    const startProgressTracking = () => {
      progressIntervalRef.current = setInterval(async () => {
        if (!managerRef.current) return;

        // Update player states
        updatePlayerStates();
        updateCrossfadeState();

        // Update progress for active players
        const currentStates = {
          A: managerRef.current.getPlayerState("A"),
          B: managerRef.current.getPlayerState("B"),
        };

        let hasChanges = false;

        // Update YouTube progress for deck A
        if (
          currentStates.A.isReady &&
          currentStates.A.service === ServiceType.Youtube
        ) {
          try {
            // Check if player is actually ready before trying to access it
            const isActuallyReady = await managerRef.current[
              "isPlayerActuallyReady"
            ]("A");
            if (!isActuallyReady) {
              // Player is not actually ready, update state to reflect this
              hasChanges = true;
              managerRef.current["updatePlayerState"]("A", {
                isReady: false,
                isPlaying: false,
              });
            } else {
              const currentTime =
                managerRef.current["youtubeManager"].getCurrentTime("A") * 1000;
              const duration =
                managerRef.current["youtubeManager"].getDuration("A") * 1000;
              const isPlaying =
                managerRef.current["youtubeManager"].getPlayerState("A") === 1;

              if (
                currentTime !== currentStates.A.currentTime ||
                duration !== currentStates.A.duration ||
                isPlaying !== currentStates.A.isPlaying
              ) {
                hasChanges = true;
                managerRef.current["updatePlayerState"]("A", {
                  currentTime,
                  duration,
                  isPlaying,
                });
              }
            }
          } catch (error) {
            console.warn("Error updating YouTube progress for deck A:", error);
            // Mark player as not ready if we can't access it
            hasChanges = true;
            managerRef.current["updatePlayerState"]("A", {
              isReady: false,
              isPlaying: false,
            });
          }
        }

        // Update YouTube progress for deck B
        if (
          currentStates.B.isReady &&
          currentStates.B.service === ServiceType.Youtube
        ) {
          try {
            // Check if player is actually ready before trying to access it
            const isActuallyReady = await managerRef.current[
              "isPlayerActuallyReady"
            ]("B");
            if (!isActuallyReady) {
              // Player is not actually ready, update state to reflect this
              hasChanges = true;
              managerRef.current["updatePlayerState"]("B", {
                isReady: false,
                isPlaying: false,
              });
            } else {
              const currentTime =
                managerRef.current["youtubeManager"].getCurrentTime("B") * 1000;
              const duration =
                managerRef.current["youtubeManager"].getDuration("B") * 1000;
              const isPlaying =
                managerRef.current["youtubeManager"].getPlayerState("B") === 1;

              if (
                currentTime !== currentStates.B.currentTime ||
                duration !== currentStates.B.duration ||
                isPlaying !== currentStates.B.isPlaying
              ) {
                hasChanges = true;
                managerRef.current["updatePlayerState"]("B", {
                  currentTime,
                  duration,
                  isPlaying,
                });
              }
            }
          } catch (error) {
            console.warn("Error updating YouTube progress for deck B:", error);
            // Mark player as not ready if we can't access it
            hasChanges = true;
            managerRef.current["updatePlayerState"]("B", {
              isReady: false,
              isPlaying: false,
            });
          }
        }

        // Update Spotify progress
        if (
          currentStates.A.isReady &&
          currentStates.A.service === ServiceType.Spotify
        ) {
          try {
            await managerRef.current["spotifyManager"].updatePlayerState("A");
            const state =
              managerRef.current["spotifyManager"].playerStates.get("A");
            if (state) {
              const currentTime = state.currentTime;
              const duration = state.duration;
              const isPlaying = state.isPlaying;

              if (
                currentTime !== currentStates.A.currentTime ||
                duration !== currentStates.A.duration ||
                isPlaying !== currentStates.A.isPlaying
              ) {
                hasChanges = true;
                managerRef.current["updatePlayerState"]("A", {
                  currentTime,
                  duration,
                  isPlaying,
                });
              }
            }
          } catch (error) {
            console.warn("Error updating Spotify progress for deck A:", error);
          }
        }

        if (
          currentStates.B.isReady &&
          currentStates.B.service === ServiceType.Spotify
        ) {
          try {
            await managerRef.current["spotifyManager"].updatePlayerState("B");
            const state =
              managerRef.current["spotifyManager"].playerStates.get("B");
            if (state) {
              const currentTime = state.currentTime;
              const duration = state.duration;
              const isPlaying = state.isPlaying;

              if (
                currentTime !== currentStates.B.currentTime ||
                duration !== currentStates.B.duration ||
                isPlaying !== currentStates.B.isPlaying
              ) {
                hasChanges = true;
                managerRef.current["updatePlayerState"]("B", {
                  currentTime,
                  duration,
                  isPlaying,
                });
              }
            }
          } catch (error) {
            console.warn("Error updating Spotify progress for deck B:", error);
          }
        }

        if (hasChanges) {
          updatePlayerStates();
        }

        // Check for auto-crossfade opportunities
        try {
          // Check if deck A should auto-crossfade
          if (currentStates.A.isPlaying && currentStates.A.isReady) {
            await managerRef.current["triggerAutoCrossfadeIfNeeded"]("A");
          }

          // Check if deck B should auto-crossfade
          if (currentStates.B.isPlaying && currentStates.B.isReady) {
            await managerRef.current["triggerAutoCrossfadeIfNeeded"]("B");
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

  // Play a deck
  const playDeck = useCallback(
    async (deckId: "A" | "B") => {
      if (!managerRef.current) {
        throw new Error("Player manager not initialized");
      }

      try {
        await managerRef.current.playDeck(deckId);
        updatePlayerStates();
        console.log(`▶️ Started playing deck ${deckId}`);
      } catch (error) {
        console.error(`❌ Failed to play deck ${deckId}:`, error);
        throw error;
      }
    },
    [updatePlayerStates]
  );

  // Pause a deck
  const pauseDeck = useCallback(
    async (deckId: "A" | "B") => {
      if (!managerRef.current) {
        throw new Error("Player manager not initialized");
      }

      try {
        await managerRef.current.pauseDeck(deckId);
        updatePlayerStates();
        console.log(`⏸️ Paused deck ${deckId}`);
      } catch (error) {
        console.error(`❌ Failed to pause deck ${deckId}:`, error);
        throw error;
      }
    },
    [updatePlayerStates]
  );

  // Stop a deck
  const stopDeck = useCallback(
    async (deckId: "A" | "B") => {
      if (!managerRef.current) {
        throw new Error("Player manager not initialized");
      }

      try {
        await managerRef.current.stopDeck(deckId);
        updatePlayerStates();
        console.log(`⏹️ Stopped deck ${deckId}`);
      } catch (error) {
        console.error(`❌ Failed to stop deck ${deckId}:`, error);
        throw error;
      }
    },
    [updatePlayerStates]
  );

  // Set volume for a deck
  const setDeckVolume = useCallback(
    async (deckId: "A" | "B", volume: number) => {
      if (!managerRef.current) {
        throw new Error("Player manager not initialized");
      }

      try {
        await managerRef.current.setDeckVolume(deckId, volume);
        updatePlayerStates();
        console.log(`🔊 Set deck ${deckId} volume to ${volume}`);
      } catch (error) {
        console.error(`❌ Failed to set volume for deck ${deckId}:`, error);
        throw error;
      }
    },
    [updatePlayerStates]
  );

  // Seek in a deck
  const seekDeck = useCallback(
    async (deckId: "A" | "B", position: number) => {
      if (!managerRef.current) {
        throw new Error("Player manager not initialized");
      }

      try {
        await managerRef.current.seekDeck(deckId, position);
        updatePlayerStates();
        console.log(
          `⏩ Seeked deck ${deckId} to ${Math.round(position / 1000)}s`
        );
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
        await managerRef.current.startCrossfade(fromDeck, toDeck, duration);
        updatePlayerStates();
        updateCrossfadeState();
        console.log(`🔄 Crossfade started from ${fromDeck} to ${toDeck}`);
      } catch (error) {
        console.error(`❌ Failed to start crossfade:`, error);
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
        await managerRef.current["triggerAutoCrossfadeIfNeeded"](deckId);
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
  const canAutoCrossfade = useCallback((deckId: "A" | "B") => {
    if (!managerRef.current) return false;
    return managerRef.current["shouldAutoCrossfade"](deckId);
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
