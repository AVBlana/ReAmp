declare namespace Spotify {
  class Player {
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
    removeListener(event: string, callback: (data: unknown) => void): void;
  }

  interface PlayerOptions {
    name: string;
    getOAuthToken: (cb: (token: string) => void) => void;
    volume?: number;
  }

  interface PlaybackState {
    paused: boolean;
    position: number;
    duration: number;
    track_window: {
      current_track: Track;
      previous_tracks: Track[];
    };
    volume: number;
  }

  interface Track {
    id: string;
    uri: string;
    name: string;
    artists: Artist[];
    album: Album;
  }

  interface Artist {
    name: string;
    id: string;
    uri: string;
  }

  interface Album {
    name: string;
    id: string;
    uri: string;
    images: Image[];
  }

  interface Image {
    height: number;
    width: number;
    url: string;
  }
}

declare global {
  interface Window {
    Spotify: {
      Player: typeof Spotify.Player;
    };
  }
}
