"use client";

import { Droppable } from "@hello-pangea/dnd";
import { ServiceType, Song } from "@/app/types/playerTypes";
import { YoutubeVideo } from "@/app/types/youtubeTypes";
import Image from "next/image";

interface DJPlayerState {
  service: ServiceType | null;
  song: Song | YoutubeVideo | null;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  crossfade: number;
  currentTime: number;
  duration: number;
  isActive: boolean;
  playerId: string;
}

interface PlayerDropZoneProps {
  playerId: "A" | "B";
  playerState: DJPlayerState;
}

export default function PlayerDropZone({
  playerId,
  playerState,
}: PlayerDropZoneProps) {
  const getDropZoneContent = () => {
    if (playerState.song) {
      const isSpotify = "artwork" in playerState.song;
      const title = isSpotify
        ? (playerState.song as Song).title
        : (playerState.song as YoutubeVideo).snippet?.title;
      const artist = isSpotify
        ? (playerState.song as Song).artist?.name
        : (playerState.song as YoutubeVideo).snippet?.channelTitle;
      const artworkUrl = isSpotify
        ? (playerState.song as Song).artwork?.medium?.url
        : (playerState.song as YoutubeVideo).snippet?.thumbnails?.medium?.url;

      return (
        <div className="flex items-center space-x-3 p-3 bg-black/20 rounded-lg">
          {artworkUrl && (
            <div className="relative w-12 h-12 rounded overflow-hidden">
              <Image
                src={artworkUrl}
                alt="Album Art"
                fill
                className="object-cover"
                sizes="48px"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{title}</p>
            <p className="text-xs text-gray-300 truncate">{artist}</p>
          </div>
          <div className="text-xs text-gray-400">
            {playerState.service === ServiceType.Spotify ? "🎵" : "📺"}
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl text-gray-400">{playerId}</span>
        </div>
        <p className="text-sm text-gray-400 mb-2">Drop a song here</p>
        <p className="text-xs text-gray-500">
          Drag from search results or playlist
        </p>
      </div>
    );
  };

  return (
    <Droppable droppableId={`player-${playerId}`}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`min-h-[200px] border-2 border-dashed rounded-lg p-4 transition-all ${
            snapshot.isDraggingOver
              ? "border-green-400 bg-green-400/10"
              : playerState.song
              ? "border-gray-600 bg-gray-800/30"
              : "border-gray-600 bg-gray-800/20"
          }`}
        >
          {getDropZoneContent()}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
}
