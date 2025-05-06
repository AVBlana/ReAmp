declare module "spotify-web-playback-sdk" {
  export class Player {
    constructor(options: PlayerOptions);
    connect(): Promise<boolean>;
    disconnect(): void;
    resume(): Promise<void>;
    pause(): void;
    seek(position_ms: number): Promise<void>;
    setVolume(volume: number): Promise<void>;
    getCurrentState(): Promise<PlaybackState | undefined>;
    addListener(
      event: "ready" | "not_ready",
      callback: (data: { device_id: string }) => void
    ): void;
    addListener(
      event: "player_state_changed",
      callback: (state: PlaybackState | null) => void
    ): void;
    addListener(
      event:
        | "initialization_error"
        | "authentication_error"
        | "account_error"
        | "playback_error",
      callback: (error: { message: string }) => void
    ): void;
    removeListener(event: string, callback?: (data: unknown) => void): void;
  }

  export interface PlayerOptions {
    name: string;
    getOAuthToken: (cb: (token: string) => void) => void;
    volume?: number;
  }

  export interface PlaybackState {
    paused: boolean;
    position: number;
    duration: number;
    track_window: {
      current_track: Track;
      previous_tracks: Track[];
      next_tracks: Track[];
    };
    volume: number;
  }

  export interface Track {
    id: string;
    uri: string;
    name: string;
    artists: {
      uri: string;
      name: string;
    }[];
    album: {
      uri: string;
      name: string;
      images: {
        url: string;
      }[];
    };
  }
}

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    Spotify: {
      Player: typeof import("spotify-web-playback-sdk").Player;
    };
  }
}
