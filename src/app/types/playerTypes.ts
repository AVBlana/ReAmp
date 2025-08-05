export enum ServiceType {
  Spotify = "spotify",
  Youtube = "youtube",
}

export interface Artwork {
  width: number;
  height: number;
  url: string;
}

export interface Song {
  id: string;
  type: ServiceType;
  artwork: {
    small: Artwork;
    medium: Artwork;
    big: Artwork;
  };
  title: string;
  artist: {
    id: string;
    name: string;
  };
  duration?: number; // Duration in milliseconds
}

export type PlayerActualState = {
  position: number;
  isPlaying: boolean;
  isDone: boolean;
};
