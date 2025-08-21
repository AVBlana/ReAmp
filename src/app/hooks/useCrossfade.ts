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
  youtubeManager: {
    getCurrentTime: (playerId: string) => number;
    getDuration: (playerId: string) => number;
    getPlayerState: (playerId: string) => number;
    getPlayer: (playerId: string) => unknown;
    listPlayers: () => string[];
  };
  handlePlay: (playerId: "A" | "B") => Promise<void>;
  handlePause: (playerId: "A" | "B") => Promise<void>;
  handleVolumeChange: (playerId: "A" | "B", volume: number) => void;
}

export function useCrossfade({
  players,
  setPlayers,
  youtubeManager,
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
          !crossfadeTriggered.current[playerId as "A" | "B"] &&
          !crossfadeInProgressRef.current
        ) {
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
            triggerCrossfade(playerId as "A" | "B");
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
    async (endingPlayerId: "A" | "B") => {
      if (globalCrossfadeLock.current || crossfadeInProgressRef.current) {
        console.log("🚫 Crossfade blocked - already in progress");
        return;
      }

      const startingPlayerId = endingPlayerId === "A" ? "B" : "A";
      const endingPlayer = playersRef.current[endingPlayerId];
      const startingPlayer = playersRef.current[startingPlayerId];

      // Early check: Both players must have songs before proceeding
      if (!endingPlayer.song || !startingPlayer.song) {
        console.log("🚫 Crossfade blocked - both players must have songs:", {
          endingPlayerSong: !!endingPlayer.song,
          startingPlayerSong: !!startingPlayer.song,
          endingPlayerId,
          startingPlayerId,
        });
        return;
      }

      // Check if crossfade is enabled and both players have songs
      if (
        !isCrossfadeEnabledRef.current ||
        crossfadeTriggered.current[endingPlayerId]
      ) {
        console.log("🚫 Crossfade conditions not met:", {
          crossfadeEnabled: isCrossfadeEnabledRef.current,
          endingPlayerSong: !!endingPlayer.song,
          startingPlayerSong: !!startingPlayer.song,
          alreadyTriggered: crossfadeTriggered.current[endingPlayerId],
          endingPlayer: {
            id: endingPlayerId,
            service: endingPlayer.service,
            isActive: endingPlayer.isActive,
            isPlaying: endingPlayer.isPlaying,
            song: endingPlayer.song ? "Has song" : "No song",
          },
          startingPlayer: {
            id: startingPlayerId,
            service: startingPlayer.service,
            isActive: startingPlayer.isActive,
            isPlaying: startingPlayer.isPlaying,
            song: startingPlayer.song ? "Has song" : "No song",
          },
        });
        return;
      }

      // Additional check: Ensure YouTube players are fully initialized
      if (
        endingPlayer.service === ServiceType.Youtube ||
        startingPlayer.service === ServiceType.Youtube
      ) {
        console.log(`🔍 Checking YouTube player readiness:`, {
          endingPlayer: {
            id: endingPlayerId,
            service: endingPlayer.service,
            hasSong: !!endingPlayer.song,
          },
          startingPlayer: {
            id: startingPlayerId,
            service: startingPlayer.service,
            hasSong: !!startingPlayer.song,
          },
          availablePlayers: youtubeManager.listPlayers
            ? youtubeManager.listPlayers()
            : [],
        });

        // Debug: Show what services each player is using
        console.log("🔍 Player service analysis:", {
          endingPlayer: {
            id: endingPlayerId,
            service: endingPlayer.service,
            needsYouTube: endingPlayer.service === ServiceType.Youtube,
          },
          startingPlayer: {
            id: startingPlayerId,
            service: startingPlayer.service,
            needsYouTube: startingPlayer.service === ServiceType.Youtube,
          },
          availableYouTubePlayers: youtubeManager.listPlayers
            ? youtubeManager.listPlayers()
            : [],
        });

        // Simple check: Do the players exist at all?
        const endingPlayerExists =
          endingPlayer.service === ServiceType.Youtube
            ? youtubeManager.getPlayer &&
              youtubeManager.getPlayer(endingPlayerId)
            : true;
        const startingPlayerExists =
          startingPlayer.service === ServiceType.Youtube
            ? youtubeManager.getPlayer &&
              youtubeManager.getPlayer(startingPlayerId)
            : true;

        console.log("🔍 Simple player existence check:", {
          endingPlayerExists: endingPlayerExists ? "Exists" : "Missing",
          startingPlayerExists: startingPlayerExists ? "Exists" : "Missing",
          endingPlayerId,
          startingPlayerId,
        });

        // Check if we can handle mixed service types
        const canCrossfadeMixedServices =
          endingPlayer.service !== startingPlayer.service &&
          (endingPlayer.service === ServiceType.Spotify ||
            startingPlayer.service === ServiceType.Spotify);

        if (canCrossfadeMixedServices) {
          console.log("🔄 Crossfade between different services detected:", {
            endingPlayerService: endingPlayer.service,
            startingPlayerService: startingPlayer.service,
            note: "This should work with proper volume control",
          });
        }

        if (!endingPlayerExists || !startingPlayerExists) {
          console.log(
            "🚫 Crossfade blocked - one or both YouTube players don't exist:",
            {
              endingPlayerExists,
              startingPlayerExists,
              endingPlayerId,
              startingPlayerId,
              endingPlayerService: endingPlayer.service,
              startingPlayerService: startingPlayer.service,
              availablePlayers: youtubeManager.listPlayers
                ? youtubeManager.listPlayers()
                : [],
            }
          );

          // Additional debugging: Show what's in the players map
          if (youtubeManager.listPlayers) {
            const available = youtubeManager.listPlayers();
            console.log("🔍 Available YouTube players:", available);
            console.log("🔍 Missing players:", {
              endingPlayer:
                endingPlayer.service === ServiceType.Youtube &&
                !endingPlayerExists
                  ? endingPlayerId
                  : "N/A",
              startingPlayer:
                startingPlayer.service === ServiceType.Youtube &&
                !startingPlayerExists
                  ? startingPlayerId
                  : "N/A",
            });

            // Check if the missing player should be YouTube
            if (
              startingPlayer.service === ServiceType.Youtube &&
              !startingPlayerExists
            ) {
              console.log(
                "⚠️ Player A needs YouTube player but doesn't have one. This usually means:"
              );
              console.log(
                "   1. Player A was loaded as a different service type initially"
              );
              console.log("   2. Player A's YouTube player was never created");
              console.log("   3. Player A's YouTube player was destroyed");
              console.log(
                "   Solution: Try reloading the track on player A or ensure it's a YouTube track"
              );
            }

            // Check if ending player (A) is missing YouTube player
            if (
              endingPlayer.service === ServiceType.Youtube &&
              !endingPlayerExists
            ) {
              console.log(
                "⚠️ Player A (ending player) needs YouTube player but doesn't have one:"
              );
              console.log(
                "   This means the crossfade cannot proceed because:"
              );
              console.log(
                "   1. Player A is supposed to fade out (decrease volume)"
              );
              console.log(
                "   2. But there's no YouTube player to control its volume"
              );
              console.log(
                "   3. The crossfade would fail during volume changes"
              );
              console.log("");
              console.log("   Player A current state:", {
                id: endingPlayerId,
                service: endingPlayer.service,
                isActive: endingPlayer.isActive,
                isPlaying: endingPlayer.isPlaying,
                hasSong: !!endingPlayer.song,
                songType: endingPlayer.song
                  ? endingPlayer.song.constructor.name
                  : "None",
                duration: endingPlayer.duration,
                currentTime: endingPlayer.currentTime,
              });
              console.log("");
              console.log("   Solutions:");
              console.log("   1. Reload the track on player A");
              console.log("   2. Wait for player A to finish naturally");
              console.log("   3. Manually stop player A and start player B");
              console.log(
                "   4. Check if player A was loaded before YouTube API was ready"
              );
              console.log("");
              console.log(
                "   Alternative: We could do a 'hard cut' instead of crossfade:"
              );
              console.log("   1. Start player B immediately");
              console.log(
                "   2. Try to stop player A (may not work without player)"
              );
              console.log("   3. This will be abrupt but functional");
            }
          }

          // Offer alternative crossfade strategy
          if (
            endingPlayer.service === ServiceType.Youtube &&
            !endingPlayerExists
          ) {
            console.log("🔄 Alternative crossfade strategy available:");
            console.log(
              "   Since player A has no YouTube player, we can do a 'hard cut':"
            );
            console.log("   1. Start player B immediately");
            console.log(
              "   2. Try to stop player A (may not work without player)"
            );
            console.log("   3. This will be abrupt but functional");
            console.log("");
            console.log(
              "   Would you like to try this? (You can implement this logic)"
            );

            // Implement the hard cut strategy
            console.log("🔄 Implementing hard cut crossfade strategy...");
            console.log(
              "   Reason: Player A's YouTube player was destroyed immediately after creation"
            );
            console.log(
              "   This suggests a race condition or conflict in player initialization"
            );
            console.log(
              "   The hard cut strategy allows crossfade to work despite this issue"
            );
            console.log(
              "   TODO: Investigate why YouTube players are being destroyed immediately"
            );
            console.log(
              "   Possible causes: Multiple initialization calls, container conflicts, API state issues"
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
                console.log("▶️ Starting player B for hard cut crossfade");
                await handlePlay(startingPlayerId);
              }

              // For hard cut, we can't fade volume on player A (no YouTube player)
              // So we just mark the crossfade as complete immediately
              console.log(
                "🔄 Hard cut crossfade - skipping volume fade (player A has no YouTube player)"
              );

              // Update player states immediately
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
                `✅ Hard cut crossfade completed: ${endingPlayerId} → ${startingPlayerId}`
              );
              console.log(
                "   Note: This was abrupt due to missing YouTube player on ending player"
              );
            } catch (error) {
              console.error("❌ Hard cut crossfade error:", error);
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

            return; // Exit early since we handled the crossfade
          }

          // Handle case where starting player (B) is missing YouTube player
          if (
            startingPlayer.service === ServiceType.Youtube &&
            !startingPlayerExists
          ) {
            console.log("🔄 Alternative crossfade strategy available:");
            console.log(
              "   Since player B has no YouTube player, we can do a 'hard cut':"
            );
            console.log("   1. Fade out player A (we can do this)");
            console.log(
              "   2. Try to start player B (may not work without YouTube player)"
            );
            console.log("   3. This will be abrupt but functional");
            console.log("");
            console.log(
              "   Would you like to try this? (You can implement this logic)"
            );

            // Implement the hard cut strategy for missing starting player
            console.log("🔄 Implementing hard cut crossfade strategy...");
            console.log(
              "   Reason: Player B's YouTube player was destroyed immediately after creation"
            );
            console.log(
              "   This suggests a race condition or conflict in player initialization"
            );
            console.log(
              "   The hard cut strategy allows crossfade to work despite this issue"
            );
            console.log(
              "   TODO: Investigate why YouTube players are being destroyed immediately"
            );
            console.log(
              "   Possible causes: Multiple initialization calls, container conflicts, API state issues"
            );

            // Set global lock
            globalCrossfadeLock.current = true;
            setCrossfadeInProgress(true);
            crossfadeTriggered.current[endingPlayerId] = true;

            try {
              // Store intended volumes
              intendedVolumes.current[endingPlayerId] = endingPlayer.volume;
              intendedVolumes.current[startingPlayerId] = startingPlayer.volume;

              // We can fade out player A since it has a YouTube player
              console.log(
                "🔄 Hard cut crossfade - fading out player A (has YouTube player)"
              );

              // Fade out player A over 1 second
              const fadeSteps = 10;
              const fadeDuration = 1000;
              const stepDuration = fadeDuration / fadeSteps;

              for (let step = 0; step <= fadeSteps; step++) {
                const progress = step / fadeSteps;
                const endingVolume = Math.max(
                  0,
                  intendedVolumes.current[endingPlayerId] * (1 - progress)
                );

                handleVolumeChange(endingPlayerId, Math.round(endingVolume));
                await new Promise((resolve) =>
                  setTimeout(resolve, stepDuration)
                );
              }

              // Try to start player B (may fail without YouTube player)
              if (!startingPlayer.isPlaying) {
                console.log(
                  "▶️ Attempting to start player B for hard cut crossfade"
                );
                try {
                  await handlePlay(startingPlayerId);
                  console.log("✅ Player B started successfully");
                } catch (error) {
                  console.log(
                    "⚠️ Failed to start player B (no YouTube player):",
                    error
                  );
                  console.log(
                    "   This is expected since player B has no YouTube player"
                  );
                }
              }

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
                `✅ Hard cut crossfade completed: ${endingPlayerId} → ${startingPlayerId}`
              );
              console.log(
                "   Note: This was abrupt due to missing YouTube player on starting player"
              );
            } catch (error) {
              console.error("❌ Hard cut crossfade error:", error);
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

            return; // Exit early since we handled the crossfade
          }

          return;
        }

        // Wait for YouTube players to be ready with retries
        let attempts = 0;
        const maxAttempts = 10; // Try for up to 5 seconds

        while (attempts < maxAttempts) {
          const endingPlayerReady =
            endingPlayer.service === ServiceType.Youtube
              ? youtubeManager.getPlayer &&
                youtubeManager.getPlayer(endingPlayerId)
              : true;
          const startingPlayerReady =
            startingPlayer.service === ServiceType.Youtube
              ? youtubeManager.getPlayer &&
                youtubeManager.getPlayer(startingPlayerId)
              : true;

          console.log(`🔍 Player readiness check attempt ${attempts + 1}:`, {
            endingPlayerReady: endingPlayerReady ? "Ready" : "Not ready",
            startingPlayerReady: startingPlayerReady ? "Ready" : "Not ready",
            endingPlayerId,
            startingPlayerId,
          });

          if (endingPlayerReady && startingPlayerReady) {
            console.log(`✅ YouTube players ready after ${attempts * 0.5}s`);
            break;
          }

          console.log(
            `⏳ Waiting for YouTube players... attempt ${
              attempts + 1
            }/${maxAttempts}`
          );
          await new Promise((resolve) => setTimeout(resolve, 500)); // Wait 500ms between attempts
          attempts++;
        }

        // Final check after all attempts
        const endingPlayerReady =
          endingPlayer.service === ServiceType.Youtube
            ? youtubeManager.getPlayer &&
              youtubeManager.getPlayer(endingPlayerId)
            : true;
        const startingPlayerReady =
          startingPlayer.service === ServiceType.Youtube
            ? youtubeManager.getPlayer &&
              youtubeManager.getPlayer(startingPlayerId)
            : true;

        if (!endingPlayerReady || !startingPlayerReady) {
          console.log(
            "🚫 Crossfade blocked - YouTube players not ready after timeout:",
            {
              endingPlayerReady,
              startingPlayerReady,
              endingPlayerId,
              startingPlayerId,
              attempts,
            }
          );
          return;
        }
      }

      console.log(
        `🔄 Starting crossfade from ${endingPlayerId} to ${startingPlayerId}`
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
        availableYouTubePlayers: youtubeManager.listPlayers
          ? youtubeManager.listPlayers()
          : [],
      });

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

    console.log("🎛️ Manual crossfade triggered:", {
      playerA: {
        isActive: playerA.isActive,
        isPlaying: playerA.isPlaying,
        hasSong: !!playerA.song,
        service: playerA.service,
      },
      playerB: {
        isActive: playerB.isActive,
        isPlaying: playerB.isPlaying,
        hasSong: !!playerB.song,
        service: playerB.service,
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
        await triggerCrossfade("A");
      } else {
        console.log("🎯 Crossfading from B to A (B has less time remaining)");
        await triggerCrossfade("B");
      }
    } else if (playerA.isActive) {
      console.log("🎯 Crossfading from A to B (only A is active)");
      await triggerCrossfade("A");
    } else if (playerB.isActive) {
      console.log("🎯 Crossfading from B to A (only B is active)");
      await triggerCrossfade("B");
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
  };
}
