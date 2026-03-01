import { YouTubePlayerManager } from "./YouTubePlayerManager";
import { SpotifyPlayerManager } from "./SpotifyPlayerManager";
import { ServiceType, Song } from "@/app/types/playerTypes";
import { YoutubeVideo } from "@/app/types/youtubeTypes";

export interface PlayerInstance {
  id: string;
  service: ServiceType;
  isReady: boolean;
  isPlaying: boolean;
  currentTrack: Song | YoutubeVideo | null;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  lastActivity: number;
  errorCount: number;
  /** True when YouTube returned error 150/101 (embedding disabled by owner) */
  embedDisabled?: boolean;
}

export interface PlayerPool {
  A: PlayerInstance;
  B: PlayerInstance;
}

export interface CrossfadeState {
  isActive: boolean;
  fromDeck: "A" | "B" | null;
  toDeck: "A" | "B" | null;
  progress: number;
  startTime: number;
}

export class UnifiedPlayerManager {
  public youtubeManager: YouTubePlayerManager;
  public spotifyManager: SpotifyPlayerManager;
  private playerPool: PlayerPool;
  private crossfadeState: CrossfadeState;
  private isInitialized: boolean = false;
  private lastRecreationTime: { [key: string]: number } = { A: 0, B: 0 };
  private readonly RECREATION_COOLDOWN = 5000; // 5 seconds cooldown between recreations
  private lastAutoCrossfadeTime: { [key: string]: number } = { A: 0, B: 0 };
  private readonly AUTO_CROSSFADE_COOLDOWN = 10000; // 10 seconds cooldown between auto-crossfades
  private getSpotifyToken: (() => string | null) | null = null;
  private onEmbedDisabledCallback: ((deckId: "A" | "B") => void) | null = null;

  constructor() {
    this.youtubeManager = new YouTubePlayerManager();
    this.spotifyManager = new SpotifyPlayerManager();

    // Initialize player pool
    this.playerPool = {
      A: this.createPlayerInstance("A"),
      B: this.createPlayerInstance("B"),
    };

    // Debug: Log the initial player states
    console.log(`🔍 Constructor: Player A initial state:`, {
      isReady: this.playerPool.A.isReady,
      service: this.playerPool.A.service,
      volume: this.playerPool.A.volume,
    });
    console.log(`🔍 Constructor: Player B initial state:`, {
      isReady: this.playerPool.B.isReady,
      service: this.playerPool.B.service,
      volume: this.playerPool.B.volume,
    });

    this.crossfadeState = {
      isActive: false,
      fromDeck: null,
      toDeck: null,
      progress: 0,
      startTime: 0,
    };
  }

  /**
   * Set the Spotify token getter function
   */
  setSpotifyTokenGetter(tokenGetter: () => string | null): void {
    this.getSpotifyToken = tokenGetter;
  }

  /** Called when YouTube returns error 150/101 so the UI can refresh and show "Watch on YouTube" */
  setOnEmbedDisabled(callback: (deckId: "A" | "B") => void): void {
    this.onEmbedDisabledCallback = callback;
  }

  private createPlayerInstance(deckId: "A" | "B"): PlayerInstance {
    return {
      id: deckId,
      service: ServiceType.Youtube, // Default, will be set when first used
      isReady: true, // Ready to receive tracks by default
      isPlaying: false,
      currentTrack: null,
      currentTime: 0,
      duration: 0,
      volume: 75, // Set a reasonable default volume instead of 50
      isMuted: false,
      lastActivity: Date.now(),
      errorCount: 0,
    };
  }

  /**
   * Initialize the player manager and create base players
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log("🎯 Initializing UnifiedPlayerManager...");

      // Initialize both managers
      await Promise.all([
        this.youtubeManager.loadYouTubeAPI(),
        this.spotifyManager.loadSpotifySDK(),
      ]);

      this.isInitialized = true;
      console.log("✅ UnifiedPlayerManager initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize UnifiedPlayerManager:", error);
      throw error;
    }
  }

  /**
   * Load a track into a deck without destroying the player
   */
  async loadTrack(
    deckId: "A" | "B",
    track: Song | YoutubeVideo
  ): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const player = this.playerPool[deckId];
    const newService = this.getServiceType(track);

    // Debug: Log the initial player state (only if there are issues)
    if (!player.isReady || player.volume <= 0) {
      console.log(`🔍 Initial player ${deckId} state:`, {
        isReady: player.isReady,
        currentTrack: player.currentTrack,
        service: player.service,
        isPlaying: player.isPlaying,
        volume: player.volume,
      });
    }

    // Check if the deck is currently playing - warn user about potential interruption
    if (player.isPlaying && player.currentTrack) {
      console.log(
        `⚠️ Warning: Loading track into deck ${deckId} while it's currently playing. This may cause interruption.`
      );

      // For YouTube, this is more problematic as it requires player recreation
      if (
        newService === ServiceType.Youtube &&
        player.service === ServiceType.Youtube
      ) {
        console.log(
          `🚨 YouTube player recreation will interrupt currently playing track on deck ${deckId}`
        );
      }
    }

    console.log(`🎵 Loading track into deck ${deckId}:`, {
      trackTitle: this.getTrackTitle(track),
      service: newService,
      currentService: player.service,
      needsServiceChange: newService !== player.service,
      currentVolume: player.volume,
      currentMuted: player.isMuted,
      isReady: player.isReady,
      hasTrack: !!player.currentTrack,
      isPlaying: player.isPlaying,
    });

    try {
      // Only recreate player if service type changed
      if (newService !== player.service) {
        console.log(
          `🔄 Service type changed for deck ${deckId}, recreating player`
        );
        await this.recreatePlayer(deckId, newService);
      }

      // For YouTube: set track in state first so the UI can expand the container (min 200x200)
      // before we create the iframe. Then give the DOM a frame to layout.
      if (newService === ServiceType.Youtube) {
        this.updatePlayerState(deckId, {
          currentTrack: track,
          service: newService,
          lastActivity: Date.now(),
          embedDisabled: false,
        });
        this.onEmbedDisabledCallback?.(deckId);
        await new Promise((r) => requestAnimationFrame(r));
      }

      // Load the track into the existing player
      await this.loadTrackIntoPlayer(deckId, track);

      // Update player state (clear embedDisabled on new load)
      this.updatePlayerState(deckId, {
        currentTrack: track,
        service: newService,
        isReady: true,
        lastActivity: Date.now(),
        errorCount: 0,
        embedDisabled: false,
      });

      // Ensure player has a reasonable volume and set it
      let targetVolume = player.volume;
      if (targetVolume <= 0) {
        targetVolume = 75; // Use default volume if player has 0 volume
        console.log(
          `🔊 Player ${deckId} had 0 volume, setting to default ${targetVolume}`
        );

        // Update the player state with the new volume
        this.updatePlayerState(deckId, { volume: targetVolume });
      }

      // Ensure volume is set correctly after player is ready
      try {
        if (newService === ServiceType.Youtube) {
          await this.youtubeManager.setVolume(deckId, targetVolume);
          console.log(
            `🔊 Volume set for YouTube player ${deckId}: ${targetVolume}`
          );
        } else if (newService === ServiceType.Spotify) {
          await this.spotifyManager.setVolume(deckId, targetVolume);
          console.log(
            `🔊 Volume set for Spotify player ${deckId}: ${targetVolume}`
          );
        }
      } catch (error) {
        console.warn(`⚠️ Could not set volume for deck ${deckId}:`, error);
      }

      console.log(`✅ Track loaded successfully into deck ${deckId}`);
    } catch (error) {
      console.error(`❌ Failed to load track into deck ${deckId}:`, error);
      this.updatePlayerState(deckId, { errorCount: player.errorCount + 1 });
      throw error;
    }
  }

  /**
   * Recreate a player when service type changes or when in inconsistent state
   */
  private async recreatePlayer(
    deckId: "A" | "B",
    service: ServiceType
  ): Promise<void> {
    const currentPlayer = this.playerPool[deckId];

    console.log(
      `🔄 Recreating player for deck ${deckId} with service ${service}`
    );

    try {
      // Clean up existing player if it exists
      if (currentPlayer.service === ServiceType.Youtube) {
        try {
          await this.youtubeManager.destroyPlayer(deckId);
        } catch (error) {
          console.warn(
            `Warning: Could not destroy YouTube player ${deckId}:`,
            error
          );
        }
      } else if (currentPlayer.service === ServiceType.Spotify) {
        try {
          this.spotifyManager.destroyPlayer(deckId);
        } catch (error) {
          console.warn(
            `Warning: Could not destroy Spotify player ${deckId}:`,
            error
          );
        }
      }

      // Ensure we don't preserve 0 volume - use a reasonable default if volume is 0
      const preservedVolume =
        currentPlayer.volume > 0 ? currentPlayer.volume : 75;

      // Reset player state completely
      this.updatePlayerState(deckId, {
        service,
        isReady: true, // Keep ready so we can load tracks without triggering recreation again
        isPlaying: false,
        currentTrack: null,
        currentTime: 0,
        duration: 0,
        errorCount: 0,
        // Keep the volume setting for user preference, but ensure it's not 0
        volume: preservedVolume,
        isMuted: currentPlayer.isMuted,
        lastActivity: Date.now(),
      });

      // Volume preserved during recreation

      console.log(`✅ Player recreated for deck ${deckId}`);
    } catch (error) {
      console.error(`❌ Failed to recreate player for deck ${deckId}:`, error);
      throw error;
    }
  }

  /**
   * Load a track into an existing player
   */
  private async loadTrackIntoPlayer(
    deckId: "A" | "B",
    track: Song | YoutubeVideo
  ): Promise<void> {
    const service = this.getServiceType(track);
    const player = this.playerPool[deckId];

    if (service === ServiceType.Youtube) {
      const youtubeTrack = track as YoutubeVideo;
      const container = this.getYouTubeContainer(deckId);

      if (!container) {
        throw new Error(`YouTube container not found for deck ${deckId}`);
      }

      // For YouTube, try to reuse existing player or create new one only if needed
      const existingPlayer = this.youtubeManager.getPlayer(deckId);
      if (existingPlayer) {
        // Player exists, just load the new video without autoplay
        try {
          // Load video with autoplay disabled to prevent automatic playback
          existingPlayer.loadVideoById(youtubeTrack.id.videoId);
          // Ensure the player is paused after loading to prevent autoplay
          existingPlayer.pauseVideo();
          console.log(
            `✅ Loaded video ${youtubeTrack.id.videoId} into existing player ${deckId} (autoplay disabled)`
          );
        } catch (error) {
          console.log(
            `🔄 Failed to load video into existing player, creating new one:`,
            error
          );
          await this.youtubeManager.createPlayer(
            deckId,
            youtubeTrack.id.videoId,
            container,
            {
              onEmbedDisabled: () => {
                this.updatePlayerState(deckId, { embedDisabled: true });
                this.onEmbedDisabledCallback?.(deckId);
              },
            }
          );
        }
      } else {
        // No existing player, create new one
        await this.youtubeManager.createPlayer(
          deckId,
          youtubeTrack.id.videoId,
          container,
          {
            onEmbedDisabled: () => {
              this.updatePlayerState(deckId, { embedDisabled: true });
              this.onEmbedDisabledCallback?.(deckId);
            },
          }
        );
      }

      // Wait a bit for the player to be ready, then set volume
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Set volume immediately after player creation to avoid 0 volume
      let targetVolume = player.volume;
      if (targetVolume <= 0) {
        targetVolume = 75; // Use default volume if player has 0 volume
      }

      await this.youtubeManager.setVolume(deckId, targetVolume);
      // Volume setting is logged in the main loadTrack method
    } else if (service === ServiceType.Spotify) {
      const spotifyTrack = track as Song;

      // Get token from the token getter function (session-based)
      const token = this.getSpotifyToken ? this.getSpotifyToken() : null;

      if (!token) {
        throw new Error("No Spotify token available");
      }

      // Reuse existing Spotify player if present to avoid disconnecting (keeps other deck's device valid)
      const existingSpotifyPlayer = this.spotifyManager.getPlayer(deckId);
      if (existingSpotifyPlayer) {
        this.spotifyManager.loadTrackIntoExistingPlayer(deckId, spotifyTrack.id, token);
      } else {
        await this.spotifyManager.createPlayer(deckId, spotifyTrack.id, token);
      }

      // Set volume immediately after player creation to avoid 0 volume
      let targetVolume = player.volume;
      if (targetVolume <= 0) {
        targetVolume = 75; // Use default volume if player has 0 volume
      }

      await this.spotifyManager.setVolume(deckId, targetVolume);
      // Volume setting is logged in the main loadTrack method
    }
  }

  /**
   * Play a track on a specific deck
   * @deprecated Use the hook's playDeck method instead
   */
  async playDeck(deckId: "A" | "B"): Promise<void> {
    console.warn(
      "playDeck is deprecated. Use the hook's playDeck method instead."
    );

    // For internal crossfade usage, we still need to implement the logic
    const player = this.playerPool[deckId];

    if (!player.isReady || !player.currentTrack) {
      throw new Error(`Deck ${deckId} is not ready to play`);
    }

    try {
      if (player.service === ServiceType.Youtube) {
        this.youtubeManager.playPlayer(deckId);
      } else if (player.service === ServiceType.Spotify) {
        const trackId = (player.currentTrack as Song).id;
        await this.spotifyManager.playTrack(deckId, trackId);
      }

      this.updatePlayerState(deckId, {
        isPlaying: true,
        lastActivity: Date.now(),
      });
    } catch (error) {
      console.error(`❌ Failed to play deck ${deckId}:`, error);
      throw error;
    }
  }

  /**
   * Pause a deck
   * @deprecated Use the hook's pauseDeck method instead
   */
  async pauseDeck(deckId: "A" | "B"): Promise<void> {
    console.warn(
      "pauseDeck is deprecated. Use the hook's pauseDeck method instead."
    );

    // For internal usage, we still need to implement the logic
    const player = this.playerPool[deckId];

    if (!player.isReady) return;

    try {
      if (player.service === ServiceType.Youtube) {
        this.youtubeManager.pausePlayer(deckId);
      } else if (player.service === ServiceType.Spotify) {
        await this.spotifyManager.pausePlayer(deckId);
      }

      this.updatePlayerState(deckId, {
        isPlaying: false,
        lastActivity: Date.now(),
      });
    } catch (error) {
      console.error(`❌ Failed to pause deck ${deckId}:`, error);
      throw error;
    }
  }

  /**
   * Stop a deck
   * @deprecated Use the hook's stopDeck method instead
   */
  async stopDeck(deckId: "A" | "B"): Promise<void> {
    console.warn(
      "stopDeck is deprecated. Use the hook's stopDeck method instead."
    );

    // For internal usage, we still need to implement the logic
    const player = this.playerPool[deckId];

    if (!player.isReady) return;

    try {
      if (player.service === ServiceType.Youtube) {
        this.youtubeManager.stopPlayer(deckId);
      } else if (player.service === ServiceType.Spotify) {
        await this.spotifyManager.pausePlayer(deckId);
      }

      this.updatePlayerState(deckId, {
        isPlaying: false,
        currentTime: 0,
        lastActivity: Date.now(),
      });
    } catch (error) {
      console.error(`❌ Failed to stop deck ${deckId}:`, error);
      throw error;
    }
  }

  /**
   * Set volume for a deck
   * @deprecated Use the hook's setDeckVolume method instead
   */
  async setDeckVolume(deckId: "A" | "B", volume: number): Promise<void> {
    console.warn(
      "setDeckVolume is deprecated. Use the hook's setDeckVolume method instead."
    );

    // For internal usage, we still need to implement the logic
    const player = this.playerPool[deckId];

    if (!player.isReady) return;

    try {
      if (player.service === ServiceType.Youtube) {
        this.youtubeManager.setVolume(deckId, volume);
      } else if (player.service === ServiceType.Spotify) {
        await this.spotifyManager.setVolume(deckId, volume);
      }

      this.updatePlayerState(deckId, {
        volume,
        lastActivity: Date.now(),
      });
    } catch (error) {
      console.error(`❌ Failed to set volume for deck ${deckId}:`, error);
      throw error;
    }
  }

  /**
   * Seek to position in a deck
   * @deprecated Use the hook's seekDeck method instead
   */
  async seekDeck(deckId: "A" | "B", position: number): Promise<void> {
    console.warn(
      "seekDeck is deprecated. Use the hook's seekDeck method instead."
    );

    // For internal usage, we still need to implement the logic
    const player = this.playerPool[deckId];

    if (!player.isReady) return;

    try {
      if (player.service === ServiceType.Youtube) {
        this.youtubeManager.seekPlayer(deckId, position / 1000);
      } else if (player.service === ServiceType.Spotify) {
        const spotifyPlayer = this.spotifyManager.getPlayer(deckId);
        if (spotifyPlayer && typeof spotifyPlayer.seek === "function") {
          await spotifyPlayer.seek(position);
        }
      }

      this.updatePlayerState(deckId, {
        currentTime: position,
        lastActivity: Date.now(),
      });
    } catch (error) {
      console.error(`❌ Failed to seek deck ${deckId}:`, error);
      throw error;
    }
  }

  /**
   * Start crossfade between decks
   */
  async startCrossfade(
    fromDeck: "A" | "B",
    toDeck: "A" | "B",
    duration: number = 2000
  ): Promise<void> {
    if (this.crossfadeState.isActive) {
      throw new Error("Crossfade already in progress");
    }

    const fromPlayer = this.playerPool[fromDeck];
    const toPlayer = this.playerPool[toDeck];

    if (!fromPlayer.isReady || !toPlayer.isReady) {
      throw new Error("Both decks must be ready for crossfade");
    }

    console.log(`🔄 Starting crossfade from ${fromDeck} to ${toDeck}`);

    this.crossfadeState = {
      isActive: true,
      fromDeck,
      toDeck,
      progress: 0,
      startTime: Date.now(),
    };

    try {
      // Start the target deck if not already playing (use service managers directly to avoid deprecation warnings)
      if (!toPlayer.isPlaying) {
        try {
          if (toPlayer.service === ServiceType.Youtube) {
            this.youtubeManager.playPlayer(toDeck);
          } else if (toPlayer.service === ServiceType.Spotify && toPlayer.currentTrack) {
            await this.spotifyManager.playTrack(toDeck, (toPlayer.currentTrack as Song).id);
          }
          this.updatePlayerState(toDeck, { isPlaying: true, lastActivity: Date.now() });
        } catch (playError) {
          console.error(
            `❌ Failed to start target deck ${toDeck} during crossfade:`,
            playError
          );

          if (
            playError instanceof Error &&
            (playError.message === "SPOTIFY_NO_ACTIVE_DEVICE" ||
              playError.message.includes("device not available"))
          ) {
            throw new Error("SPOTIFY_NO_ACTIVE_DEVICE");
          }

          throw new Error(
            `Failed to start target deck ${toDeck}: ${
              playError instanceof Error ? playError.message : "Unknown error"
            }`
          );
        }
      }

      // Perform crossfade
      await this.performCrossfade(fromDeck, toDeck, duration);

      // Complete crossfade
      await this.completeCrossfade(fromDeck, toDeck);

      console.log(`✅ Crossfade completed from ${fromDeck} to ${toDeck}`);
    } catch (error) {
      console.error(`❌ Crossfade failed:`, error);
      this.resetCrossfade();
      throw error;
    }
  }

  /** Smoothstep (ease-in-out) for smoother perceived volume transition */
  private static easeInOut(t: number): number {
    return t * t * (3 - 2 * t);
  }

  /**
   * Perform the actual crossfade
   */
  private async performCrossfade(
    fromDeck: "A" | "B",
    toDeck: "A" | "B",
    duration: number
  ): Promise<void> {
    // More steps = smoother; ~40–50ms per step for fluid motion (YouTube-like)
    const steps = Math.max(20, Math.round(duration / 45));
    const stepDuration = duration / steps;

    // Store original volumes to restore them properly
    const fromOriginalVolume = this.playerPool[fromDeck].volume;
    let toOriginalVolume = this.playerPool[toDeck].volume;

    // Ensure target deck has a reasonable volume for crossfade
    if (toOriginalVolume <= 0) {
      toOriginalVolume = 75; // Use default volume if target deck has 0 volume
      console.log(
        `🔊 Target deck ${toDeck} had 0 volume, using default ${toOriginalVolume} for crossfade`
      );
    }

    console.log(`🔄 Starting crossfade from deck ${fromDeck} to ${toDeck}`);

    const fromP = this.playerPool[fromDeck];
    const toP = this.playerPool[toDeck];

    for (let i = 0; i <= steps; i++) {
      const linearProgress = i / steps;
      const progress = UnifiedPlayerManager.easeInOut(linearProgress);

      const fromVolume = Math.max(0, fromOriginalVolume * (1 - progress));
      const toVolume = Math.min(100, toOriginalVolume * progress);
      const fromVolR = Math.round(fromVolume);
      const toVolR = Math.round(toVolume);

      if (fromP.isReady) {
        if (fromP.service === ServiceType.Youtube) this.youtubeManager.setVolume(fromDeck, fromVolR);
        else if (fromP.service === ServiceType.Spotify) this.spotifyManager.setVolume(fromDeck, fromVolume, { quiet: true }).catch(() => {});
        this.updatePlayerState(fromDeck, { volume: fromVolR, lastActivity: Date.now() });
      }
      if (toP.isReady) {
        if (toP.service === ServiceType.Youtube) this.youtubeManager.setVolume(toDeck, toVolR);
        else if (toP.service === ServiceType.Spotify) this.spotifyManager.setVolume(toDeck, toVolume, { quiet: true }).catch(() => {});
        this.updatePlayerState(toDeck, { volume: toVolR, lastActivity: Date.now() });
      }

      this.crossfadeState.progress = linearProgress * 100;

      await new Promise((resolve) => setTimeout(resolve, stepDuration));
    }
  }

  /**
   * Complete the crossfade
   */
  private async completeCrossfade(
    fromDeck: "A" | "B",
    toDeck: "A" | "B"
  ): Promise<void> {
    try {
      // Stop the source deck via service managers directly (avoid deprecation warnings).
      // For Spotify we must NOT pause: both decks use one device, so pausing would stop the
      // track that is now playing (the target deck). Only update our state.
      const fromPlayer = this.playerPool[fromDeck];
      if (fromPlayer.isReady) {
        if (fromPlayer.service === ServiceType.Youtube) {
          this.youtubeManager.stopPlayer(fromDeck);
        }
        this.updatePlayerState(fromDeck, { isPlaying: false, currentTime: 0, lastActivity: Date.now() });
      }

      // Get the target deck's original volume from the player pool
      const toPlayer = this.playerPool[toDeck];

      // Ensure target deck has a reasonable volume
      let finalVolume = toPlayer.volume;
      if (finalVolume <= 0) {
        finalVolume = 75; // Use default volume if target deck has 0 volume
      }

      // Restore target deck to its proper volume via service manager directly
      if (toPlayer.isReady) {
        if (toPlayer.service === ServiceType.Youtube) this.youtubeManager.setVolume(toDeck, finalVolume);
        else if (toPlayer.service === ServiceType.Spotify) await this.spotifyManager.setVolume(toDeck, finalVolume);
        this.updatePlayerState(toDeck, { volume: finalVolume, lastActivity: Date.now() });
      }

      // Clear video container if crossfading from YouTube to another service
      if (fromPlayer.service === ServiceType.Youtube) {
        console.log(
          `🧹 Clearing YouTube video container for deck ${fromDeck} after crossfade`
        );
        this.youtubeManager.clearVideoContainer(fromDeck);
      }

      // Reset source deck to be ready for new tracks
      await this.resetDeckAfterCrossfade(fromDeck);

      // Reset crossfade state
      this.resetCrossfade();
    } catch (error) {
      console.error(`❌ Error during crossfade completion:`, error);

      // Even if there's an error, try to reset the crossfade state
      this.resetCrossfade();

      // Re-throw the error so the calling code can handle it
      throw error;
    }
  }

  /**
   * Reset crossfade state
   */
  private resetCrossfade(): void {
    this.crossfadeState = {
      isActive: false,
      fromDeck: null,
      toDeck: null,
      progress: 0,
      startTime: 0,
    };
  }

  /**
   * Clear a deck (remove track but keep player)
   */
  async clearDeck(deckId: "A" | "B"): Promise<void> {
    const player = this.playerPool[deckId];

    if (!player.isReady) return;

    try {
      // Stop playback
      await this.stopDeck(deckId);

      // Clear video container if it's a YouTube deck
      if (player.service === ServiceType.Youtube) {
        this.youtubeManager.clearVideoContainer(deckId);
      }

      // Clear track info but keep player ready for new tracks
      this.updatePlayerState(deckId, {
        currentTrack: null,
        isReady: true, // Keep ready for new tracks
        currentTime: 0,
        duration: 0,
        lastActivity: Date.now(),
        // Keep volume and other settings
      });

      console.log(`🧹 Cleared deck ${deckId}`);
    } catch (error) {
      console.error(`❌ Failed to clear deck ${deckId}:`, error);
      throw error;
    }
  }

  /**
   * Reset a deck after crossfade completion (make it ready for new tracks)
   */
  async resetDeckAfterCrossfade(deckId: "A" | "B"): Promise<void> {
    const player = this.playerPool[deckId];

    try {
      // Stop any remaining playback. Skip for Spotify: both decks share one device, so
      // stopDeck would pause that device and stop the other deck's track.
      if (player.isPlaying && player.service !== ServiceType.Spotify) {
        await this.stopDeck(deckId);
      }

      // Clear video container if it's a YouTube deck
      if (player.service === ServiceType.Youtube) {
        this.youtubeManager.clearVideoContainer(deckId);
      }

      // Reset to a clean state but keep volume settings
      this.updatePlayerState(deckId, {
        currentTrack: null,
        isReady: true, // Ready for new tracks
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        lastActivity: Date.now(),
        errorCount: 0,
        // Keep volume and mute settings for user preference
      });

      console.log(
        `🔄 Reset deck ${deckId} after crossfade - ready for new tracks`
      );
    } catch (error) {
      console.error(
        `❌ Failed to reset deck ${deckId} after crossfade:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get current player state
   */
  getPlayerState(deckId: "A" | "B"): PlayerInstance {
    return this.playerPool[deckId];
  }

  /**
   * Update progress for all players
   */
  async updateProgress(): Promise<void> {
    for (const deckId of ["A", "B"] as const) {
      const player = this.playerPool[deckId];

      // If player is ready and has a track, get current progress from the service managers
      if (player.isReady && player.currentTrack) {
        try {
          if (player.service === ServiceType.Youtube) {
            // Get current time and duration from YouTube manager
            const currentTime =
              this.youtubeManager.getCurrentTime(deckId) * 1000; // Convert to milliseconds
            const duration = this.youtubeManager.getDuration(deckId) * 1000; // Convert to milliseconds

            // Update the player state with current progress
            this.updatePlayerState(deckId, {
              currentTime,
              duration,
            });
          } else if (player.service === ServiceType.Spotify) {
            // Only advance progress for the deck that is actually playing (Spotify has one active playback)
            if (player.isPlaying) {
              await this.spotifyManager.updatePlayerState(deckId);
              const currentTime = this.spotifyManager.getCurrentTime(deckId);
              const duration = this.spotifyManager.getDuration(deckId);
              this.updatePlayerState(deckId, {
                currentTime,
                duration,
              });
            }
            // Non-playing deck: keep existing currentTime/duration so progress bar doesn't move
          }
        } catch (error) {
          console.warn(`⚠️ Error getting progress for deck ${deckId}:`, error);
        }
      }
    }
  }

  /**
   * Get crossfade state
   */
  getCrossfadeState(): CrossfadeState {
    return this.crossfadeState;
  }

  /**
   * Check if crossfade is active
   */
  isCrossfadeActive(): boolean {
    return this.crossfadeState.isActive;
  }

  /**
   * Check if a player is actually ready and functional
   */
  async isPlayerActuallyReady(deckId: "A" | "B"): Promise<boolean> {
    const player = this.playerPool[deckId];

    if (!player.isReady) {
      return false;
    }

    // If there's no track, the player is ready if it's marked as ready
    // (no need to check YouTube/Spotify infrastructure yet)
    if (!player.currentTrack) {
      return player.isReady; // If player instance is marked ready, it's ready
    }

    try {
      if (player.service === ServiceType.Youtube) {
        // Check if the YouTube player actually exists and is functional
        const isReady = this.youtubeManager.isPlayerReady(deckId);

        // If player is ready and playing, consider it healthy
        if (isReady && player.isPlaying) {
          const playerState = this.youtubeManager.getPlayerState(deckId);
          // YouTube player state 3 = buffering, 5 = cued, 1 = playing
          if (playerState === 3 || playerState === 5) {
            return true; // Don't recreate while buffering
          } else if (playerState === 1) {
            // Player is playing - this is healthy, don't recreate
            return true;
          }
        }

        // If player is ready but not playing, it might be paused - this is also healthy
        if (isReady && !player.isPlaying) {
          return true;
        }

        return isReady;
      } else if (player.service === ServiceType.Spotify) {
        // Check if the Spotify player actually exists and is functional
        const spotifyPlayer = this.spotifyManager.getPlayer(deckId);
        return !!spotifyPlayer;
      }
      return false;
    } catch (error) {
      console.warn(
        `Error checking if player ${deckId} is actually ready:`,
        error
      );
      return false;
    }
  }

  /**
   * Recreate a player if it's marked as ready but not actually functional
   */
  async recreatePlayerIfNeeded(deckId: "A" | "B"): Promise<void> {
    const player = this.playerPool[deckId];
    const now = Date.now();

    if (!player.isReady || !player.currentTrack) {
      return; // Nothing to recreate
    }

    // Check cooldown to prevent excessive recreation
    if (now - this.lastRecreationTime[deckId] < this.RECREATION_COOLDOWN) {
      return;
    }

    try {
      const isActuallyReady = await this.isPlayerActuallyReady(deckId);
      if (!isActuallyReady) {
        // Player needs recreation due to functional issues

        // Update recreation timestamp
        this.lastRecreationTime[deckId] = now;

        await this.recreatePlayer(deckId, player.service);

        // Reload the track
        if (player.currentTrack) {
          await this.loadTrackIntoPlayer(deckId, player.currentTrack);
          this.updatePlayerState(deckId, {
            isReady: true,
            lastActivity: Date.now(),
          });
          // Player successfully recreated and track reloaded
        }
      }
    } catch (error) {
      console.error(`❌ Failed to recreate player ${deckId}:`, error);
      // Mark as not ready if recreation fails
      this.updatePlayerState(deckId, {
        isReady: false,
        isPlaying: false,
      });
    }
  }

  /**
   * Update player state
   */
  public updatePlayerState(
    deckId: "A" | "B",
    updates: Partial<PlayerInstance>
  ): void {
    const oldState = { ...this.playerPool[deckId] };
    this.playerPool[deckId] = {
      ...this.playerPool[deckId],
      ...updates,
    };

    // Debug: Log state changes (only for critical changes)
    if (updates.isReady !== undefined && updates.isReady !== oldState.isReady) {
      console.log(
        `🔍 State change for ${deckId}: isReady ${oldState.isReady} → ${updates.isReady}`
      );
    }
  }

  /**
   * Check if a track is ending soon (within the crossfade threshold)
   */
  isTrackEndingSoon(deckId: "A" | "B", thresholdSeconds: number = 10): boolean {
    const player = this.playerPool[deckId];

    if (!player.isReady || !player.currentTrack || !player.isPlaying) {
      return false;
    }

    // Don't trigger crossfade if we don't have valid duration/time data
    if (player.duration <= 0 || player.currentTime <= 0) {
      return false;
    }

    // Ensure we have a reasonable duration (at least 30 seconds) before considering crossfade
    if (player.duration < 30000) {
      // 30 seconds in milliseconds
      return false;
    }

    const remainingTime = (player.duration - player.currentTime) / 1000;

    // Only trigger crossfade if track is actually ending soon
    return remainingTime <= thresholdSeconds && remainingTime > 0;
  }

  /**
   * Get the other deck ID
   */
  private getOtherDeck(deckId: "A" | "B"): "A" | "B" {
    return deckId === "A" ? "B" : "A";
  }

  /**
   * Check if auto-crossfade should be triggered
   */
  shouldAutoCrossfade(): boolean {
    // Auto-crossfade is disabled - use useSmartCrossfade hook instead
    // This prevents automatic crossfade and allows user-controlled crossfade
    return false;
  }

  /**
   * Trigger auto-crossfade if conditions are met
   */
  public async triggerAutoCrossfadeIfNeeded(deckId: "A" | "B"): Promise<void> {
    if (this.shouldAutoCrossfade()) {
      const otherDeck = this.getOtherDeck(deckId);
      console.log(`🔄 Auto-crossfade triggered from ${deckId} to ${otherDeck}`);

      // Set cooldown to prevent immediate re-triggering
      this.lastAutoCrossfadeTime[deckId] = Date.now();

      try {
        await this.startCrossfade(deckId, otherDeck, 3000); // 3 second auto-crossfade
      } catch (error) {
        console.error(`❌ Auto-crossfade failed:`, error);
      }
    }
  }

  /**
   * Get service type from track
   */
  private getServiceType(track: Song | YoutubeVideo): ServiceType {
    if ("type" in track) {
      return track.type;
    }
    return ServiceType.Youtube;
  }

  /**
   * Get track ID
   */
  private getTrackId(track: Song | YoutubeVideo): string {
    if ("type" in track) {
      return track.id; // Spotify track ID
    }
    return track.id.videoId; // YouTube video ID
  }

  /**
   * Get track title
   */
  private getTrackTitle(track: Song | YoutubeVideo): string {
    if ("type" in track) {
      return track.title;
    }
    return track.snippet.title;
  }

  /**
   * Get YouTube container for a deck
   */
  private getYouTubeContainer(deckId: "A" | "B"): HTMLDivElement | null {
    return document.getElementById(
      `youtube-player-${deckId}`
    ) as HTMLDivElement;
  }

  /**
   * Cleanup all resources
   */
  async destroy(): Promise<void> {
    try {
      await Promise.all([
        this.youtubeManager.destroyAll(),
        this.spotifyManager.destroyAll(),
      ]);

      this.isInitialized = false;
      console.log("✅ UnifiedPlayerManager destroyed successfully");
    } catch (error) {
      console.error("❌ Error destroying UnifiedPlayerManager:", error);
    }
  }
}
