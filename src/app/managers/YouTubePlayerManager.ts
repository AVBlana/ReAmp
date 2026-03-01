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
  loadVideoById: (videoId: string) => void;
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
    container: HTMLDivElement,
    options?: { onEmbedDisabled?: () => void }
  ) {
    console.log(`🎯 YouTubeManager.createPlayer called for ${playerId}:`, {
      videoId,
      containerExists: !!container,
      containerId: container?.id,
      containerChildren: container?.children?.length,
      apiReady: this.isApiReady,
      windowYT: !!window.YT,
      windowYTPlayer: !!(window.YT && window.YT.Player),
      existingPlayers: Array.from(this.players.keys()),
      playingPlayers: this.getPlayingPlayers(),
    });

    // Always destroy existing player for this ID to prevent conflicts
    const existingPlayer = this.players.get(playerId);
    if (existingPlayer) {
      console.log(`🗑️ Destroying existing YouTube player ${playerId}`);
      await this.destroyPlayer(playerId);
      // Brief delay after destruction
      await new Promise((resolve) => setTimeout(resolve, 200));
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

        // Add timeout to prevent hanging - increased for better reliability
        const playerCreationTimeout = setTimeout(async () => {
          console.error(`⏰ YouTube player creation timeout for ${playerId}`);
          try {
            await this.destroyPlayer(playerId);
          } catch (destroyError) {
            console.warn(
              `⚠️ Error during timeout cleanup for ${playerId}:`,
              destroyError
            );
          }
          reject(new Error(`YouTube player creation timeout for ${playerId}`));
        }, 20000); // 20 second timeout for better reliability

        // Do NOT set origin in playerVars - it can trigger error 150 for more videos and break
        // playback. See: https://stackoverflow.com/questions/34345124/youtube-iframe-api-setting-origin-breaks-video-events
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
              console.log(`✅ YouTube player ${playerId} ready`);

              // Clear timeout since player is ready
              clearTimeout(playerCreationTimeout);

              // Verify the player has required methods
              if (
                typeof event.target.getCurrentTime === "function" &&
                typeof event.target.getDuration === "function" &&
                typeof event.target.getPlayerState === "function"
              ) {
                this.players.set(playerId, event.target);
                console.log(`✅ Player ${playerId} stored successfully`);
                console.log(`🔍 Player ${playerId} details:`, {
                  hasGetCurrentTime:
                    typeof event.target.getCurrentTime === "function",
                  hasGetDuration:
                    typeof event.target.getDuration === "function",
                  hasGetPlayerState:
                    typeof event.target.getPlayerState === "function",
                  playerObject: event.target,
                });
                resolve();
              } else {
                console.error(
                  `❌ YouTube player ${playerId} missing required methods`
                );
                this.destroyPlayer(playerId);
                reject(
                  new Error(
                    `YouTube player ${playerId} missing required methods`
                  )
                );
              }
            },
            onStateChange: (event: { data: number; target: YouTubePlayer }) => {
              // Only process state changes for registered players
              if (!this.players.has(playerId)) {
                console.log(
                  `⚠️ State change for unregistered player ${playerId}, ignoring`
                );
                return;
              }

              const state = event.data;
              console.log(`🔄 Player ${playerId} state change:`, {
                state,
                stateName: this.getStateName(state),
                playerId,
                isRegistered: this.players.has(playerId),
              });

              // Skip unstarted state
              if (state === window.YT.PlayerState.UNSTARTED) {
                console.log(
                  `⏸️ Player ${playerId} in unstarted state, skipping`
                );
                return;
              }

              // Get time and duration safely
              let currentTime = 0;
              let duration = 0;

              try {
                if (typeof event.target.getCurrentTime === "function") {
                  currentTime = event.target.getCurrentTime();
                }
                if (typeof event.target.getDuration === "function") {
                  duration = event.target.getDuration();
                }
              } catch (error) {
                console.warn(
                  `⚠️ Error getting time/duration from player ${playerId}:`,
                  error
                );
              }

              // Update player state
              this.setPlayerState(playerId, {
                currentTime,
                duration,
                isPlaying: state === window.YT.PlayerState.PLAYING,
              });

              console.log(`✅ Player ${playerId} state updated:`, {
                currentTime,
                duration,
                isPlaying: state === window.YT.PlayerState.PLAYING,
              });
            },
            onError: (event: { data: number }) => {
              const code = event.data;
              console.error(`❌ YouTube player ${playerId} error:`, code);

              clearTimeout(playerCreationTimeout);

              // 150/101 = embedding disabled by owner - keep player so deck doesn't break;
              // notify UI so it can show "Watch on YouTube" fallback.
              if (code === 150 || code === 101) {
                console.warn(
                  `⚠️ YouTube embed disabled for ${playerId} (${code}); keeping deck state so you can load another track`
                );
                options?.onEmbedDisabled?.();
                resolve();
                return;
              }

              this.destroyPlayer(playerId).catch(console.error);
              reject(new Error(`YouTube player error: ${code}`));
            },
          },
        });
      } catch (error) {
        console.error(`❌ Error creating YouTube player ${playerId}:`, error);
        reject(error);
      }
    });
  }

  public loadYouTubeAPI(): Promise<void> {
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
      try {
        console.log(`▶️ Playing YouTube player ${playerId}`);
        player.playVideo();
      } catch (err) {
        console.warn(
          `⚠️ YouTube player ${playerId} play failed (video may have embedding disabled):`,
          err
        );
      }
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

  /**
   * Clear the video container without destroying the player
   * This is useful during crossfade to remove the video display
   */
  clearVideoContainer(playerId: string) {
    const container = this.containers.get(playerId);
    if (container) {
      // Remove YouTube iframes but keep the container
      const iframes = container.querySelectorAll('iframe[src*="youtube"]');
      iframes.forEach((iframe) => iframe.remove());
      console.log(`🧹 Cleared video container for player ${playerId}`);
    } else {
      console.warn(
        `⚠️ Container for player ${playerId} not found for clearing`
      );
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

  getPlayer(playerId: string): YTPlayer | undefined {
    return this.players.get(playerId);
  }

  async destroyPlayer(playerId: string) {
    const player = this.players.get(playerId);
    if (player) {
      try {
        console.log(`🗑️ Destroying YouTube player ${playerId}`);

        // First pause the player to reduce interference
        try {
          player.pauseVideo();
        } catch (pauseError) {
          console.warn(
            `⚠️ Could not pause player ${playerId} before destruction:`,
            pauseError
          );
        }

        // Longer delay to let the pause take effect and reduce interference
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Destroy the player
        player.destroy();
        console.log(`✅ Player ${playerId} destroyed successfully`);
      } catch (error) {
        console.error(`❌ Error destroying YouTube player ${playerId}:`, error);
      }
    }

    // Clear the container to remove any remaining iframe elements
    // But be more careful to only remove YouTube iframes, not other content
    const container = this.containers.get(playerId);
    if (container) {
      // Only remove YouTube iframes, not other content that might be important
      const iframes = container.querySelectorAll('iframe[src*="youtube"]');
      iframes.forEach((iframe) => iframe.remove());
      console.log(`🧹 Cleaned up YouTube iframes for player ${playerId}`);
    }

    // Remove from tracking maps
    this.players.delete(playerId);
    this.containers.delete(playerId);
    this.playerStates.delete(playerId);

    // Additional delay to ensure cleanup is complete before allowing new operations
    await new Promise((resolve) => setTimeout(resolve, 200));

    console.log(
      `🗑️ Player ${playerId} cleanup completed. Remaining players:`,
      Array.from(this.players.keys())
    );
  }

  getContainer(playerId: string): HTMLDivElement | undefined {
    return this.containers.get(playerId);
  }

  // Debug method to list all available players
  listPlayers(): string[] {
    return Array.from(this.players.keys());
  }

  // Check if a specific player is currently playing
  isPlayerPlaying(playerId: string): boolean {
    const state = this.playerStates.get(playerId);
    return state ? state.isPlaying : false;
  }

  // Get all currently playing players
  getPlayingPlayers(): string[] {
    return Array.from(this.playerStates.entries())
      .filter(([, state]) => state.isPlaying)
      .map(([playerId]) => playerId);
  }

  // Helper method to get state name for logging
  private getStateName(state: number): string {
    switch (state) {
      case window.YT.PlayerState.UNSTARTED:
        return "UNSTARTED";
      case window.YT.PlayerState.ENDED:
        return "ENDED";
      case window.YT.PlayerState.PLAYING:
        return "PLAYING";
      case window.YT.PlayerState.PAUSED:
        return "PAUSED";
      case window.YT.PlayerState.BUFFERING:
        return "BUFFERING";
      case window.YT.PlayerState.CUED:
        return "CUED";
      default:
        return `UNKNOWN(${state})`;
    }
  }

  async destroyAll() {
    console.log("🗑️ Destroying all YouTube players");
    for (const [playerId] of this.players) {
      await this.destroyPlayer(playerId);
    }
  }
}
