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

    // Set up global callback for Spotify SDK
    (
      window as Window & { onSpotifyWebPlaybackSDKReady?: () => void }
    ).onSpotifyWebPlaybackSDKReady = () => {
      console.log("🎵 Spotify Web Playback SDK Ready");
    };

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
      const response = await fetch("/api/auth/session");
      if (response.ok) {
        const session = await response.json();
        const fromSession = session?.providers?.spotify?.accessToken;
        if (fromSession) {
          return fromSession;
        }
      }

      // Fallback: server-side token (session may not include providers on client)
      const tokenRes = await fetch("/api/user/spotify-token", {
        credentials: "include",
      });
      if (tokenRes.ok) {
        const { accessToken } = await tokenRes.json();
        if (accessToken) {
          return accessToken;
        }
      }

      throw new Error("No Spotify token. Please connect Spotify in account settings.");
    } catch (error) {
      console.error("❌ Error getting Spotify token:", error);
      throw error;
    }
  }

  /** Transfer user's playback to our device so play requests succeed (fixes 404 when device was inactive) */
  private async transferPlaybackToDevice(
    deviceId: string,
    token: string,
    options?: { play: boolean }
  ): Promise<boolean> {
    try {
      const res = await fetch("https://api.spotify.com/v1/me/player", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          device_ids: [deviceId],
          play: options?.play ?? false,
        }),
      });
      if (res.status === 204) {
        console.log("✅ Transferred playback to our device");
        return true;
      }
      if (res.status === 404) {
        // Device not found or no active session
        return false;
      }
      const err = await res.json().catch(() => ({}));
      console.warn("⚠️ Transfer playback response:", res.status, err);
      return false;
    } catch (e) {
      console.warn("⚠️ Transfer playback failed:", e);
      return false;
    }
  }

  /** Activate the Web Playback SDK element so the device stays registered with Spotify (reduces 404s on subsequent plays) */
  private async ensureDeviceActive(playerId: string): Promise<void> {
    const player = this.players.get(playerId) || this.globalPlayerInstance;
    if (player?.activateElement) {
      try {
        await player.activateElement();
        await new Promise((r) => setTimeout(r, 1500));
      } catch {
        // ignore
      }
    }
  }

  private async refreshDeviceId(playerId: string): Promise<string | null> {
    try {
      console.log(`🔄 Refreshing device ID for player ${playerId}`);

      const token = await this.refreshToken();

      const response = await fetch(
        "https://api.spotify.com/v1/me/player/devices",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        console.error("Failed to get devices:", response.status);
        return null;
      }

      const data = await response.json();
      const devices: Array<{ is_active: boolean; type: string; id: string; name: string }> = data.devices || [];
      console.log("📱 Available Spotify devices:", { devices });

      // Prefer our Web Playback SDK device (name "ReAMP DJ Player A/B") so play requests hit the right device
      const ourDevice = devices.find((d) =>
        (d.name || "").startsWith("ReAMP DJ Player")
      );
      if (ourDevice) {
        console.log(
          `✅ Found our device: ${ourDevice.name} (${ourDevice.id})`
        );
        this.deviceIds.set(playerId, ourDevice.id);
        return ourDevice.id;
      }

      const activeDevice = devices.find(
        (d) => d.is_active || d.type === "Computer" || d.type === "Web"
      );
      if (activeDevice) {
        console.log(
          `✅ Found active device: ${activeDevice.name} (${activeDevice.id})`
        );
        this.deviceIds.set(playerId, activeDevice.id);
        return activeDevice.id;
      }

      // No device in API list: try other deck's device (cached or from shared SDK player)
      if (devices.length === 0) {
        const otherPlayerId = playerId === "A" ? "B" : "A";
        let otherDeviceId = this.deviceIds.get(otherPlayerId);
        if (!otherDeviceId) {
          const otherPlayer = this.players.get(otherPlayerId) || this.globalPlayerInstance;
          otherDeviceId = otherPlayer?._options?.device_id ?? undefined;
          if (otherDeviceId) this.deviceIds.set(otherPlayerId, otherDeviceId);
        }
        if (otherDeviceId) {
          console.log(
            `🔄 No devices in API list; using other deck (${otherPlayerId}) device for ${playerId}`
          );
          this.deviceIds.set(playerId, otherDeviceId);
          return otherDeviceId;
        }
      }

      // No device in API list: use Web Playback SDK device_id and transfer playback to it
      const player = this.players.get(playerId) || this.globalPlayerInstance;
      const sdkDeviceId = player?._options?.device_id;
      if (sdkDeviceId) {
        console.log("🔄 No device in API list; using SDK device and transferring playback");
        await this.globalPlayerInstance?.activateElement?.();
        // Wait longer so Spotify registers the Web device (empty list often needs 2s+ after activate)
        await new Promise((r) => setTimeout(r, 2000));
        const transferred = await this.transferPlaybackToDevice(sdkDeviceId, token);
        if (transferred) {
          await new Promise((r) => setTimeout(r, 400));
        }
        this.deviceIds.set(playerId, sdkDeviceId);
        return sdkDeviceId;
      }

      if (this.globalPlayerInstance) {
        try {
          await this.globalPlayerInstance.activateElement();
          console.log("🔄 Activated web player element");
          await new Promise((resolve) => setTimeout(resolve, 1500));
          const id = this.deviceIds.get(playerId) ?? this.globalPlayerInstance?._options?.device_id;
          if (id) {
            this.deviceIds.set(playerId, id);
            return id;
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

            // Check if it's a scope issue
            if (
              message.includes("scope") ||
              message.includes("web-playback") ||
              message.includes("401")
            ) {
              console.error(
                "❌ Spotify Web Playback SDK requires 'streaming' scope. Please re-authenticate with Spotify."
              );
              console.error(
                "🔧 SOLUTION: Sign out and sign in again with Spotify to grant the new 'streaming' permission."
              );
              reject(
                new Error(
                  "Spotify authentication error: Missing 'streaming' scope. Please sign out and sign in again with Spotify to grant the required permissions for music playback."
                )
              );
            } else {
              reject(new Error(`Spotify authentication error: ${message}`));
            }
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

  /**
   * Load a new track into an existing Spotify player without destroying it.
   * Use when the deck already has a Spotify player (e.g. after crossfade) to avoid
   * disconnecting and invalidating the other deck's device.
   */
  loadTrackIntoExistingPlayer(playerId: string, trackId: string, token: string): void {
    const player = this.players.get(playerId);
    if (!player) {
      console.warn(`⚠️ No existing Spotify player ${playerId}, caller should use createPlayer`);
      return;
    }
    this.tokens.set(playerId, token);
    this.trackInfo.set(playerId, { trackId, token });
    console.log(`🎵 Loaded track ${trackId} into existing Spotify player ${playerId}`);
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

  /** Reconnect the Web Playback SDK to get a fresh device_id when the current one returns 404 */
  private async reconnectSpotifyPlayer(playerId: string): Promise<SpotifyPlayer | null> {
    const player = this.players.get(playerId);
    if (!player) return null;
    try {
      console.log(`🔄 Reconnecting Spotify SDK for ${playerId} to get fresh device...`);
      player.disconnect();
    } catch {
      // ignore
    }
    this.players.delete(playerId);
    this.deviceIds.delete(playerId);
    this.globalPlayerInstance = null;

    try {
      const newPlayer = await this.createSpotifyPlayer(playerId);
      this.players.set(playerId, newPlayer);
      console.log(`✅ Spotify SDK reconnected for ${playerId}`);
      return newPlayer;
    } catch (err) {
      console.error("❌ Spotify SDK reconnect failed:", err);
      return null;
    }
  }

  /** Max number of 404 retries (refresh device + reconnect) to avoid infinite loop during crossfade */
  private static readonly MAX_404_RETRIES = 2;

  async playTrack(
    playerId: string,
    trackId: string,
    /** Set when retrying after SDK reconnect to avoid reconnect loop */
    retriedAfterReconnect = false,
    /** Internal: 404 retry count so we abort and throw after MAX_404_RETRIES */
    _404RetryCount = 0
  ): Promise<void> {
    console.log(`🚀 playTrack called for ${playerId} with track ${trackId}`);

    const player = this.players.get(playerId);
    if (!player) {
      console.warn(`⚠️ Spotify player ${playerId} not found for play`);
      return;
    }

    try {
      // Keep Web Playback device registered before API calls (reduces 404 on second+ play)
      await this.ensureDeviceActive(playerId);

      // Sync device_id with Spotify API before first play to avoid 404 (stale SDK device_id after tab/background)
      const refreshedId = await this.refreshDeviceId(playerId);
      const deviceId =
        refreshedId ??
        this.deviceIds.get(playerId) ??
        (await this.getDeviceId(player));
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
        window.location.href = "/";
        return;
      }

      if (!deviceId) {
        console.error("No device ID available for Spotify player");
        return;
      }

      const playPayload = {
        uris: [`spotify:track:${trackId}`],
      };
      const playOpts = {
        method: "PUT" as const,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(playPayload),
      };

      const doPlay = (device: string) =>
        fetch(
          `https://api.spotify.com/v1/me/player/play?device_id=${device}`,
          playOpts
        );

      console.log(
        `🎵 Sending play request to Spotify API for track ${trackId} on device ${deviceId}`
      );

      let response = await doPlay(deviceId);

      console.log(`📡 Spotify API response status: ${response.status}`);

      // On 404: try other deck's device first (both decks often share one Spotify device), then activate/transfer
      if (response.status === 404) {
        const otherPlayerId = playerId === "A" ? "B" : "A";
        const otherDeviceId =
          this.deviceIds.get(otherPlayerId) ??
          this.players.get(otherPlayerId)?._options?.device_id ??
          this.globalPlayerInstance?._options?.device_id;
        if (otherDeviceId && otherDeviceId !== deviceId) {
          console.log(
            `🔄 Trying other deck (${otherPlayerId}) device for ${playerId} after 404`
          );
          const otherRes = await doPlay(otherDeviceId);
          if (otherRes.ok) {
            this.deviceIds.set(playerId, otherDeviceId);
            response = otherRes;
          }
        }
        if (!response.ok) {
          console.log(
            "Spotify device not found (404). Activating device, transferring playback, and retrying..."
          );
          await this.ensureDeviceActive(playerId);
          await new Promise((r) => setTimeout(r, 800));
          const transferred = await this.transferPlaybackToDevice(deviceId, token);
          if (transferred) {
            await new Promise((r) => setTimeout(r, 600));
            response = await doPlay(deviceId);
            console.log(`📡 Spotify API retry status: ${response.status}`);
          }
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`❌ Spotify play error:`, errorData);

        if (response.status === 401) {
          console.error("Spotify authentication failed, redirecting to login");
          window.location.href = "/";
          return;
        }

        if (response.status === 404) {
          if (_404RetryCount >= SpotifyPlayerManager.MAX_404_RETRIES) {
            console.warn(
              `⚠️ Spotify 404 retry limit (${SpotifyPlayerManager.MAX_404_RETRIES}) reached, aborting to avoid crossfade loop`
            );
            throw new Error("SPOTIFY_NO_ACTIVE_DEVICE");
          }
          try {
            const newDeviceId = await this.refreshDeviceId(playerId);
            if (newDeviceId && newDeviceId !== deviceId) {
              return await this.playTrack(
                playerId,
                trackId,
                retriedAfterReconnect,
                _404RetryCount + 1
              );
            }
            // Still 404 with same or no device: reconnect SDK once for a fresh device_id (unless we already did)
            if (!retriedAfterReconnect) {
              const reconnected = await this.reconnectSpotifyPlayer(playerId);
              if (reconnected) {
                await new Promise((r) => setTimeout(r, 1200));
                return await this.playTrack(
                  playerId,
                  trackId,
                  true,
                  _404RetryCount + 1
                );
              }
            }
          } catch (e) {
            if (
              e instanceof Error &&
              e.message === "SPOTIFY_NO_ACTIVE_DEVICE"
            ) {
              throw e;
            }
            // ignore other errors and fall through to throw below
          }
          throw new Error("SPOTIFY_NO_ACTIVE_DEVICE");
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
        window.location.href = "/";
        return;
      }

      throw error;
    }
  }

  /**
   * Pause playback for a specific deck's device only.
   * Uses the REST API with device_id so we don't pause the currently active device
   * (e.g. after crossfade A→B, calling pausePlayer("A") must not pause B).
   */
  async pausePlayer(playerId: string): Promise<void> {
    const player = this.players.get(playerId);
    if (!player) {
      console.warn(`⚠️ Spotify player ${playerId} not found for pause`);
      return;
    }

    const token = this.tokens.get(playerId);
    if (!token) {
      console.warn(`⚠️ No token for Spotify player ${playerId}, skipping pause`);
      return;
    }

    try {
      const deviceId =
        this.deviceIds.get(playerId) ?? (await this.getDeviceId(player));
      if (!deviceId) {
        console.warn(`⚠️ No device ID for Spotify player ${playerId}, falling back to SDK pause`);
        await player.pause();
        console.log(`⏸️ Paused Spotify player ${playerId} (SDK fallback)`);
        return;
      }

      const res = await fetch(
        `https://api.spotify.com/v1/me/player/pause?device_id=${encodeURIComponent(deviceId)}`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        // 204 or any 2xx: pause targeted this device only; do NOT call player.pause() (that would pause the active device)
        console.log(`⏸️ Paused Spotify player ${playerId} (device ${deviceId.slice(0, 8)}…)`);
        return;
      }
      if (res.status === 404) {
        // Device not active (e.g. playback already on other device) - that's ok
        console.log(`⏸️ Spotify device ${playerId} not active, no-op`);
        return;
      }
      const err = await res.json().catch(() => ({}));
      console.warn(`⚠️ Spotify pause response ${res.status}:`, err);
      // Only fall back to SDK pause on real errors; SDK pause affects active device so avoid if we're not sure
      await player.pause();
      console.log(`⏸️ Paused Spotify player ${playerId} (SDK fallback after API ${res.status})`);
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
        window.location.href = "/";
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

  async setVolume(playerId: string, volume: number, options?: { quiet?: boolean }): Promise<void> {
    const player = this.players.get(playerId);
    if (!player) {
      if (!options?.quiet) console.warn(`⚠️ Spotify player ${playerId} not found for volume change`);
      return;
    }

    try {
      if (player.setVolume) {
        await player.setVolume(volume / 100);
        if (!options?.quiet) console.log(`🔊 Set Spotify player ${playerId} volume to ${volume}`);
      }
    } catch (error) {
      if (!options?.quiet) console.error(
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
    this.players.delete(playerId);
    this.tokens.delete(playerId);
    this.deviceIds.delete(playerId);
    this.trackInfo.delete(playerId);
    this.playerStates.delete(playerId);

    if (!player) return;

    // Both decks share the same global Spotify SDK player. Only disconnect when
    // no other deck is still using it (e.g. switching deck A to YouTube must not
    // kill playback on deck B).
    const otherDeckStillUsing = [...this.players.values()].some((p) => p === player);
    if (otherDeckStillUsing) {
      console.log(
        `🔗 Keeping Spotify SDK connected (deck ${playerId} removed, other deck still using it)`
      );
      return;
    }

    try {
      console.log(`🗑️ Destroying Spotify player ${playerId}`);
      player.disconnect();
      if (this.globalPlayerInstance === player) {
        this.globalPlayerInstance = null;
      }
    } catch (error) {
      console.error(`❌ Error destroying Spotify player ${playerId}:`, error);
    }
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
