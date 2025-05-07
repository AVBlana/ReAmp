"use client";

import { useYoutube } from "@/context/UnifiedContext";
import { useEffect, useRef, useState } from "react";
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
  }, []);

  useEffect(() => {
    if (!isApiReady || !selectedVideo || !containerRef.current) return;

    if (playerRef.current) {
      playerRef.current.removeEventListener("onStateChange", handleStateChange);
    }

    playerRef.current = new window.YT.Player(containerRef.current, {
      videoId: selectedVideo,
      playerVars: {
        autoplay: 1,
        modestbranding: 1,
        rel: 0,
      },
      events: {
        onReady: (event: YouTubeEvent) => {
          event.target.playVideo();
        },
        onStateChange: handleStateChange,
      },
    });

    return () => {
      if (playerRef.current) {
        playerRef.current.removeEventListener(
          "onStateChange",
          handleStateChange
        );
      }
    };
  }, [isApiReady, selectedVideo]);

  const handleStateChange = (event: YouTubeEvent) => {
    if (event.data === window.YT.PlayerState.ENDED) {
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
  };

  if (!selectedVideo) return null;

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
};

export default Player;
