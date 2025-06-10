"use client";

import { useYoutube, useUnifiedContext } from "@/context/UnifiedContext";
import { useEffect, useRef, useState, useCallback } from "react";
import { YoutubeVideo } from "../Services/YtService";
import { ServiceType } from "@/types/playerTypes";

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
  const { selectedVideo, setSelectedVideo } = useYoutube();
  const { unified } = useUnifiedContext();
  const playerRef = useRef<YouTubePlayer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isApiReady, setIsApiReady] = useState(false);

  const handleStateChange = useCallback(
    (event: YouTubeEvent) => {
      const state = event.data;

      // Handle video end
      if (state === window.YT.PlayerState.ENDED) {
        // Find the current video index in the unified playlist
        const currentIndex = unified.playlist.findIndex(
          (item) =>
            item.type === ServiceType.Youtube && item.id === selectedVideo
        );

        // If there's a next item in the playlist, play it
        if (currentIndex < unified.playlist.length - 1) {
          const nextItem = unified.playlist[currentIndex + 1];

          if (nextItem.type === ServiceType.Youtube) {
            // Next item is also a YouTube video
            const nextVideo = nextItem.data as YoutubeVideo;
            setSelectedVideo(nextVideo.id.videoId);
          } else {
            // Next item is a different service type - trigger unified autoplay
            window.dispatchEvent(new CustomEvent("autoplay-next"));
          }
        }
      }
    },
    [unified.playlist, selectedVideo, setSelectedVideo]
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
    console.log("YouTube Player selectedVideo changed:", selectedVideo);

    if (!selectedVideo && playerRef.current) {
      console.log("Stopping YouTube player - selectedVideo is null");
      // Stop and destroy the player when switching away from YouTube
      try {
        // First pause the video
        playerRef.current.pauseVideo();

        // Wait a moment before destroying to avoid DOM conflicts
        setTimeout(() => {
          try {
            if (playerRef.current) {
              playerRef.current.destroy();
              playerRef.current = null;
              console.log("YouTube player stopped and destroyed successfully");
            }
          } catch (destroyError) {
            console.error("Error destroying YouTube player:", destroyError);
            playerRef.current = null;
          }
        }, 100);
      } catch (error) {
        console.error("Error stopping YouTube player:", error);
        playerRef.current = null;
      }
    } else if (selectedVideo && playerRef.current) {
      console.log("YouTube player already exists for video:", selectedVideo);
    }
  }, [selectedVideo]);

  useEffect(() => {
    if (!isApiReady || !selectedVideo || !containerRef.current) {
      console.log("YouTube Player not ready:", {
        isApiReady,
        selectedVideo,
        hasContainer: !!containerRef.current,
      });
      return;
    }

    console.log("Creating new YouTube player for video:", selectedVideo);

    // Clean up any existing player before creating a new one
    if (playerRef.current) {
      try {
        playerRef.current.pauseVideo();
        playerRef.current.destroy();
      } catch (error) {
        console.error("Error cleaning up existing player:", error);
      }
      playerRef.current = null;
    }

    // Clear the container
    if (containerRef.current) {
      containerRef.current.innerHTML = "";
    }

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
          console.log("YouTube player ready, starting video");
          try {
            event.target.playVideo();
          } catch (error) {
            console.error("Error starting video:", error);
          }
        },
        onStateChange: handleStateChange,
      },
    });

    playerRef.current = player;
    console.log("YouTube player created successfully");

    return () => {
      // Cleanup: destroy the player instance
      if (playerRef.current) {
        console.log("Cleaning up YouTube player");
        try {
          playerRef.current.pauseVideo();
          playerRef.current.destroy();
        } catch (error) {
          console.error("Error during cleanup:", error);
        }
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
    <div
      ref={containerRef}
      className="w-full h-full relative"
      style={{
        minHeight: "280px",
        aspectRatio: "16/9",
        maxHeight: "calc(100vh - 120px)",
        backgroundColor: "#000",
        pointerEvents: "auto",
      }}
    />
  );
};

export default Player;
