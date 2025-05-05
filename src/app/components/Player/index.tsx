"use client";

import { useAppContext } from "@/app/AppContext";
import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    YT: {
      Player: any;
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
    youtube: { selectedVideo },
  } = useAppContext();
  const playerRef = useRef<any>(null);
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

  // Handle video changes
  useEffect(() => {
    if (!isApiReady || !selectedVideo) return;

    const initializePlayer = () => {
      if (containerRef.current) {
        // Destroy existing player if it exists
        if (playerRef.current) {
          playerRef.current.destroy();
          playerRef.current = null;
        }

        // Create new player
        playerRef.current = new window.YT.Player(containerRef.current, {
          height: "100%",
          width: "100%",
          videoId: selectedVideo,
          playerVars: {
            autoplay: 1,
            modestbranding: 1,
            rel: 0,
            showinfo: 0,
            playsinline: 1,
          },
          events: {
            onReady: (event: any) => {
              event.target.playVideo();
            },
            onStateChange: (event: any) => {
              if (event.data === window.YT.PlayerState.ENDED) {
                // Handle video end
              }
            },
            onError: (event: any) => {
              console.error("YouTube Player Error:", event.data);
            },
          },
        });
      }
    };

    initializePlayer();
  }, [selectedVideo, isApiReady]);

  if (!selectedVideo) return null;

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}
