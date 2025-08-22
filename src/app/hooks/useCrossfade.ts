import { useState, useRef, useCallback, useEffect } from "react";
import { ServiceType, Song } from "@/app/types/playerTypes";
import { YoutubeVideo } from "@/app/types/youtubeTypes";

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

interface UseCrossfadeProps {
  players: {
    A: DJPlayerState;
    B: DJPlayerState;
  };
  setPlayers: React.Dispatch<
    React.SetStateAction<{
      A: DJPlayerState;
      B: DJPlayerState;
    }>
  >;
  handlePlay: (playerId: "A" | "B") => Promise<void>;
  handlePause: (playerId: "A" | "B") => Promise<void>;
  handleVolumeChange: (playerId: "A" | "B", volume: number) => void;
}

export function useCrossfade({
  players,
  setPlayers,
  handlePlay,
  handlePause,
  handleVolumeChange,
}: UseCrossfadeProps) {
  const [crossfade, setCrossfade] = useState(0);
  const [isCrossfadeEnabled, setIsCrossfadeEnabled] = useState(false);
  const [crossfadeInProgress, setCrossfadeInProgress] = useState(false);

  // Track which players have already triggered crossfade to prevent re-triggering
  const crossfadeTriggered = useRef<{
    A: boolean;
    B: boolean;
  }>({
    A: false,
    B: false,
  });

  // Track when players were last destroyed to prevent crossfade during recreation
  const playerDestroyedTime = useRef<{
    A: number;
    B: number;
  }>({
    A: 0,
    B: 0,
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

  // Add function to check if crossfade should be considered complete
  const checkCrossfadeCompletion = useCallback(() => {
    // If crossfade state is true but no actual crossfade is happening, reset it
    if (crossfadeInProgress && !globalCrossfadeLock.current) {
      console.log("🔄 Crossfade state cleanup - no actual crossfade happening");
      setCrossfadeInProgress(false);
      setCrossfade(0);
      crossfadeInProgressRef.current = false;
      return true;
    }

    // If crossfade has been in progress for too long, force reset
    if (crossfadeInProgress && crossfade > 0) {
      const timeSinceLastUpdate =
        Date.now() - (crossfadeRef.current as number) || 0;
      if (timeSinceLastUpdate > 10000) {
        // 10 seconds timeout
        console.log("🔄 Crossfade timeout detected, forcing reset");
        // Use a simple reset instead of the function to avoid dependency issues
        setCrossfadeInProgress(false);
        setCrossfade(0);
        globalCrossfadeLock.current = false;
        crossfadeInProgressRef.current = false;
        crossfadeTriggered.current.A = false;
        crossfadeTriggered.current.B = false;
        return true;
      }
    }

    return false;
  }, [crossfadeInProgress, crossfade]);

  // Add automatic crossfade detection
  useEffect(() => {
    if (!isCrossfadeEnabled) return;

    const checkForCrossfade = () => {
      const currentPlayers = playersRef.current;

      // Check if any player is about to end (within 8 seconds, but at least 2 seconds remaining)
      const crossfadeThreshold = 8000; // 8 seconds
      const minTimeRemaining = 2000; // 2 seconds minimum

      ["A", "B"].forEach((playerId) => {
        const player = currentPlayers[playerId as "A" | "B"];
        const otherPlayerId = playerId === "A" ? "B" : "A";
        const otherPlayer = currentPlayers[otherPlayerId as "A" | "B"];

        // Only trigger crossfade if BOTH players have songs and are ready
        if (
          player.isActive &&
          player.isPlaying &&
          player.song &&
          player.duration > 0 &&
          otherPlayer.song && // Ensure other player also has a song
          otherPlayer.isActive && // Ensure other player is also active
          otherPlayer.duration > 0 && // Ensure other player has valid duration
          !crossfadeTriggered.current[playerId as "A" | "B"] &&
          !crossfadeInProgressRef.current
        ) {
          // Additional checks for auto-crossfade
          const now = Date.now();
          const recentlyDestroyed = 20000; // 20 seconds

          // Check if either player was recently destroyed
          if (
            now - playerDestroyedTime.current[playerId as "A" | "B"] <
            recentlyDestroyed
          ) {
            console.log(
              `🚫 Auto-crossfade blocked - player ${playerId} was recently destroyed`
            );
            return;
          }

          if (
            now - playerDestroyedTime.current[otherPlayerId as "A" | "B"] <
            recentlyDestroyed
          ) {
            console.log(
              `🚫 Auto-crossfade blocked - player ${otherPlayerId} was recently destroyed`
            );
            return;
          }

          const timeRemaining = player.duration - player.currentTime;

          if (
            timeRemaining <= crossfadeThreshold &&
            timeRemaining >= minTimeRemaining
          ) {
            console.log(
              `🎯 Auto-triggering crossfade for ${playerId} (${Math.round(
                timeRemaining / 1000
              )}s remaining) - Other player: ${otherPlayerId} has song: ${!!otherPlayer.song}`
            );
            triggerCrossfade(playerId as "A" | "B", false); // Auto-crossfade
          }
        }
      });
    };

    const interval = setInterval(checkForCrossfade, 1000); // Check every second

    return () => clearInterval(interval);
  }, [isCrossfadeEnabled]);

  // Add crossfade state cleanup effect
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      checkCrossfadeCompletion();
    }, 2000); // Check every 2 seconds

    return () => clearInterval(cleanupInterval);
  }, [checkCrossfadeCompletion]);

  const triggerCrossfade = useCallback(
    async (endingPlayerId: "A" | "B", isManualCrossfade: boolean = false) => {
      if (globalCrossfadeLock.current || crossfadeInProgressRef.current) {
        console.log("🚫 Crossfade blocked - already in progress");
        return;
      }

      const startingPlayerId = endingPlayerId === "A" ? "B" : "A";
      const endingPlayer = playersRef.current[endingPlayerId];
      const startingPlayer = playersRef.current[startingPlayerId];

      // Enhanced validation - check if both players are actually ready
      if (!endingPlayer.song || !startingPlayer.song) {
        console.log("🚫 Crossfade blocked - both players must have songs");
        return;
      }

      if (!isCrossfadeEnabledRef.current) {
        console.log("🚫 Crossfade blocked - not enabled");
        return;
      }

      // Check if both players are actually active and ready for crossfade
      if (!endingPlayer.isActive || !startingPlayer.isActive) {
        console.log("🚫 Crossfade blocked - both players must be active", {
          endingPlayerActive: endingPlayer.isActive,
          startingPlayerActive: startingPlayer.isActive,
        });
        return;
      }

      // Additional check: ensure both players have valid duration and current time
      if (endingPlayer.duration <= 0 || startingPlayer.duration <= 0) {
        console.log(
          "🚫 Crossfade blocked - both players must have valid duration",
          {
            endingPlayerDuration: endingPlayer.duration,
            startingPlayerDuration: startingPlayer.duration,
          }
        );
        return;
      }

      // Check if either player is currently loading or initializing
      // Only block if the player has been at 0 time for too long (indicating loading)

      // Check if ending player is stuck at 0 time for too long
      if (endingPlayer.currentTime === 0 && endingPlayer.duration > 0) {
        // Simple check: if duration is valid and player is active, it's probably ready
        if (endingPlayer.duration > 1000 && endingPlayer.isActive) {
          // Player seems ready, allow crossfade
        } else {
          console.log(
            "🚫 Crossfade blocked - ending player is still loading/initializing"
          );
          return;
        }
      }

      if (startingPlayer.currentTime === 0 && startingPlayer.duration > 0) {
        // Simple check: if duration is valid and player is active, it's probably ready
        if (startingPlayer.duration > 1000 && startingPlayer.isActive) {
          // Player seems ready, allow crossfade
        } else {
          console.log(
            "🚫 Crossfade blocked - starting player is still loading/initializing"
          );
          return;
        }
      }

      // Check if either player was recently destroyed (within last 20 seconds)
      const now = Date.now();
      const recentlyDestroyed = 20000; // 20 seconds

      if (
        now - playerDestroyedTime.current[endingPlayerId] <
        recentlyDestroyed
      ) {
        console.log(
          "🚫 Crossfade blocked - ending player was recently destroyed"
        );
        return;
      }

      if (
        now - playerDestroyedTime.current[startingPlayerId] <
        recentlyDestroyed
      ) {
        console.log(
          "🚫 Crossfade blocked - starting player was recently destroyed"
        );
        return;
      }

      console.log(
        `🔄 Starting ${
          isManualCrossfade ? "MANUAL" : "AUTO"
        }-crossfade from ${endingPlayerId} to ${startingPlayerId}`
      );
      console.log("🎯 Crossfade details:", {
        endingPlayer: {
          id: endingPlayerId,
          service: endingPlayer.service,
          isActive: endingPlayer.isActive,
          isPlaying: endingPlayer.isPlaying,
          volume: endingPlayer.volume,
        },
        startingPlayer: {
          id: startingPlayerId,
          service: startingPlayer.service,
          isActive: startingPlayer.isActive,
          isPlaying: startingPlayer.isPlaying,
          volume: startingPlayer.volume,
        },
      });

      // Set crossfade state
      globalCrossfadeLock.current = true;
      setCrossfadeInProgress(true);
      crossfadeTriggered.current[endingPlayerId] = true;

      try {
        // Store intended volumes
        intendedVolumes.current[endingPlayerId] = endingPlayer.volume;
        intendedVolumes.current[startingPlayerId] = startingPlayer.volume;

        // Start the starting player if not already playing
        if (!startingPlayer.isPlaying) {
          await handlePlay(startingPlayerId);
        }

        // Simple crossfade: fade out ending player, fade in starting player
        const crossfadeSteps = 10;
        const crossfadeDuration = 2000; // 2 seconds
        const stepDuration = crossfadeDuration / crossfadeSteps;

        for (let step = 0; step <= crossfadeSteps; step++) {
          const progress = step / crossfadeSteps;

          // Calculate volumes
          const endingVolume = Math.max(
            0,
            intendedVolumes.current[endingPlayerId] * (1 - progress)
          );
          const startingVolume = Math.min(
            100,
            intendedVolumes.current[startingPlayerId] * progress
          );

          // Update volumes
          console.log(
            `🔊 Crossfade step ${step}: ${endingPlayerId} volume ${Math.round(
              endingVolume
            )}, ${startingPlayerId} volume ${Math.round(startingVolume)}`
          );
          handleVolumeChange(endingPlayerId, Math.round(endingVolume));
          handleVolumeChange(startingPlayerId, Math.round(startingVolume));

          // Update crossfade state
          setCrossfade(progress * 100);

          // Wait for next step
          await new Promise((resolve) => setTimeout(resolve, stepDuration));
        }

        // Stop the ending player
        await handlePause(endingPlayerId);

        // Small delay to ensure pause takes effect
        await new Promise((resolve) => setTimeout(resolve, 200));

        // Reset volumes to intended levels
        handleVolumeChange(
          startingPlayerId,
          intendedVolumes.current[startingPlayerId]
        );

        // Update player states based on crossfade type
        if (isManualCrossfade) {
          // For manual crossfade, keep both players active but stop the ending one
          setPlayers((prev) => ({
            ...prev,
            [endingPlayerId]: {
              ...prev[endingPlayerId],
              isPlaying: false,
              volume: intendedVolumes.current[endingPlayerId],
            },
            [startingPlayerId]: {
              ...prev[startingPlayerId],
              volume: intendedVolumes.current[startingPlayerId],
            },
          }));
        } else {
          // For auto-crossfade, mark ending player as inactive
          setPlayers((prev) => ({
            ...prev,
            [endingPlayerId]: {
              ...prev[endingPlayerId],
              isActive: false,
              isPlaying: false,
              volume: intendedVolumes.current[endingPlayerId],
            },
            [startingPlayerId]: {
              ...prev[startingPlayerId],
              isActive: true,
              volume: intendedVolumes.current[startingPlayerId],
            },
          }));
        }

        // Small delay to ensure player states are stable
        await new Promise((resolve) => setTimeout(resolve, 300));

        console.log(
          `✅ ${
            isManualCrossfade ? "MANUAL" : "AUTO"
          }-crossfade completed: ${endingPlayerId} → ${startingPlayerId}`
        );
      } catch (error) {
        console.error("❌ Crossfade error:", error);
      } finally {
        // Reset locks and state
        globalCrossfadeLock.current = false;
        setCrossfadeInProgress(false);
        setCrossfade(0);

        // Reset crossfade triggers after a delay
        setTimeout(() => {
          crossfadeTriggered.current[endingPlayerId] = false;
        }, 5000);
      }
    },
    [handlePlay, handlePause, handleVolumeChange, setPlayers]
  );

  const handleCrossfade = useCallback(async () => {
    if (crossfadeInProgressRef.current) {
      console.log("🚫 Crossfade already in progress");
      return;
    }

    const playerA = playersRef.current.A;
    const playerB = playersRef.current.B;

    console.log("🎛️ Manual crossfade triggered:", {
      playerA: {
        isActive: playerA.isActive,
        isPlaying: playerA.isPlaying,
        hasSong: !!playerA.song,
        service: playerA.service,
        volume: playerA.volume,
        duration: playerA.duration,
        currentTime: playerA.currentTime,
      },
      playerB: {
        isActive: playerB.isActive,
        isPlaying: playerB.isPlaying,
        hasSong: !!playerB.song,
        service: playerB.service,
        volume: playerB.volume,
        duration: playerB.duration,
        currentTime: playerB.currentTime,
      },
    });

    // Determine which player is ending based on current state
    if (playerA.isActive && playerB.isActive) {
      // Both active - determine based on time remaining
      const timeRemainingA = playerA.duration - playerA.currentTime;
      const timeRemainingB = playerB.duration - playerB.currentTime;

      console.log("🔄 Both players active, determining crossfade direction:", {
        timeRemainingA: Math.round(timeRemainingA / 1000) + "s",
        timeRemainingB: Math.round(timeRemainingB / 1000) + "s",
      });

      if (timeRemainingA < timeRemainingB) {
        console.log("🎯 Crossfading from A to B (A has less time remaining)");
        await triggerCrossfade("A", true); // Manual crossfade
      } else {
        console.log("🎯 Crossfading from B to A (B has less time remaining)");
        await triggerCrossfade("B", true); // Manual crossfade
      }
    } else if (playerA.isActive) {
      console.log("🎯 Crossfading from A to B (only A is active)");
      await triggerCrossfade("A", true); // Manual crossfade
    } else if (playerB.isActive) {
      console.log("🎯 Crossfading from B to A (only B is active)");
      await triggerCrossfade("B", true); // Manual crossfade
    } else {
      console.log("🚫 No active players to crossfade");
    }
  }, [triggerCrossfade]);

  const resetCrossfade = useCallback(() => {
    setCrossfade(0);
    setCrossfadeInProgress(false);
    globalCrossfadeLock.current = false;
    crossfadeTriggered.current.A = false;
    crossfadeTriggered.current.B = false;
  }, []);

  const toggleCrossfade = useCallback(() => {
    const newState = !isCrossfadeEnabled;
    setIsCrossfadeEnabled(newState);
    console.log(`🎛️ Crossfade ${newState ? "ENABLED" : "DISABLED"}`);

    if (isCrossfadeEnabled) {
      // If disabling, reset any ongoing crossfade
      console.log("🔄 Resetting crossfade state");
      resetCrossfade();
    }
  }, [isCrossfadeEnabled, resetCrossfade]);

  // Add function to check if crossfade is in progress (for external use)
  const isCrossfadeInProgress = useCallback(() => {
    // Check both the state and the ref to ensure consistency
    const refState =
      crossfadeInProgressRef.current || globalCrossfadeLock.current;
    const stateState = crossfadeInProgress;

    // If there's a mismatch, reset the ref to match the state
    if (refState !== stateState) {
      console.log("🔄 Crossfade state mismatch detected, resetting refs:", {
        refState,
        stateState,
        crossfadeInProgressRef: crossfadeInProgressRef.current,
        globalCrossfadeLock: globalCrossfadeLock.current,
      });
      crossfadeInProgressRef.current = stateState;
      globalCrossfadeLock.current = false;
    }

    // Additional check: If crossfade state is true but no actual crossfade is happening, reset it
    if (stateState && !globalCrossfadeLock.current) {
      console.log("🔄 Crossfade state cleanup - no actual crossfade happening");
      setCrossfadeInProgress(false);
      crossfadeInProgressRef.current = false;
      return false;
    }

    return stateState;
  }, [crossfadeInProgress]);

  // Add function to prevent song drops during crossfade
  const canDropSong = useCallback(
    (playerId: "A" | "B") => {
      if (isCrossfadeInProgress()) {
        console.log(
          `🚫 Cannot drop song on ${playerId} - crossfade in progress`
        );
        return false;
      }
      return true;
    },
    [isCrossfadeInProgress]
  );

  // Add function to safely handle song drops with crossfade protection
  const safeSongDrop = useCallback(
    (playerId: "A" | "B") => {
      if (isCrossfadeInProgress()) {
        console.log(
          `🚫 Song drop blocked on ${playerId} - crossfade in progress`
        );
        return {
          success: false,
          reason: "Crossfade in progress",
          message:
            "Please wait for the current crossfade to complete before dropping a new song.",
        };
      }

      console.log(
        `✅ Song drop allowed on ${playerId} - no crossfade in progress`
      );
      return {
        success: true,
        reason: "No crossfade in progress",
        message: "Song drop allowed",
      };
    },
    [isCrossfadeInProgress]
  );

  // Add function to reset crossfade state for a specific deck when song is replaced
  const resetCrossfadeForDeck = useCallback(
    (playerId: "A" | "B") => {
      console.log(
        `🔄 Resetting crossfade state for deck ${playerId} due to song replacement`
      );

      // Reset crossfade triggers for this deck
      crossfadeTriggered.current[playerId] = false;

      // If this deck was part of an ongoing crossfade, reset the entire crossfade
      if (crossfadeInProgress && globalCrossfadeLock.current) {
        console.log(
          `🔄 Resetting entire crossfade due to song replacement on ${playerId}`
        );
        setCrossfadeInProgress(false);
        setCrossfade(0);
        globalCrossfadeLock.current = false;
        crossfadeInProgressRef.current = false;
        crossfadeTriggered.current.A = false;
        crossfadeTriggered.current.B = false;
      }
    },
    [crossfadeInProgress]
  );

  // Add function to mark when a player is destroyed to prevent crossfade during recreation
  const markPlayerDestroyed = useCallback((playerId: "A" | "B") => {
    console.log(`🗑️ Marking player ${playerId} as recently destroyed`);
    playerDestroyedTime.current[playerId] = Date.now();

    // Also reset crossfade triggers for this player
    crossfadeTriggered.current[playerId] = false;
  }, []);

  return {
    crossfade,
    isCrossfadeEnabled,
    crossfadeInProgress,
    setCrossfade,
    setIsCrossfadeEnabled,
    toggleCrossfade,
    triggerCrossfade,
    handleCrossfade,
    resetCrossfade,
    crossfadeTriggered: crossfadeTriggered.current,
    globalCrossfadeLock: globalCrossfadeLock.current,
    intendedVolumes: intendedVolumes.current,
    isCrossfadeInProgress,
    canDropSong,
    safeSongDrop,
    checkCrossfadeCompletion,
    resetCrossfadeForDeck,
    markPlayerDestroyed,
  };
}
