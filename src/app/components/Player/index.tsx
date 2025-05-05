"use client";

import { useAppContext } from "@/app/AppContext";
import { useEffect, useRef, useState } from "react";

interface YouTubePlayer {
  destroy: () => void;
  playVideo: () => void;
  pauseVideo: () => void;
  stopVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getPlayerState: () => number;
}

interface YouTubePlayerEvent {
  target: YouTubePlayer;
  data: number;
}

declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: HTMLElement,
        options: {
          videoId: string;
          playerVars?: {
            autoplay?: number;
            controls?: number;
            modestbranding?: number;
            rel?: number;
          };
          events?: {
            onStateChange?: (event: YouTubePlayerEvent) => void;
          };
        }
      ) => YouTubePlayer;
      PlayerState: {
        PLAYING: number;
        PAUSED: number;
        ENDED: number;
      };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

export default function Player() {
  const {
    youtube: { selectedVideo, playlist, setSelectedVideo },
  } = useAppContext();
  const playerRef = useRef<YouTubePlayer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isApiReady, setIsApiReady] = useState(false);

  // Initialize YouTube API
  useEffect(() => {
    if (typeof window.YT === "undefined") {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        setIsApiReady(true);
      };
    } else {
      setIsApiReady(true);
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, []);

  // Initialize player when API is ready and video is selected
  useEffect(() => {
    if (!isApiReady || !selectedVideo || !containerRef.current) return;

    playerRef.current = new window.YT.Player(containerRef.current, {
      videoId: selectedVideo,
      playerVars: {
        autoplay: 1,
        controls: 1,
        modestbranding: 1,
        rel: 0,
      },
      events: {
        onStateChange: (event: YouTubePlayerEvent) => {
          if (event.data === window.YT.PlayerState.ENDED) {
            // Find the current video index in the playlist
            const currentIndex = playlist.findIndex(
              (video) => video.id.videoId === selectedVideo
            );

            // If there's a next video in the playlist, play it
            if (currentIndex < playlist.length - 1) {
              const nextVideo = playlist[currentIndex + 1];
              setSelectedVideo(nextVideo.id.videoId);
            }
          }
        },
      },
    });

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [isApiReady, selectedVideo, playlist, setSelectedVideo]);

  if (!selectedVideo) return null;

  return (
    <div className="w-full aspect-video bg-black rounded-lg overflow-hidden">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
