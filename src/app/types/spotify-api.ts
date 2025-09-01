// Spotify Web Playback SDK Type Definitions

export interface SpotifyPlayer {
  connect(): Promise<boolean>;
  disconnect(): void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addListener(event: string, callback: (...args: any[]) => void): void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  removeListener(event: string, callback: (...args: any[]) => void): void;
  getCurrentState(): Promise<SpotifyPlaybackState | null>;
  setName(name: string): Promise<void>;
  getVolume(): Promise<number>;
  setVolume(volume: number): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  togglePlay(): Promise<void>;
  seek(position_ms: number): Promise<void>;
  previousTrack(): Promise<void>;
  nextTrack(): Promise<void>;
  activateElement(): Promise<void>;
  _options?: {
    device_id?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };
}

export interface SpotifyPlaybackState {
  context: {
    uri: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metadata: any;
  };
  disallows: {
    pausing: boolean;
    peeking_next: boolean;
    peeking_prev: boolean;
    resuming: boolean;
    seeking: boolean;
    skipping_next: boolean;
    skipping_prev: boolean;
  };
  duration: number;
  is_playing: boolean;
  item: {
    id: string;
    uri: string;
    type: string;
    media_type: string;
    name: string;
    is_playable: boolean;
    album: {
      uri: string;
      name: string;
      images: Array<{
        url: string;
        height: number;
        width: number;
      }>;
    };
    artists: Array<{
      uri: string;
      name: string;
    }>;
  };
  progress_ms: number;
  timestamp: number;
  is_paused: boolean;
  position: number;
  paused: boolean;
}

// Global Spotify SDK declaration
declare global {
  interface Window {
    Spotify: {
      Player: new (config: {
        name: string;
        getOAuthToken: (callback: (token: string) => void) => void;
      }) => SpotifyPlayer;
    };
  }
}

