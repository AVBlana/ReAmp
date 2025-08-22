import { useCallback } from "react";
import { ServiceType, Song } from "@/app/types/playerTypes";
import { YoutubeVideo } from "@/app/types/youtubeTypes";
import { YouTubePlayerManager } from "@/app/managers/YouTubePlayerManager";
import { SpotifyPlayerManager } from "@/app/managers/SpotifyPlayerManager";

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

interface UsePlayerControlsProps {
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
  youtubeManager: YouTubePlayerManager;
  spotifyManager: SpotifyPlayerManager;
}

export function usePlayerControls({
  players,
  setPlayers,
  youtubeManager,
  spotifyManager,
}: UsePlayerControlsProps) {
  const handlePlay = useCallback(
    async (playerId: "A" | "B") => {
      const player = players[playerId];

      if (!player.song || !player.service) {
        console.warn(`⚠️ No song or service for player ${playerId}`);
        return;
      }

      try {
        if (player.service === ServiceType.Youtube) {
          // Check if YouTube player is ready before attempting to play
          if (!youtubeManager.isPlayerReady(playerId)) {
            console.warn(
              `⚠️ YouTube player ${playerId} not ready yet. Please wait for initialization to complete.`
            );

            // Wait a bit and try again instead of just returning
            await new Promise((resolve) => setTimeout(resolve, 500));
            if (!youtubeManager.isPlayerReady(playerId)) {
              console.error(
                `❌ YouTube player ${playerId} still not ready after waiting`
              );
              return;
            }
          }

          youtubeManager.playPlayer(playerId);
        } else if (player.service === ServiceType.Spotify) {
          const trackId = (player.song as Song).id;
          await spotifyManager.playTrack(playerId, trackId);
        }

        setPlayers((prev) => ({
          ...prev,
          [playerId]: {
            ...prev[playerId],
            isPlaying: true,
          },
        }));

        console.log(`▶️ Started playing on ${playerId}`);
      } catch (error) {
        console.error(`❌ Error playing on ${playerId}:`, error);
      }
    },
    [players, youtubeManager, spotifyManager, setPlayers]
  );

  const handlePause = useCallback(
    async (playerId: "A" | "B") => {
      const player = players[playerId];

      if (!player.song || !player.service) {
        console.warn(`⚠️ No song or service for player ${playerId}`);
        return;
      }

      try {
        if (player.service === ServiceType.Youtube) {
          // Check if YouTube player is ready before attempting to pause
          if (!youtubeManager.isPlayerReady(playerId)) {
            console.warn(
              `⚠️ YouTube player ${playerId} not ready yet. Please wait for initialization to complete.`
            );
            return;
          }

          youtubeManager.pausePlayer(playerId);
        } else if (player.service === ServiceType.Spotify) {
          await spotifyManager.pausePlayer(playerId);
        }

        setPlayers((prev) => ({
          ...prev,
          [playerId]: {
            ...prev[playerId],
            isPlaying: false,
          },
        }));

        console.log(`⏸️ Paused ${playerId}`);
      } catch (error) {
        console.error(`❌ Error pausing ${playerId}:`, error);
      }
    },
    [players, youtubeManager, spotifyManager, setPlayers]
  );

  const handleStop = useCallback(
    async (playerId: "A" | "B") => {
      const player = players[playerId];

      if (!player.song || !player.service) {
        console.warn(`⚠️ No song or service for player ${playerId}`);
        return;
      }

      try {
        if (player.service === ServiceType.Youtube) {
          // Check if YouTube player is ready before attempting to stop
          if (!youtubeManager.isPlayerReady(playerId)) {
            console.warn(
              `⚠️ YouTube player ${playerId} not ready yet. Please wait for initialization to complete.`
            );
            return;
          }

          youtubeManager.stopPlayer(playerId);
        } else if (player.service === ServiceType.Spotify) {
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

        console.log(`⏹️ Stopped ${playerId}`);
      } catch (error) {
        console.error(`❌ Error stopping ${playerId}:`, error);
      }
    },
    [players, youtubeManager, spotifyManager, setPlayers]
  );

  const handleVolumeChange = useCallback(
    (playerId: "A" | "B", volume: number) => {
      const player = players[playerId];

      if (!player.song || !player.service) {
        console.warn(`⚠️ No song or service for player ${playerId}`);
        return;
      }

      try {
        if (player.service === ServiceType.Youtube) {
          // Check if YouTube player is ready before attempting to change volume
          if (!youtubeManager.isPlayerReady(playerId)) {
            console.warn(
              `⚠️ YouTube player ${playerId} not ready yet. Please wait for initialization to complete.`
            );
            return;
          }

          youtubeManager.setVolume(playerId, volume);
        } else if (player.service === ServiceType.Spotify) {
          spotifyManager.setVolume(playerId, volume);
        }

        setPlayers((prev) => ({
          ...prev,
          [playerId]: {
            ...prev[playerId],
            volume,
          },
        }));

        console.log(`🔊 Volume changed on ${playerId} to ${volume}`);
      } catch (error) {
        console.error(`❌ Error changing volume on ${playerId}:`, error);
      }
    },
    [players, youtubeManager, spotifyManager, setPlayers]
  );

  const handleMuteToggle = useCallback(
    (playerId: "A" | "B") => {
      const player = players[playerId];

      if (!player.song || !player.service) {
        console.warn(`⚠️ No song or service for player ${playerId}`);
        return;
      }

      const newMutedState = !player.isMuted;
      const newVolume = newMutedState ? 0 : player.volume;

      try {
        if (player.service === ServiceType.Youtube) {
          youtubeManager.setVolume(playerId, newVolume);
        } else if (player.service === ServiceType.Spotify) {
          spotifyManager.setVolume(playerId, newVolume);
        }

        setPlayers((prev) => ({
          ...prev,
          [playerId]: {
            ...prev[playerId],
            isMuted: newMutedState,
            volume: newVolume,
          },
        }));

        console.log(
          `${newMutedState ? "🔇" : "🔊"} ${playerId} ${
            newMutedState ? "muted" : "unmuted"
          }`
        );
      } catch (error) {
        console.error(`❌ Error toggling mute for ${playerId}:`, error);
      }
    },
    [players, youtubeManager, spotifyManager, setPlayers]
  );

  const handleScratch = useCallback(
    async (playerId: "A" | "B", direction: "forward" | "backward") => {
      const player = players[playerId];

      if (!player.song || !player.service) {
        console.warn(`⚠️ No song or service for player ${playerId}`);
        return;
      }

      try {
        const currentTime = player.currentTime;
        const duration = player.duration;
        const scratchAmount = 10000; // 10 seconds

        let newTime: number;

        if (direction === "forward") {
          newTime = Math.min(duration, currentTime + scratchAmount);
        } else {
          newTime = Math.max(0, currentTime - scratchAmount);
        }

        if (player.service === ServiceType.Youtube) {
          // Check if YouTube player is ready before attempting to scratch
          if (!youtubeManager.isPlayerReady(playerId)) {
            console.warn(
              `⚠️ YouTube player ${playerId} not ready yet. Please wait for initialization to complete.`
            );
            return;
          }

          youtubeManager.seekPlayer(playerId, newTime / 1000);
        } else if (player.service === ServiceType.Spotify) {
          const spotifyPlayer = spotifyManager.getPlayer(playerId);
          if (spotifyPlayer && typeof spotifyPlayer.seek === "function") {
            await spotifyPlayer.seek(newTime);
          }
        }

        setPlayers((prev) => ({
          ...prev,
          [playerId]: {
            ...prev[playerId],
            currentTime: newTime,
          },
        }));

        console.log(
          `⏩ Scratched ${playerId} ${direction} to ${Math.round(
            newTime / 1000
          )}s`
        );
      } catch (error) {
        console.error(`❌ Error scratching ${playerId}:`, error);
      }
    },
    [players, youtubeManager, spotifyManager, setPlayers]
  );

  const handleSeek = useCallback(
    async (playerId: "A" | "B", position: number) => {
      const player = players[playerId];

      if (!player.song || !player.service) {
        console.warn(`⚠️ No song or service for player ${playerId}`);
        return;
      }

      try {
        if (player.service === ServiceType.Youtube) {
          // Check if YouTube player is ready before attempting to seek
          if (!youtubeManager.isPlayerReady(playerId)) {
            console.warn(
              `⚠️ YouTube player ${playerId} not ready yet. Please wait for initialization to complete.`
            );
            return;
          }

          youtubeManager.seekPlayer(playerId, position / 1000);
        } else if (player.service === ServiceType.Spotify) {
          const spotifyPlayer = spotifyManager.getPlayer(playerId);
          if (spotifyPlayer && typeof spotifyPlayer.seek === "function") {
            await spotifyPlayer.seek(position);
          }
        }

        setPlayers((prev) => ({
          ...prev,
          [playerId]: {
            ...prev[playerId],
            currentTime: position,
          },
        }));

        console.log(`⏩ Seeked ${playerId} to ${Math.round(position / 1000)}s`);
      } catch (error) {
        console.error(`❌ Error seeking ${playerId}:`, error);
      }
    },
    [players, youtubeManager, spotifyManager, setPlayers]
  );

  const handleClear = useCallback(
    async (playerId: "A" | "B") => {
      try {
        // Stop and destroy players
        if (players[playerId].service === ServiceType.Youtube) {
          await youtubeManager.destroyPlayer(playerId);
        } else if (players[playerId].service === ServiceType.Spotify) {
          spotifyManager.destroyPlayer(playerId);
        }

        // Reset player state
        setPlayers((prev) => ({
          ...prev,
          [playerId]: {
            service: null,
            song: null,
            isPlaying: false,
            volume: 50,
            isMuted: false,
            crossfade: 0,
            currentTime: 0,
            duration: 0,
            isActive: false,
            playerId,
          },
        }));

        console.log(`🗑️ Cleared ${playerId}`);
      } catch (error) {
        console.error(`❌ Error clearing ${playerId}:`, error);
      }
    },
    [players, youtubeManager, spotifyManager, setPlayers]
  );

  // Initialize player function
  const initializePlayer = useCallback(
    async (
      playerId: "A" | "B",
      song: Song | YoutubeVideo,
      service: ServiceType,
      containerOverride?: HTMLDivElement
    ) => {
      try {
        console.log(
          `🎯 Initializing player ${playerId} with service:`,
          service
        );

        if (service === ServiceType.Youtube) {
          const youtubeSong = song as YoutubeVideo;
          let container = containerOverride;

          // If no container override provided, try to find the container
          if (!container) {
            // Wait for the container to be available (max 5 seconds)
            let attempts = 0;
            const maxAttempts = 50; // 50 attempts * 100ms = 5 seconds

            while (!container && attempts < maxAttempts) {
              await new Promise((resolve) => setTimeout(resolve, 100));
              container = document.getElementById(
                `youtube-player-${playerId}`
              ) as HTMLDivElement;
              attempts++;

              if (attempts % 10 === 0) {
                console.log(
                  `⏳ Still waiting for container ${playerId}... (${attempts}/${maxAttempts})`
                );
              }
            }

            if (!container) {
              throw new Error(
                `YouTube player container for ${playerId} not found after ${maxAttempts} attempts`
              );
            }

            console.log(
              `✅ Container for ${playerId} found after ${attempts} attempts`
            );
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

        // Update player state after successful initialization
        setPlayers((prev) => ({
          ...prev,
          [playerId]: {
            ...prev[playerId],
            service,
            song,
            isActive: true,
            currentTime: 0,
            duration: 0, // Will be updated later
            isPlaying: false,
          },
        }));

        // Get duration after a short delay to ensure player is ready
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
                console.log(
                  `📏 YouTube player ${playerId} duration: ${duration}ms`
                );
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
                      currentTime: state.position || 0,
                      isPlaying: !state.paused,
                    },
                  }));
                  console.log(
                    `📏 Spotify player ${playerId} duration: ${state.duration}ms`
                  );
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

        console.log(`✅ Player ${playerId} initialized successfully`);
      } catch (error) {
        console.error(`❌ Error initializing player ${playerId}:`, error);
        throw error;
      }
    },
    [youtubeManager, spotifyManager, setPlayers]
  );

  return {
    handlePlay,
    handlePause,
    handleStop,
    handleVolumeChange,
    handleMuteToggle,
    handleScratch,
    handleSeek,
    handleClear,
    initializePlayer,
  };
}
