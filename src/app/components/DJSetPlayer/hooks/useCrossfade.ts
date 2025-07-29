import { useState, useRef, useCallback } from "react";
import { ServiceType, Song } from "@/types/playerTypes";
import { YoutubeVideo } from "../../Services/YtService";

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
  youtubeManager: any;
  spotifyManager: any;
  handlePlay: (playerId: "A" | "B") => Promise<void>;
  handlePause: (playerId: "A" | "B") => Promise<void>;
  handleVolumeChange: (playerId: "A" | "B", volume: number) => void;
}

export function useCrossfade({
  players,
  setPlayers,
  youtubeManager,
  spotifyManager,
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

  const triggerCrossfade = useCallback(
    async (endingPlayerId: "A" | "B") => {
      if (globalCrossfadeLock.current || crossfadeInProgressRef.current) {
        console.log("🚫 Crossfade blocked - already in progress");
        return;
      }

      const startingPlayerId = endingPlayerId === "A" ? "B" : "A";
      const endingPlayer = playersRef.current[endingPlayerId];
      const startingPlayer = playersRef.current[startingPlayerId];

      // Check if crossfade is enabled and both players have songs
      if (
        !isCrossfadeEnabledRef.current ||
        !endingPlayer.song ||
        !startingPlayer.song ||
        crossfadeTriggered.current[endingPlayerId]
      ) {
        console.log("🚫 Crossfade conditions not met");
        return;
      }

      console.log(
        `🔄 Starting crossfade from ${endingPlayerId} to ${startingPlayerId}`
      );

      // Set global lock
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

        // Gradually decrease ending player volume and increase starting player volume
        const crossfadeSteps = 20; // 20 steps for smooth transition
        const crossfadeDuration = 3000; // 3 seconds
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
            intendedVolumes.current[startingPlayerId] +
              intendedVolumes.current[endingPlayerId] * progress
          );

          // Update volumes
          handleVolumeChange(endingPlayerId, Math.round(endingVolume));
          handleVolumeChange(startingPlayerId, Math.round(startingVolume));

          // Update crossfade state
          setCrossfade(progress * 100);

          // Wait for next step
          await new Promise((resolve) => setTimeout(resolve, stepDuration));
        }

        // Stop the ending player
        await handlePause(endingPlayerId);

        // Reset volumes to intended levels
        handleVolumeChange(
          startingPlayerId,
          intendedVolumes.current[startingPlayerId]
        );

        // Update player states
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

        console.log(
          `✅ Crossfade completed: ${endingPlayerId} → ${startingPlayerId}`
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

    // Determine which player is ending based on current state
    if (playerA.isActive && playerB.isActive) {
      // Both active - determine based on time remaining
      const timeRemainingA = playerA.duration - playerA.currentTime;
      const timeRemainingB = playerB.duration - playerB.currentTime;

      if (timeRemainingA < timeRemainingB) {
        await triggerCrossfade("A");
      } else {
        await triggerCrossfade("B");
      }
    } else if (playerA.isActive) {
      await triggerCrossfade("A");
    } else if (playerB.isActive) {
      await triggerCrossfade("B");
    }
  }, [triggerCrossfade]);

  const resetCrossfade = useCallback(() => {
    setCrossfade(0);
    setCrossfadeInProgress(false);
    globalCrossfadeLock.current = false;
    crossfadeTriggered.current.A = false;
    crossfadeTriggered.current.B = false;
  }, []);

  return {
    crossfade,
    isCrossfadeEnabled,
    crossfadeInProgress,
    setCrossfade,
    setIsCrossfadeEnabled,
    triggerCrossfade,
    handleCrossfade,
    resetCrossfade,
    crossfadeTriggered: crossfadeTriggered.current,
    globalCrossfadeLock: globalCrossfadeLock.current,
    intendedVolumes: intendedVolumes.current,
  };
}
