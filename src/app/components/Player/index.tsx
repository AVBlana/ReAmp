"use client";

import ReactPlayer from "react-player/youtube";
import { useState, useEffect } from "react";
import { useAppContext } from "@/app/AppContext";

export default function Player() {
  const { selectedVideo, playlist, setSelectedVideo } = useAppContext();
  const [currentVideoIndex, setCurrentVideoIndex] = useState<number | null>(
    null
  );

  useEffect(() => {
    if (selectedVideo) {
      const index = playlist.findIndex(
        (video) => video.id.videoId === selectedVideo
      );
      setCurrentVideoIndex(index);
    }
  }, [selectedVideo, playlist]);

  const handlePlayNext = () => {
    if (currentVideoIndex !== null && currentVideoIndex < playlist.length - 1) {
      const nextVideo = playlist[currentVideoIndex + 1];
      setSelectedVideo(nextVideo.id.videoId);
    } else {
      setSelectedVideo(null);
    }
  };

  if (!selectedVideo) return null;

  return (
    <div className="aspect-video w-full max-w-3xl">
      <ReactPlayer
        url={`https://www.youtube.com/watch?v=${selectedVideo}`}
        width="100%"
        height="100%"
        controls
        playing={true}
        onEnded={handlePlayNext}
      />
    </div>
  );
}
