"use client";

import { useAppContext } from "@/app/AppContext";
import ReactPlayer from "react-player/youtube";

export default function Player() {
  const { selectedVideo } = useAppContext();

  if (!selectedVideo) return null;

  return (
    <div className="aspect-video w-full max-w-3xl">
      <ReactPlayer
        url={`https://www.youtube.com/watch?v=${selectedVideo}`}
        width="100%"
        height="100%"
        controls
        playing={true}
      />
    </div>
  );
}
