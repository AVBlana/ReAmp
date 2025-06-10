"use client";

import React, { memo, useCallback, useMemo } from "react";
import { YoutubeVideo } from "@/app/components/Services/YtService";
import { Song } from "@/types/playerTypes";
import { ServiceType } from "@/types/playerTypes";
import { useUnifiedContext } from "@/context/UnifiedContext";
import { FaPlay, FaTrash } from "react-icons/fa";

export interface PlaylistItemProps {
  item: YoutubeVideo | Song;
  service: ServiceType;
}

const PlaylistItem = memo(({ item, service }: PlaylistItemProps) => {
  const { youtube, spotify, unified } = useUnifiedContext();

  const handlePlay = useCallback(() => {
    if (service === ServiceType.Youtube) {
      const video = item as YoutubeVideo;
      if (youtube.selectedVideo !== video.id.videoId) {
        youtube.setSelectedVideo(video.id.videoId);
        if (spotify.currentSong) {
          spotify.setCurrentSong(null);
        }
      }
    } else {
      const song = item as Song;
      if (spotify.currentSong?.id !== song.id) {
        spotify.setCurrentSong(song);
        if (youtube.selectedVideo) {
          youtube.setSelectedVideo(null);
        }
      }
    }
  }, [service, item, youtube, spotify]);

  const handleRemove = useCallback(() => {
    // Find the item in the unified playlist and remove it
    const itemId =
      service === ServiceType.Youtube
        ? (item as YoutubeVideo).id.videoId
        : (item as Song).id;

    unified.removeFromPlaylist(itemId);
  }, [service, item, unified]);

  const thumbnail = useMemo(
    () =>
      service === ServiceType.Youtube
        ? (item as YoutubeVideo).snippet.thumbnails.default.url
        : (item as Song).artwork?.small?.url ||
          (item as Song).artwork?.medium?.url ||
          (item as Song).artwork?.big?.url ||
          "",
    [service, item]
  );

  const title = useMemo(
    () =>
      service === ServiceType.Youtube
        ? (item as YoutubeVideo).snippet.title
        : (item as Song).title,
    [service, item]
  );

  const subtitle = useMemo(
    () =>
      service === ServiceType.Youtube
        ? (item as YoutubeVideo).snippet.channelTitle
        : (item as Song).artist?.name || "Unknown Artist",
    [service, item]
  );

  return (
    <>
      {/* Thumbnail */}
      <div className="w-12 h-12 flex-shrink-0 rounded overflow-hidden">
        <img src={thumbnail} alt="" className="w-full h-full object-cover" />
      </div>

      {/* Info */}
      <div className="flex-grow min-w-0">
        <h3 className="text-sm font-medium text-white truncate">{title}</h3>
        <p className="text-xs text-gray-400 truncate">{subtitle}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-2">
        <button
          onClick={handlePlay}
          className="p-2 text-[#1DB954] hover:bg-[#1DB954]/20 rounded-full transition-colors"
        >
          <FaPlay size={14} />
        </button>
        <button
          onClick={handleRemove}
          className="p-2 text-gray-400 hover:text-[#FF6B6B] hover:bg-[#FF6B6B]/20 rounded-full transition-colors"
        >
          <FaTrash size={14} />
        </button>
      </div>
    </>
  );
});

PlaylistItem.displayName = "PlaylistItem";

export { PlaylistItem };
