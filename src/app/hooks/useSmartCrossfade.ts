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

  // Keep latest state for the interval callback so the 1s timer isn't reset on every playerStates update (every 250ms)
  const latestRef = useRef({
    playerStates,
    autoCrossfadeThreshold,
    minTimeRemaining,
    crossfadeDuration,
  });
  latestRef.current = {
    playerStates,
    autoCrossfadeThreshold,
    minTimeRemaining,
    crossfadeDuration,
  };

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

  // Run auto-crossfade check with explicit state (called from progress loop with fresh manager state)
  type StatesArg = { A: PlayerInstance; B: PlayerInstance };
  const checkAutoCrossfadeWithState = useCallback(
    (states: StatesArg) => {
      if (!crossfadeEnabled || isCrossfadeActive()) return;

      const now = Date.now();
      const { autoCrossfadeThreshold: threshold, minTimeRemaining: minRem, crossfadeDuration: duration } = latestRef.current;

      if (!hasUserActionRef.current) return;
      if (now - lastCrossfadeTimeRef.current < crossfadeCooldownRef.current) return;

      type Candidate = { fromDeck: "A" | "B"; toDeck: "A" | "B"; timeRemaining: number };
      const candidates: Candidate[] = [];

      for (const deckId of ["A", "B"] as const) {
        const player = states[deckId];
        const otherDeckId = deckId === "A" ? "B" : "A";
        const otherPlayer = states[otherDeckId];

        if (
          player.isReady &&
          player.isPlaying &&
          player.currentTrack &&
          player.duration > 0 &&
          otherPlayer.isReady &&
          otherPlayer.currentTrack
        ) {
          const timeRemaining = player.duration - player.currentTime;
          if (timeRemaining <= threshold && timeRemaining >= minRem) {
            candidates.push({ fromDeck: deckId, toDeck: otherDeckId, timeRemaining });
          }
        }
      }

      if (candidates.length === 0) return;

      const best = candidates.reduce((a, b) =>
        a.timeRemaining <= b.timeRemaining ? a : b
      );

      console.log(
        `🎯 Auto-crossfade triggered for deck ${best.fromDeck} (${Math.round(best.timeRemaining / 1000)}s remaining)`
      );

      startCrossfade(best.fromDeck, best.toDeck, duration)
        .then(() => {
          lastCrossfadeTimeRef.current = now;
          console.log(`✅ Auto-crossfade completed from ${best.fromDeck} to ${best.toDeck}`);
        })
        .catch((error) => {
          console.error(`❌ Auto-crossfade failed:`, error);
        });
    },
    [crossfadeEnabled, isCrossfadeActive, startCrossfade]
  );

  // Keep interval as backup; primary check is via checkAutoCrossfadeWithState from progress loop
  useEffect(() => {
    if (!crossfadeEnabled || isCrossfadeActive()) return;

    const checkForAutoCrossfade = () => {
      checkAutoCrossfadeWithState(latestRef.current.playerStates);
    };

    crossfadeCheckIntervalRef.current = setInterval(checkForAutoCrossfade, 1000);
    return () => {
      if (crossfadeCheckIntervalRef.current) {
        clearInterval(crossfadeCheckIntervalRef.current);
      }
    };
  }, [crossfadeEnabled, isCrossfadeActive, checkAutoCrossfadeWithState]);

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
        (error.message === "SPOTIFY_NO_ACTIVE_DEVICE" ||
          error.message.includes("device not available"))
      ) {
        alert(
          "To play Spotify here, open the Spotify app or spotify.com in another tab, press Play on any track once, then try again."
        );
      } else if (
        error instanceof Error &&
        error.message.includes("Cannot start Spotify playback")
      ) {
        alert(
          "To play Spotify here, open the Spotify app or spotify.com in another tab, press Play on any track once, then try again."
        );
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
    // When user enables auto-crossfade, treat it as user intent so auto-crossfade actually runs
    if (newState) {
      hasUserActionRef.current = true;
    }
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

  // Get crossfade suggestions (when auto-crossfade is OFF, suggest manual; when ON, don't suggest "track ending" since we auto-crossfade)
  const getCrossfadeSuggestions = useCallback(() => {
    const suggestions: Array<{
      fromDeck: "A" | "B";
      toDeck: "A" | "B";
      reason: string;
      priority: "high" | "medium" | "low";
    }> = [];

    const playerA = playerStates.A;
    const playerB = playerStates.B;

    // Only suggest "track ending" when auto-crossfade is disabled; when enabled we auto-crossfade so no suggestion needed
    if (!crossfadeEnabled) {
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
  }, [playerStates, autoCrossfadeThreshold, minTimeRemaining, crossfadeEnabled]);

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

    // Called by progress loop with fresh manager state so auto-crossfade actually fires
    checkAutoCrossfadeWithState,

    // Queries
    canCrossfade,
    getCrossfadeSuggestions,

    // Computed values
    crossfadeDurationSeconds: Math.round(crossfadeDuration / 1000),
    autoCrossfadeThresholdSeconds: Math.round(autoCrossfadeThreshold / 1000),
    minTimeRemainingSeconds: Math.round(minTimeRemaining / 1000),
  };
}
