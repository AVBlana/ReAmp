declare global {
  interface Window {
    Spotify: {
      Player: new (options: {
        name: string;
        getOAuthToken: (cb: (token: string) => void) => void;
        volume?: number;
      }) => SpotifyPlayer;
    };
  }
}

export interface SpotifyPlayer {
  connect(): Promise<boolean>;
  disconnect(): void;
  pause(): Promise<void>;
  resume(): Promise<void>;
  seek(position_ms: number): Promise<void>;
  setVolume?(volume: number): Promise<void>;
  getCurrentState(): Promise<SpotifyPlaybackState | null>;
  addListener(
    event: "ready",
    callback: (data: { device_id: string }) => void
  ): void;
  addListener(
    event: "not_ready",
    callback: (data: { device_id: string }) => void
  ): void;
  addListener(
    event: "player_state_changed",
    callback: (state: SpotifyPlaybackState | null) => void
  ): void;
  addListener(
    event:
      | "initialization_error"
      | "authentication_error"
      | "account_error"
      | "playback_error",
    callback: (error: { message: string }) => void
  ): void;
  removeListener(event: string, callback?: (...args: unknown[]) => void): void;
  _options?: { device_id?: string };
}

export interface SpotifyPlaybackState {
  position: number;
  duration: number;
  paused: boolean;
  track_window?: {
    current_track: SpotifyTrack;
    previous_tracks: SpotifyTrack[];
    next_tracks: SpotifyTrack[];
  };
  volume?: number;
}

export interface SpotifyTrack {
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

export {};
