import { SpotifyPlayer, SpotifyPlaybackState } from "@/app/types/spotify-api";

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

  public async loadSpotifySDK(): Promise<void> {
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

      // Update localStorage with the new token
      localStorage.setItem("spotify_token", data.access_token);

      console.log("✅ Spotify token refreshed and localStorage updated");
      return data.access_token;
    } catch (error) {
      console.error("❌ Error refreshing Spotify token:", error);
      throw error;
    }
  }

  private async refreshDeviceId(playerId: string): Promise<string | null> {
    try {
      console.log(`🔄 Refreshing device ID for player ${playerId}`);

      // Get a fresh token
      const token = await this.refreshToken();

      // Get available devices from Spotify API
      const response = await fetch(
        "https://api.spotify.com/v1/me/player/devices",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        console.error("Failed to get devices:", response.status);
        return null;
      }

      const devices = await response.json();
      console.log("📱 Available Spotify devices:", devices);

      // Look for an active device or web player
      const activeDevice = devices.devices.find(
        (device: {
          is_active: boolean;
          type: string;
          id: string;
          name: string;
        }) =>
          device.is_active ||
          device.type === "Computer" ||
          device.type === "Web"
      );

      if (activeDevice) {
        console.log(
          `✅ Found active device: ${activeDevice.name} (${activeDevice.id})`
        );
        this.deviceIds.set(playerId, activeDevice.id);
        return activeDevice.id;
      }

      // If no active device, try to activate the web player
      if (this.globalPlayerInstance) {
        try {
          await this.globalPlayerInstance.activateElement();
          console.log("🔄 Activated web player element");

          // Wait a moment for activation
          await new Promise((resolve) => setTimeout(resolve, 1000));

          // Try to get the device ID again
          const deviceId = this.deviceIds.get(playerId);
          if (deviceId) {
            console.log(`✅ Got device ID after activation: ${deviceId}`);
            return deviceId;
          }
        } catch (activationError) {
          console.error("Failed to activate web player:", activationError);
        }
      }

      console.warn("⚠️ No active Spotify device found");
      return null;
    } catch (error) {
      console.error("❌ Error refreshing device ID:", error);
      return null;
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
        const player = new window.Spotify.Player({
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

          // Set the device ID in the player options for easier access
          if (player._options) {
            player._options.device_id = device_id;
          }

          console.log(
            `🎵 Spotify player ${playerId} fully initialized and ready`
          );
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

            // Check if it's a premium account issue
            if (message.includes("premium") || message.includes("Premium")) {
              console.error(
                "❌ Spotify Premium account required for Web Playback SDK"
              );
              alert(
                "Spotify Premium account required to play music. Please upgrade your account."
              );
            }

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

            // Handle "no list loaded" error by attempting to load the track
            if (message.includes("no list was loaded")) {
              console.log(`🔄 Handling "no list loaded" error for ${playerId}`);
              const trackInfo = this.trackInfo.get(playerId);
              if (trackInfo) {
                console.log(
                  `📀 Attempting to load track ${trackInfo.trackId} for ${playerId}`
                );
                this.playTrack(playerId, trackInfo.trackId).catch((error) => {
                  console.error(
                    `❌ Failed to load track after playback error:`,
                    error
                  );
                });
              }
            }
          }
        );

        // Add state change listener to track when tracks are loaded
        player.addListener(
          "player_state_changed",
          (state: SpotifyPlaybackState | null) => {
            if (state) {
              this.setPlayerState(playerId, {
                currentTime: state.position,
                duration: state.duration,
                isPlaying: !state.paused,
              });
            }
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

      // Load track without auto-playing - user must manually start playback
      console.log(
        `🎵 Track ${trackId} loaded into player ${playerId} (ready for manual playback)`
      );
    } catch (error) {
      console.error(`❌ Error creating Spotify player for ${playerId}:`, error);
      throw error;
    }
  }

  private async getDeviceId(player: SpotifyPlayer): Promise<string> {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds max

      const checkDeviceId = () => {
        attempts++;
        console.log(`🔍 Checking device ID for player (attempt ${attempts}):`, {
          hasOptions: !!player._options,
          deviceId: player._options?.device_id,
        });

        if (player._options?.device_id) {
          console.log(`✅ Found device ID: ${player._options.device_id}`);
          resolve(player._options.device_id);
        } else if (attempts >= maxAttempts) {
          console.error(
            `❌ Failed to get device ID after ${maxAttempts} attempts`
          );
          reject(new Error("Failed to get device ID"));
        } else {
          setTimeout(checkDeviceId, 100);
        }
      };
      checkDeviceId();
    });
  }

  async playTrack(playerId: string, trackId: string): Promise<void> {
    console.log(`🚀 playTrack called for ${playerId} with track ${trackId}`);

    const player = this.players.get(playerId);
    if (!player) {
      console.warn(`⚠️ Spotify player ${playerId} not found for play`);
      return;
    }

    try {
      const deviceId = await this.getDeviceId(player);
      const token = this.tokens.get(playerId);

      console.log(`🔍 Spotify playTrack debug for ${playerId}:`, {
        deviceId,
        hasToken: !!token,
        trackId,
        playerExists: !!player,
      });

      if (!token) {
        console.error(
          "No token available for Spotify player, redirecting to login"
        );
        window.location.href = "/api/spotify/login?origin=/reamp";
        return;
      }

      if (!deviceId) {
        console.error("No device ID available for Spotify player");
        return;
      }

      console.log(
        `🎵 Sending play request to Spotify API for track ${trackId} on device ${deviceId}`
      );

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

      console.log(`📡 Spotify API response status: ${response.status}`);

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`❌ Spotify play error:`, errorData);

        // Check if it's an authentication error
        if (response.status === 401) {
          console.error("Spotify authentication failed, redirecting to login");
          window.location.href = "/api/spotify/login?origin=/reamp";
          return;
        }

        // Handle 404 error (device not found or inactive)
        if (response.status === 404) {
          console.error(
            "Spotify device not found or inactive. Please ensure Spotify app is open and active."
          );

          // Try to refresh the device ID
          try {
            console.log("🔄 Attempting to refresh device ID...");
            const newDeviceId = await this.refreshDeviceId(playerId);
            if (newDeviceId) {
              console.log(`🔄 Retrying with new device ID: ${newDeviceId}`);
              // Retry the play request with the new device ID
              return await this.playTrack(playerId, trackId);
            }
          } catch (refreshError) {
            console.error("Failed to refresh device ID:", refreshError);
          }

          throw new Error(
            "Spotify device not available. Please ensure Spotify app is open and active."
          );
        }

        throw new Error(`Spotify play failed: ${response.status}`);
      }

      console.log(`▶️ Playing Spotify track ${trackId} on player ${playerId}`);

      // Wait a moment for the track to be loaded in the Spotify app
      console.log(`⏳ Waiting for track to be loaded in Spotify app...`);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Check if the track is now loaded in the SDK
      const currentState = await player.getCurrentState();
      console.log(`🔍 Track load check for ${playerId}:`, currentState);

      if (!currentState || currentState.duration === 0) {
        console.warn(
          `⚠️ Track may not be loaded in SDK for ${playerId}, but API call succeeded`
        );
      } else {
        console.log(`✅ Track successfully loaded in SDK for ${playerId}`);
      }
    } catch (error) {
      console.error(`❌ Error playing Spotify track on ${playerId}:`, error);

      // Check if it's a network error that might indicate authentication issues
      if (error instanceof Error && error.message.includes("Failed to fetch")) {
        console.error(
          "Network error, might be authentication issue, redirecting to login"
        );
        window.location.href = "/api/spotify/login?origin=/reamp";
        return;
      }

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
      // First check if there's a track loaded
      const trackInfo = this.trackInfo.get(playerId);
      if (!trackInfo) {
        console.warn(`⚠️ No track info for player ${playerId}, cannot resume`);
        return;
      }

      // Check current state to see if there's anything playing
      const currentState = await player.getCurrentState();
      console.log(`🔍 Current Spotify state for ${playerId}:`, currentState);

      if (!currentState || currentState.duration === 0) {
        // No track is loaded, need to load the track first
        console.log(
          `📀 No track loaded for ${playerId}, loading track ${trackInfo.trackId}`
        );
        await this.playTrack(playerId, trackInfo.trackId);
      } else {
        // Track is loaded, just resume
        console.log(`▶️ Resuming existing track for player ${playerId}`);
        await player.resume();
        console.log(`✅ Resumed Spotify player ${playerId}`);
      }
    } catch (error) {
      console.error(`❌ Error resuming Spotify player ${playerId}:`, error);

      // Check if it's an authentication error
      if (error instanceof Error && error.message.includes("authentication")) {
        console.error(
          "Spotify authentication failed during resume, redirecting to login"
        );
        window.location.href = "/api/spotify/login?origin=/reamp";
        return;
      }

      // If it's a "no list loaded" error, try to load the track
      if (
        error instanceof Error &&
        error.message.includes("no list was loaded")
      ) {
        console.log(
          `🔄 "No list loaded" error, attempting to load track for ${playerId}`
        );
        const trackInfo = this.trackInfo.get(playerId);
        if (trackInfo) {
          try {
            await this.playTrack(playerId, trackInfo.trackId);
            return;
          } catch (playError) {
            console.error(
              `❌ Failed to load track after resume error:`,
              playError
            );
          }
        }
      }

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
