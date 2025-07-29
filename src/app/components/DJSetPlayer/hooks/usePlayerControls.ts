import { useCallback } from "react";
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
  youtubeManager: any;
  spotifyManager: any;
  initializePlayer: (
    playerId: "A" | "B",
    song: Song | YoutubeVideo,
    service: ServiceType,
    containerOverride?: HTMLDivElement
  ) => Promise<void>;
}

export function usePlayerControls({
  players,
  setPlayers,
  youtubeManager,
  spotifyManager,
  initializePlayer,
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

        console.log(`🔊 Set ${playerId} volume to ${volume}`);
      } catch (error) {
        console.error(`❌ Error setting volume for ${playerId}:`, error);
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
    (playerId: "A" | "B", direction: "forward" | "backward") => {
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
          youtubeManager.seekPlayer(playerId, newTime / 1000);
        } else if (player.service === ServiceType.Spotify) {
          spotifyManager.seekPlayer(playerId, newTime);
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
          youtubeManager.seekPlayer(playerId, position / 1000);
        } else if (player.service === ServiceType.Spotify) {
          spotifyManager.seekPlayer(playerId, position);
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
    (playerId: "A" | "B") => {
      try {
        // Stop and destroy players
        if (players[playerId].service === ServiceType.Youtube) {
          youtubeManager.destroyPlayer(playerId);
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

  return {
    handlePlay,
    handlePause,
    handleStop,
    handleVolumeChange,
    handleMuteToggle,
    handleScratch,
    handleSeek,
    handleClear,
  };
}
