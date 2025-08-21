import React from "react";
import { FaYoutube, FaSpotify, FaTrash, FaPlay, FaPause } from "react-icons/fa";
import Image from "next/image";

export interface PlaylistItemProps {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
  service: "youtube" | "spotify" | "music";
  duration?: number;
  isPlaying?: boolean;
  isCurrent?: boolean;
  onPlay?: () => void;
  onRemove?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  className?: string;
  draggable?: boolean;
}

const PlaylistItem: React.FC<PlaylistItemProps> = ({
  id,
  title,
  artist,
  thumbnail,
  service,
  duration,
  isPlaying = false,
  isCurrent = false,
  onPlay,
  onRemove,
  onDragStart,
  className = "",
  draggable = true,
}) => {
  const serviceConfig = {
    youtube: {
      icon: FaYoutube,
      color: "text-[#FF0000]",
      bgColor: "bg-[#FF0000]/20",
      borderColor: "border-[#FF0000]/30",
    },
    spotify: {
      icon: FaSpotify,
      color: "text-[#1DB954]",
      bgColor: "bg-[#1DB954]/20",
      borderColor: "border-[#1DB954]/30",
    },
    music: {
      icon: FaPlay,
      color: "text-[#FF6B6B]",
      bgColor: "bg-[#FF6B6B]/20",
      borderColor: "border-[#FF6B6B]/30",
    },
  };

  const config = serviceConfig[service];
  const IconComponent = config.icon;

  const formatDuration = (ms: number) => {
    if (!ms) return "";
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className={`flex items-center w-full max-w-full py-4 hover:bg-white/5 transition-all duration-200 cursor-pointer group rounded-lg ${
        isCurrent ? "bg-[#FF6B6B]/10 border border-[#FF6B6B]/20" : ""
      } ${className}`}
      draggable={draggable}
      onDragStart={onDragStart}
    >
      {/* Thumbnail */}
      <div className="w-12 h-12 flex-shrink-0 rounded overflow-hidden relative group-hover:scale-105 transition-transform">
        <Image
          src={thumbnail}
          alt={title}
          fill
          className="object-cover"
          sizes="48px"
        />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          {onPlay && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPlay();
              }}
              className="p-1.5 rounded-full bg-[#FF6B6B] hover:bg-[#FF5252] text-white hover:scale-110 shadow-lg hover:shadow-xl hover:shadow-[#FF6B6B]/25 transition-all duration-200"
            >
              {isPlaying ? <FaPause size={12} /> : <FaPlay size={12} />}
            </button>
          )}
        </div>
      </div>

      {/* Info section - takes up available space */}
      <div className="flex-1 min-w-0 mx-4 overflow-hidden">
        <h3
          className={`text-sm font-medium truncate transition-colors ${
            isCurrent
              ? "text-[#FF6B6B]"
              : "text-white group-hover:text-[#FF6B6B]"
          }`}
        >
          {title}
        </h3>
        <p className="text-xs text-gray-400 truncate group-hover:text-gray-300 transition-colors">
          {artist}
        </p>
      </div>

      {/* Duration - only if provided */}
      {duration && (
        <div className="flex-shrink-0 text-xs text-gray-400 font-mono mr-4">
          {formatDuration(duration)}
        </div>
      )}

      {/* Remove Button */}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="p-2 text-gray-400 hover:text-[#FF6B6B] hover:bg-[#FF6B6B]/20 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100 hover:scale-110 flex-shrink-0 mr-3"
        >
          <FaTrash size={14} />
        </button>
      )}

      {/* Service Icon */}
      <div className="flex-shrink-0">
        <div
          className={`p-2 rounded-full ${config.bgColor} ${config.color} transition-all duration-200 group-hover:scale-110`}
        >
          <IconComponent size={16} />
        </div>
      </div>
    </div>
  );
};

export default PlaylistItem;
