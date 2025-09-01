declare global {
  interface Window {
    YT: {
      Player: new (
        element: HTMLElement | string,
        options: {
          videoId?: string;
          playerVars?: {
            autoplay?: number;
            modestbranding?: number;
            rel?: number;
            enablejsapi?: number;
            playsinline?: number;
            controls?: number;
          };
          events?: {
            onReady?: (event: { target: YouTubePlayer }) => void;
            onStateChange?: (event: {
              data: number;
              target: YouTubePlayer;
            }) => void;
            onError?: (event: { data: number }) => void;
          };
        }
      ) => YouTubePlayer;
      PlayerState: {
        UNSTARTED: -1;
        ENDED: 0;
        PLAYING: 1;
        PAUSED: 2;
        BUFFERING: 3;
        CUED: 5;
      };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

export interface YouTubePlayer {
  playVideo(): void;
  pauseVideo(): void;
  stopVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  loadVideoById(videoId: string): void;
  cueVideoById(videoId: string): void;
  mute(): void;
  unMute(): void;
  isMuted(): boolean;
  setVolume(volume: number): void;
  getVolume(): number;
  getPlayerState(): number;
  getCurrentTime(): number;
  getDuration(): number;
  getVideoData(): {
    video_id: string;
    video_title: string;
    author: string;
  };
  destroy(): void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addEventListener(event: string, listener: (event: any) => void): void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  removeEventListener(event: string, listener: (event: any) => void): void;
}

export {};
