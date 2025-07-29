export interface SpotifyPlayer {
  connect: () => Promise<boolean>;
  disconnect: () => void;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  seek: (position_ms: number) => Promise<void>;
  setVolume?: (volume: number) => Promise<void>;
  getCurrentState: () => Promise<SpotifyPlaybackState | null>;
  addListener: (event: string, cb: (...args: unknown[]) => void) => void;
  removeListener: (event: string, cb: (...args: unknown[]) => void) => void;
  _options?: { device_id?: string };
}

export interface SpotifyPlaybackState {
  position: number;
  duration: number;
  paused: boolean;
}

// Spotify Player Manager for multiple instances
export class SpotifyPlayerManager {
  private players: Map<string, SpotifyPlayer> = new Map();
  private tokens: Map<string, string> = new Map();
  private deviceIds: Map<string, string> = new Map();
  trackInfo: Map<string, { trackId: string; token: string }> = new Map();
  eventListeners: Map<string, (...args: unknown[]) => void> = new Map();
  private isApiReady = false;
  private scriptLoadPromise: Promise<void> | null = null;
  private globalPlayerInstance: SpotifyPlayer | null = null;
  private globalPlayerInitializing = false;

  private async loadSpotifySDK(): Promise<void> {
    if (this.isApiReady) {
      return;
    }

    if (this.scriptLoadPromise) {
      return this.scriptLoadPromise;
    }

    this.scriptLoadPromise = new Promise((resolve, reject) => {
      if (window.Spotify) {
        this.isApiReady = true;
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = "https://sdk.scdn.co/spotify-player.js";
      script.async = true;

      script.onload = () => {
        console.log("🎵 Spotify SDK loaded successfully");
        this.isApiReady = true;
        resolve();
      };

      script.onerror = () => {
        console.error("❌ Failed to load Spotify SDK");
        reject(new Error("Failed to load Spotify SDK"));
      };

      document.head.appendChild(script);
    });

    return this.scriptLoadPromise;
  }

  private async refreshToken(): Promise<string> {
    try {
      const response = await fetch("/api/spotify/refresh");
      if (!response.ok) {
        throw new Error("Failed to refresh token");
      }
      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error("❌ Error refreshing Spotify token:", error);
      throw error;
    }
  }

  private async createSpotifyPlayer(playerId: string): Promise<SpotifyPlayer> {
    if (this.globalPlayerInstance) {
      return this.globalPlayerInstance;
    }

    if (this.globalPlayerInitializing) {
      // Wait for the global player to be initialized
      while (this.globalPlayerInitializing) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      return this.globalPlayerInstance!;
    }

    this.globalPlayerInitializing = true;

    try {
      await this.loadSpotifySDK();

      const token = await this.refreshToken();

      return new Promise((resolve, reject) => {
        const player = new (window as any).Spotify.Player({
          name: `ReAMP DJ Player ${playerId}`,
          getOAuthToken: (cb: (token: string) => void) => {
            cb(token);
          },
        });

        player.addListener("ready", ({ device_id }: { device_id: string }) => {
          console.log(
            `✅ Spotify player ${playerId} ready with device ${device_id}`
          );
          this.deviceIds.set(playerId, device_id);
          this.globalPlayerInstance = player;
          this.globalPlayerInitializing = false;
          resolve(player);
        });

        player.addListener(
          "not_ready",
          ({ device_id }: { device_id: string }) => {
            console.log(
              `⚠️ Spotify player ${playerId} not ready for device ${device_id}`
            );
          }
        );

        player.addListener(
          "initialization_error",
          ({ message }: { message: string }) => {
            console.error(
              `❌ Spotify player ${playerId} initialization error:`,
              message
            );
            this.globalPlayerInitializing = false;
            reject(new Error(`Spotify initialization error: ${message}`));
          }
        );

        player.addListener(
          "authentication_error",
          ({ message }: { message: string }) => {
            console.error(
              `❌ Spotify player ${playerId} authentication error:`,
              message
            );
            this.globalPlayerInitializing = false;
            reject(new Error(`Spotify authentication error: ${message}`));
          }
        );

        player.addListener(
          "account_error",
          ({ message }: { message: string }) => {
            console.error(
              `❌ Spotify player ${playerId} account error:`,
              message
            );
            this.globalPlayerInitializing = false;
            reject(new Error(`Spotify account error: ${message}`));
          }
        );

        player.addListener(
          "playback_error",
          ({ message }: { message: string }) => {
            console.error(
              `❌ Spotify player ${playerId} playback error:`,
              message
            );
          }
        );

        player.connect();
      });
    } catch (error) {
      this.globalPlayerInitializing = false;
      throw error;
    }
  }

  async createPlayer(playerId: string, trackId: string, token: string) {
    console.log(`🎯 SpotifyManager.createPlayer called for ${playerId}:`, {
      trackId,
      tokenExists: !!token,
    });

    // Clean up existing player if any
    this.destroyPlayer(playerId);

    // Store token
    this.tokens.set(playerId, token);

    // Store track info
    this.trackInfo.set(playerId, { trackId, token });

    try {
      const player = await this.createSpotifyPlayer(playerId);
      this.players.set(playerId, player);

      console.log(`✅ Spotify player ${playerId} created successfully`);
    } catch (error) {
      console.error(`❌ Error creating Spotify player for ${playerId}:`, error);
      throw error;
    }
  }

  private async getDeviceId(player: SpotifyPlayer): Promise<string> {
    return new Promise((resolve, reject) => {
      const checkDeviceId = () => {
        if (player._options?.device_id) {
          resolve(player._options.device_id);
        } else {
          setTimeout(checkDeviceId, 100);
        }
      };
      checkDeviceId();
    });
  }

  async playTrack(playerId: string, trackId: string): Promise<void> {
    const player = this.players.get(playerId);
    if (!player) {
      console.warn(`⚠️ Spotify player ${playerId} not found for play`);
      return;
    }

    try {
      const deviceId = await this.getDeviceId(player);
      const token = this.tokens.get(playerId);

      if (!token) {
        throw new Error("No token available for Spotify player");
      }

      const response = await fetch(
        `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            uris: [`spotify:track:${trackId}`],
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`❌ Spotify play error:`, errorData);
        throw new Error(`Spotify play failed: ${response.status}`);
      }

      console.log(`▶️ Playing Spotify track ${trackId} on player ${playerId}`);
    } catch (error) {
      console.error(`❌ Error playing Spotify track on ${playerId}:`, error);
      throw error;
    }
  }

  async pausePlayer(playerId: string): Promise<void> {
    const player = this.players.get(playerId);
    if (!player) {
      console.warn(`⚠️ Spotify player ${playerId} not found for pause`);
      return;
    }

    try {
      await player.pause();
      console.log(`⏸️ Paused Spotify player ${playerId}`);
    } catch (error) {
      console.error(`❌ Error pausing Spotify player ${playerId}:`, error);
      throw error;
    }
  }

  async resumePlayer(playerId: string): Promise<void> {
    const player = this.players.get(playerId);
    if (!player) {
      console.warn(`⚠️ Spotify player ${playerId} not found for resume`);
      return;
    }

    try {
      await player.resume();
      console.log(`▶️ Resumed Spotify player ${playerId}`);
    } catch (error) {
      console.error(`❌ Error resuming Spotify player ${playerId}:`, error);
      throw error;
    }
  }

  async setVolume(playerId: string, volume: number): Promise<void> {
    const player = this.players.get(playerId);
    if (!player) {
      console.warn(`⚠️ Spotify player ${playerId} not found for volume change`);
      return;
    }

    try {
      if (player.setVolume) {
        await player.setVolume(volume / 100);
        console.log(`🔊 Set Spotify player ${playerId} volume to ${volume}`);
      }
    } catch (error) {
      console.error(
        `❌ Error setting Spotify player ${playerId} volume:`,
        error
      );
      throw error;
    }
  }

  playerStates: Map<
    string,
    { currentTime: number; duration: number; isPlaying: boolean }
  > = new Map();

  getPlayerState(playerId: string): number {
    const state = this.playerStates.get(playerId);
    return state?.isPlaying ? 1 : 2; // 1 = playing, 2 = paused
  }

  getCurrentTime(playerId: string): number {
    const state = this.playerStates.get(playerId);
    return state?.currentTime || 0;
  }

  getDuration(playerId: string): number {
    const state = this.playerStates.get(playerId);
    return state?.duration || 0;
  }

  async updatePlayerState(playerId: string): Promise<void> {
    const player = this.players.get(playerId);
    if (!player) {
      return;
    }

    try {
      const state = await player.getCurrentState();
      if (state) {
        this.setPlayerState(playerId, {
          currentTime: state.position,
          duration: state.duration,
          isPlaying: !state.paused,
        });
      }
    } catch (error) {
      console.error(
        `❌ Error updating Spotify player ${playerId} state:`,
        error
      );
    }
  }

  setPlayerState(
    playerId: string,
    state: { currentTime: number; duration: number; isPlaying: boolean }
  ) {
    this.playerStates.set(playerId, state);
  }

  getPlayer(playerId: string): SpotifyPlayer | undefined {
    return this.players.get(playerId);
  }

  destroyPlayer(playerId: string) {
    const player = this.players.get(playerId);
    if (player) {
      try {
        console.log(`🗑️ Destroying Spotify player ${playerId}`);
        player.disconnect();
      } catch (error) {
        console.error(`❌ Error destroying Spotify player ${playerId}:`, error);
      }
    }
    this.players.delete(playerId);
    this.tokens.delete(playerId);
    this.deviceIds.delete(playerId);
    this.trackInfo.delete(playerId);
    this.playerStates.delete(playerId);
  }

  destroyAll() {
    console.log("🗑️ Destroying all Spotify players");
    for (const [playerId] of this.players) {
      this.destroyPlayer(playerId);
    }
    this.globalPlayerInstance = null;
    this.globalPlayerInitializing = false;
  }
}
