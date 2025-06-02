"use client";

import { useYoutube } from "@/context/UnifiedContext";
import { useEffect, useRef, useState, useCallback } from "react";
import { YoutubeVideo } from "../Services/YtService";

interface YouTubeEvent {
  target: YouTubePlayer;
  data: number;
}

interface YouTubePlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number) => void;
  getPlayerState: () => number;
  getCurrentTime: () => number;
  getDuration: () => number;
  addEventListener: (
    event: string,
    listener: (event: YouTubeEvent) => void
  ) => void;
  removeEventListener: (
    event: string,
    listener: (event: YouTubeEvent) => void
  ) => void;
  destroy: () => void;
}

interface YouTubeAPI {
  Player: new (
    elementId: HTMLElement,
    options: {
      videoId: string;
      playerVars: {
        autoplay: number;
        modestbranding: number;
        rel: number;
        enablejsapi: number;
        playsinline: number;
        controls: number;
      };
      events: {
        onReady: (event: YouTubeEvent) => void;
        onStateChange: (event: YouTubeEvent) => void;
      };
    }
  ) => YouTubePlayer;
  PlayerState: {
    ENDED: number;
    PLAYING: number;
    PAUSED: number;
    BUFFERING: number;
    CUED: number;
    UNSTARTED: number;
  };
}

declare global {
  interface Window {
    YT: YouTubeAPI;
    onYouTubeIframeAPIReady: () => void;
  }
}

const Player: React.FC = () => {
  const { selectedVideo, setSelectedVideo, playlist } = useYoutube();
  const playerRef = useRef<YouTubePlayer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isApiReady, setIsApiReady] = useState(false);

  const handleStateChange = useCallback(
    (event: YouTubeEvent) => {
      const state = event.data;

      // Handle video end
      if (state === window.YT.PlayerState.ENDED) {
        // Find the current video index in the playlist
        const currentIndex = playlist.findIndex(
          (video: YoutubeVideo) => video.id.videoId === selectedVideo
        );

        // If there's a next video in the playlist, play it
        if (currentIndex < playlist.length - 1) {
          const nextVideo = playlist[currentIndex + 1];
          setSelectedVideo(nextVideo.id.videoId);
        }
      }
    },
    [playlist, selectedVideo, setSelectedVideo]
  );

  useEffect(() => {
    // Load the YouTube IFrame API
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      setIsApiReady(true);
    };

    return () => {
      if (playerRef.current) {
        playerRef.current.removeEventListener(
          "onStateChange",
          handleStateChange
        );
      }
    };
  }, [handleStateChange]);

  useEffect(() => {
    if (!isApiReady || !selectedVideo || !containerRef.current) return;

    // Create new player instance
    const player = new window.YT.Player(containerRef.current, {
      videoId: selectedVideo,
      playerVars: {
        autoplay: 1,
        modestbranding: 1,
        rel: 0,
        enablejsapi: 1,
        playsinline: 1,
        controls: 1,
      },
      events: {
        onReady: (event: YouTubeEvent) => {
          event.target.playVideo();
        },
        onStateChange: handleStateChange,
      },
    });

    playerRef.current = player;

    return () => {
      // Cleanup: destroy the player instance
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [isApiReady, selectedVideo, handleStateChange]);

  // Add a progress check effect
  useEffect(() => {
    if (!playerRef.current || !selectedVideo) return;

    const checkProgress = setInterval(() => {
      if (playerRef.current) {
        try {
          const currentTime = playerRef.current.getCurrentTime();
          const duration = playerRef.current.getDuration();
          const state = playerRef.current.getPlayerState();

          // If we're at the end and the video is still playing
          if (
            state === window.YT.PlayerState.PLAYING &&
            Math.abs(currentTime - duration) < 0.1
          ) {
            // Force the video to end
            playerRef.current.seekTo(duration);
          }
        } catch (error) {
          console.error("Error checking video progress:", error);
        }
      }
    }, 1000);

    return () => clearInterval(checkProgress);
  }, [selectedVideo]);

  if (!selectedVideo) return null;

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
};

export default Player;
