import { YouTubePlayer } from "@/app/types/youtube-api";

export type YTPlayerState = 0 | 1 | 2 | 3 | 5;

export interface YTPlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  stopVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  setVolume: (volume: number) => void;
  getPlayerState: () => number;
  getCurrentTime: () => number;
  getDuration: () => number;
  destroy: () => void;
}

// YouTube Player Manager for multiple instances
export class YouTubePlayerManager {
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

    // Don't destroy existing player immediately - check if it's the same video
    const existingPlayer = this.players.get(playerId);
    if (existingPlayer) {
      // If we're trying to create the same player with the same video, don't recreate
      console.log(` Player ${playerId} already exists, checking if recreation is needed`);
      // Only destroy if we need to change the video or if there's an error
    }

    // Store container reference
    this.containers.set(playerId, container);

    // Load YouTube API if not already loaded
    if (!this.isApiReady) {
      console.log(`📡 Loading YouTube API for ${playerId}...`);
      await this.loadYouTubeAPI();
    }

    // Wait for API to be ready
    while (!this.isApiReady) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log(
      `🎬 Creating YouTube player for ${playerId} with video ${videoId}`
    );

    return new Promise<void>((resolve, reject) => {
      try {
        console.log(`🎯 Creating YouTube player instance for ${playerId}`);
        
        // Add a small delay to prevent race conditions
        setTimeout(() => {
          new window.YT.Player(container, {
            videoId: videoId,
            playerVars: {
              autoplay: 0,
              modestbranding: 1,
              rel: 0,
              enablejsapi: 1,
              playsinline: 1,
              controls: 1,
            },
            events: {
              onReady: (event: { target: YouTubePlayer }) => {
                console.log(`✅ YouTube player ${playerId} ready:`, {
                  player: event.target,
                  hasGetCurrentTime:
                    typeof event.target.getCurrentTime === "function",
                  hasGetDuration: typeof event.target.getDuration === "function",
                  hasGetPlayerState:
                    typeof event.target.getPlayerState === "function",
                });
                this.players.set(playerId, event.target);
                resolve();
              },
              onStateChange: (event: { data: number; target: YouTubePlayer }) => {
                const state = event.data;
                const currentTime = event.target.getCurrentTime();
                const duration = event.target.getDuration();

                console.log(`🔄 YouTube player ${playerId} state changed:`, {
                  state,
                  currentTime,
                  duration,
                  isPlaying: state === window.YT.PlayerState.PLAYING,
                  playerState: window.YT.PlayerState.PLAYING,
                });

                this.setPlayerState(playerId, {
                  currentTime,
                  duration,
                  isPlaying: state === window.YT.PlayerState.PLAYING,
                });
              },
              onError: (event: { data: number }) => {
                console.error(`❌ YouTube player ${playerId} error:`, event.data);
                reject(new Error(`YouTube player error: ${event.data}`));
              },
            },
          });
        }, 100); // Small delay to prevent race conditions
      } catch (error) {
        console.error(`❌ Error creating YouTube player ${playerId}:`, error);
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

      // Check if API is already loaded
      if (window.YT && window.YT.Player) {
        this.isApiReady = true;
        resolve();
        return;
      }

      // Load the YouTube API script
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      // Set up the callback
      window.onYouTubeIframeAPIReady = () => {
        console.log("🎯 YouTube API loaded successfully");
        this.isApiReady = true;
        resolve();
      };
    });
  }

  // Check if a player is ready and can be controlled
  isPlayerReady(playerId: string): boolean {
    const player = this.players.get(playerId);
    if (!player) {
      return false;
    }

    try {
      // Try to call a method to see if the player is truly ready
      player.getPlayerState();
      return true;
    } catch (error) {
      console.warn(
        `⚠️ YouTube player ${playerId} exists but not ready:`,
        error
      );
      return false;
    }
  }

  // Get player with readiness check
  getReadyPlayer(playerId: string): YTPlayer | null {
    if (this.isPlayerReady(playerId)) {
      return this.players.get(playerId) || null;
    }
    return null;
  }

  playPlayer(playerId: string) {
    const player = this.players.get(playerId);
    if (player) {
      console.log(`▶️ Playing YouTube player ${playerId}`);
      player.playVideo();
    } else {
      console.warn(`⚠️ YouTube player ${playerId} not found for play`);
    }
  }

  pausePlayer(playerId: string) {
    const player = this.players.get(playerId);
    if (player) {
      console.log(`⏸️ Pausing YouTube player ${playerId}`);
      player.pauseVideo();
    } else {
      console.warn(`⚠️ YouTube player ${playerId} not found for pause`);
    }
  }

  stopPlayer(playerId: string) {
    const player = this.players.get(playerId);
    if (player) {
      console.log(`⏹️ Stopping YouTube player ${playerId}`);
      player.stopVideo();
    } else {
      console.warn(`⚠️ YouTube player ${playerId} not found for stop`);
    }
  }

  seekPlayer(playerId: string, seconds: number) {
    const player = this.players.get(playerId);
    if (player) {
      console.log(`⏩ Seeking YouTube player ${playerId} to ${seconds}s`);
      player.seekTo(seconds, true);
    } else {
      console.warn(`⚠️ YouTube player ${playerId} not found for seek`);
    }
  }

  setVolume(playerId: string, volume: number) {
    const player = this.players.get(playerId);
    if (player) {
      console.log(`🔊 Setting YouTube player ${playerId} volume to ${volume}`);
      player.setVolume(volume);
    } else {
      console.warn(`⚠️ YouTube player ${playerId} not found for volume change`);
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
    if (player) {
      try {
        return player.getPlayerState();
      } catch (error) {
        console.error(
          `❌ Error getting YouTube player ${playerId} state:`,
          error
        );
        return -1;
      }
    }
    return -1;
  }

  getCurrentTime(playerId: string): number {
    const player = this.players.get(playerId);
    if (player) {
      try {
        return player.getCurrentTime();
      } catch (error) {
        console.error(
          `❌ Error getting YouTube player ${playerId} current time:`,
          error
        );
        return 0;
      }
    }
    return 0;
  }

  getDuration(playerId: string): number {
    const player = this.players.get(playerId);
    if (player) {
      try {
        return player.getDuration();
      } catch (error) {
        console.error(
          `❌ Error getting YouTube player ${playerId} duration:`,
          error
        );
        return 0;
      }
    }
    return 0;
  }

  destroyPlayer(playerId: string) {
    const player = this.players.get(playerId);
    if (player) {
      try {
        console.log(`🗑️ Destroying YouTube player ${playerId}`);
        player.destroy();
      } catch (error) {
        console.error(`❌ Error destroying YouTube player ${playerId}:`, error);
      }
    }
    this.players.delete(playerId);
    this.containers.delete(playerId);
    this.playerStates.delete(playerId);
  }

  getContainer(playerId: string): HTMLDivElement | undefined {
    return this.containers.get(playerId);
  }

  getPlayer(playerId: string): YTPlayer | undefined {
    return this.players.get(playerId);
  }

  // Debug method to list all available players
  listPlayers(): string[] {
    return Array.from(this.players.keys());
  }

  destroyAll() {
    console.log("🗑️ Destroying all YouTube players");
    for (const [playerId] of this.players) {
      this.destroyPlayer(playerId);
    }
  }
}
