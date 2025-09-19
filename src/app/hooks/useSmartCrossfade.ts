import { useState, useCallback, useEffect, useRef } from "react";
import { PlayerInstance } from "@/app/managers/UnifiedPlayerManager";

interface UseSmartCrossfadeProps {
  playerStates: {
    A: PlayerInstance;
    B: PlayerInstance;
  };
  startCrossfade: (
    fromDeck: "A" | "B",
    toDeck: "A" | "B",
    duration?: number
  ) => Promise<void>;
  isCrossfadeActive: () => boolean;
}

export function useSmartCrossfade({
  playerStates,
  startCrossfade,
  isCrossfadeActive,
}: UseSmartCrossfadeProps) {
  const [crossfadeEnabled, setCrossfadeEnabled] = useState(false);
  const [crossfadeDuration, setCrossfadeDuration] = useState(2000);
  const [autoCrossfadeThreshold, setAutoCrossfadeThreshold] = useState(8000); // 8 seconds
  const [minTimeRemaining, setMinTimeRemaining] = useState(2000); // 2 seconds minimum

  const crossfadeCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastCrossfadeTimeRef = useRef<number>(0);
  const crossfadeCooldownRef = useRef<number>(5000); // 5 seconds cooldown
  const prevTrackRef = useRef<{ A: string | null; B: string | null }>({
    A: null,
    B: null,
  });
  const hasUserActionRef = useRef<boolean>(false);
  const isInitialLoadRef = useRef<boolean>(true);

  // Track changes to detect user actions
  useEffect(() => {
    const currentTrackA =
      typeof playerStates.A.currentTrack?.id === "string"
        ? playerStates.A.currentTrack.id
        : playerStates.A.currentTrack?.id?.videoId || null;
    const currentTrackB =
      typeof playerStates.B.currentTrack?.id === "string"
        ? playerStates.B.currentTrack.id
        : playerStates.B.currentTrack?.id?.videoId || null;

    // Check if tracks have changed (user action)
    if (
      currentTrackA !== prevTrackRef.current.A ||
      currentTrackB !== prevTrackRef.current.B
    ) {
      // Only count as user action if it's not the initial load
      if (!isInitialLoadRef.current) {
        console.log("🎯 User action detected: Track change", {
          deckA: { from: prevTrackRef.current.A, to: currentTrackA },
          deckB: { from: prevTrackRef.current.B, to: currentTrackB },
        });
        hasUserActionRef.current = true;
      } else {
        console.log("🚫 Initial load detected: Not counting as user action", {
          deckA: { from: prevTrackRef.current.A, to: currentTrackA },
          deckB: { from: prevTrackRef.current.B, to: currentTrackB },
        });
        isInitialLoadRef.current = false;
      }
      prevTrackRef.current = { A: currentTrackA, B: currentTrackB };
    }
  }, [playerStates.A.currentTrack, playerStates.B.currentTrack]);

  // Check for auto-crossfade opportunities
  useEffect(() => {
    // Only run auto-crossfade checks if crossfade is explicitly enabled by user
    if (!crossfadeEnabled || isCrossfadeActive()) return;

    const checkForAutoCrossfade = () => {
      const now = Date.now();

      // Only trigger crossfade if user has performed an action (track change, etc.)
      if (!hasUserActionRef.current) {
        console.log("🚫 Auto-crossfade skipped: No user action detected");
        return;
      }

      // Check cooldown
      if (now - lastCrossfadeTimeRef.current < crossfadeCooldownRef.current) {
        console.log("🚫 Auto-crossfade skipped: Cooldown active");
        return;
      }

      // Check if any deck is about to end
      ["A", "B"].forEach((deckId) => {
        const player = playerStates[deckId as "A" | "B"];
        const otherDeckId = deckId === "A" ? "B" : "A";
        const otherPlayer = playerStates[otherDeckId as "A" | "B"];

        // Only trigger crossfade if both players are ready
        if (
          player.isReady &&
          player.isPlaying &&
          player.currentTrack &&
          player.duration > 0 &&
          otherPlayer.isReady &&
          otherPlayer.currentTrack &&
          otherPlayer.duration > 0
        ) {
          const timeRemaining = player.duration - player.currentTime;

          if (
            timeRemaining <= autoCrossfadeThreshold &&
            timeRemaining >= minTimeRemaining
          ) {
            console.log(
              `🎯 Auto-crossfade triggered for deck ${deckId} (${Math.round(
                timeRemaining / 1000
              )}s remaining)`
            );

            // Start crossfade
            startCrossfade(
              deckId as "A" | "B",
              otherDeckId as "A" | "B",
              crossfadeDuration
            )
              .then(() => {
                lastCrossfadeTimeRef.current = now;
                console.log(
                  `✅ Auto-crossfade completed from ${deckId} to ${otherDeckId}`
                );
              })
              .catch((error) => {
                console.error(`❌ Auto-crossfade failed:`, error);
              });
          }
        }
      });
    };

    crossfadeCheckIntervalRef.current = setInterval(
      checkForAutoCrossfade,
      1000
    );

    return () => {
      if (crossfadeCheckIntervalRef.current) {
        clearInterval(crossfadeCheckIntervalRef.current);
      }
    };
  }, [
    crossfadeEnabled,
    isCrossfadeActive,
    playerStates,
    startCrossfade,
    crossfadeDuration,
    autoCrossfadeThreshold,
    minTimeRemaining,
  ]);

  // Manual crossfade
  const triggerManualCrossfade = useCallback(async () => {
    if (isCrossfadeActive()) {
      console.log("🚫 Crossfade already in progress");
      return;
    }

    const playerA = playerStates.A;
    const playerB = playerStates.B;

    // Determine which player to crossfade from
    let fromDeck: "A" | "B";
    let toDeck: "A" | "B";

    if (playerA.isPlaying && playerB.isPlaying) {
      // Both playing - crossfade from the one with less time remaining
      const timeRemainingA = playerA.duration - playerA.currentTime;
      const timeRemainingB = playerB.duration - playerB.currentTime;

      if (timeRemainingA < timeRemainingB) {
        fromDeck = "A";
        toDeck = "B";
      } else {
        fromDeck = "B";
        toDeck = "A";
      }
    } else if (playerA.isPlaying) {
      fromDeck = "A";
      toDeck = "B";
    } else if (playerB.isPlaying) {
      fromDeck = "B";
      toDeck = "A";
    } else {
      console.log("🚫 No playing deck to crossfade from");
      return;
    }

    try {
      await startCrossfade(fromDeck, toDeck, crossfadeDuration);
      lastCrossfadeTimeRef.current = Date.now();
      console.log(
        `✅ Manual crossfade completed from ${fromDeck} to ${toDeck}`
      );
    } catch (error) {
      console.error(`❌ Manual crossfade failed:`, error);

      // Provide user-friendly error message for Spotify device issues
      if (
        error instanceof Error &&
        error.message.includes("device not available")
      ) {
        alert(
          "Crossfade failed: Spotify device not available. Please ensure Spotify app is open and active."
        );
      } else if (
        error instanceof Error &&
        error.message.includes("Cannot start Spotify playback")
      ) {
        alert(error.message);
      } else {
        alert(
          `Crossfade failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    }
  }, [playerStates, startCrossfade, crossfadeDuration, isCrossfadeActive]);

  // Toggle crossfade
  const toggleCrossfade = useCallback(() => {
    const newState = !crossfadeEnabled;
    setCrossfadeEnabled(newState);
    console.log(`🎛️ Auto-crossfade ${newState ? "ENABLED" : "DISABLED"}`);
  }, [crossfadeEnabled]);

  // Set crossfade duration
  const setCrossfadeDurationMs = useCallback((duration: number) => {
    setCrossfadeDuration(duration);
    console.log(`⏱️ Crossfade duration set to ${duration}ms`);
  }, []);

  // Set auto-crossfade threshold
  const setAutoCrossfadeThresholdMs = useCallback((threshold: number) => {
    setAutoCrossfadeThreshold(threshold);
    console.log(`🎯 Auto-crossfade threshold set to ${threshold}ms`);
  }, []);

  // Set minimum time remaining
  const setMinTimeRemainingMs = useCallback((minTime: number) => {
    setMinTimeRemaining(minTime);
    console.log(`⏰ Minimum time remaining set to ${minTime}ms`);
  }, []);

  // Set crossfade cooldown
  const setCrossfadeCooldownMs = useCallback((cooldown: number) => {
    crossfadeCooldownRef.current = cooldown;
    console.log(`🔄 Crossfade cooldown set to ${cooldown}ms`);
  }, []);

  // Check if crossfade is possible
  const canCrossfade = useCallback(() => {
    if (isCrossfadeActive()) return false;

    const playerA = playerStates.A;
    const playerB = playerStates.B;

    // Need at least one playing deck and one ready deck
    const hasPlayingDeck = playerA.isPlaying || playerB.isPlaying;
    const hasReadyDeck = playerA.isReady || playerB.isReady;

    return hasPlayingDeck && hasReadyDeck;
  }, [playerStates, isCrossfadeActive]);

  // Get crossfade suggestions
  const getCrossfadeSuggestions = useCallback(() => {
    const suggestions: Array<{
      fromDeck: "A" | "B";
      toDeck: "A" | "B";
      reason: string;
      priority: "high" | "medium" | "low";
    }> = [];

    const playerA = playerStates.A;
    const playerB = playerStates.B;

    // Check for ending tracks
    if (playerA.isPlaying && playerA.duration > 0) {
      const timeRemaining = playerA.duration - playerA.currentTime;
      if (
        timeRemaining <= autoCrossfadeThreshold &&
        timeRemaining >= minTimeRemaining
      ) {
        if (playerB.isReady && playerB.currentTrack) {
          suggestions.push({
            fromDeck: "A",
            toDeck: "B",
            reason: `Track ending in ${Math.round(timeRemaining / 1000)}s`,
            priority: timeRemaining <= 3000 ? "high" : "medium",
          });
        }
      }
    }

    if (playerB.isPlaying && playerB.duration > 0) {
      const timeRemaining = playerB.duration - playerB.currentTime;
      if (
        timeRemaining <= autoCrossfadeThreshold &&
        timeRemaining >= minTimeRemaining
      ) {
        if (playerA.isReady && playerA.currentTrack) {
          suggestions.push({
            fromDeck: "B",
            toDeck: "A",
            reason: `Track ending in ${Math.round(timeRemaining / 1000)}s`,
            priority: timeRemaining <= 3000 ? "high" : "medium",
          });
        }
      }
    }

    // Check for manual crossfade opportunities
    if (playerA.isPlaying && playerB.isPlaying) {
      const timeRemainingA = playerA.duration - playerA.currentTime;
      const timeRemainingB = playerB.duration - playerB.currentTime;

      if (Math.abs(timeRemainingA - timeRemainingB) <= 5000) {
        suggestions.push({
          fromDeck: timeRemainingA < timeRemainingB ? "A" : "B",
          toDeck: timeRemainingA < timeRemainingB ? "B" : "A",
          reason: "Both tracks playing, suggest crossfade",
          priority: "low",
        });
      }
    }

    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }, [playerStates, autoCrossfadeThreshold, minTimeRemaining]);

  return {
    // State
    crossfadeEnabled,
    crossfadeDuration,
    autoCrossfadeThreshold,
    minTimeRemaining,

    // Actions
    toggleCrossfade,
    triggerManualCrossfade,
    setCrossfadeDurationMs,
    setAutoCrossfadeThresholdMs,
    setMinTimeRemainingMs,
    setCrossfadeCooldownMs,

    // Queries
    canCrossfade,
    getCrossfadeSuggestions,

    // Computed values
    crossfadeDurationSeconds: Math.round(crossfadeDuration / 1000),
    autoCrossfadeThresholdSeconds: Math.round(autoCrossfadeThreshold / 1000),
    minTimeRemainingSeconds: Math.round(minTimeRemaining / 1000),
  };
}
