import React from "react";
import { FaYoutube, FaSpotify, FaPlus, FaPlay } from "react-icons/fa";
import Image from "next/image";

export interface SearchResultItemProps {
  title: string;
  subtitle: string;
  thumbnail: string;
  service: "youtube" | "spotify" | "music";
  isInPlaylist?: boolean;
  onAddToPlaylist?: () => void;
  onPlay?: () => void;
  className?: string;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
}

const SearchResultItem: React.FC<SearchResultItemProps> = ({
  title,
  subtitle,
  thumbnail,
  service,
  isInPlaylist = false,
  onAddToPlaylist,
  onPlay,
  className = "",
  draggable = false,
  onDragStart,
}) => {
  const serviceConfig = {
    youtube: {
      icon: FaYoutube,
      color: "text-[#FF0000]",
      bgColor: "bg-[#FF0000]/20",
      hoverColor: "hover:text-[#CC0000]",
    },
    spotify: {
      icon: FaSpotify,
      color: "text-[#1DB954]",
      bgColor: "bg-[#1DB954]/20",
      hoverColor: "hover:text-[#1ed760]",
    },
    music: {
      icon: FaPlay,
      color: "text-[#FF6B6B]",
      bgColor: "bg-[#FF6B6B]/20",
      hoverColor: "hover:text-[#FF5252]",
    },
  };

  const config = serviceConfig[service];
  const IconComponent = config.icon;

  return (
    <div
      className={`flex items-center space-x-4 p-3 hover:bg-white/5 transition-all duration-200 cursor-pointer group rounded-lg ${
        isInPlaylist ? "bg-[#FF6B6B]/10 border border-[#FF6B6B]/20" : ""
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
          {onAddToPlaylist && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddToPlaylist();
              }}
              disabled={isInPlaylist}
              className={`p-1.5 rounded-full transition-all duration-200 ${
                isInPlaylist
                  ? "bg-gray-500 cursor-not-allowed text-white"
                  : "bg-[#FF6B6B] hover:bg-[#FF5252] text-white hover:scale-110 shadow-lg hover:shadow-xl hover:shadow-[#FF6B6B]/25"
              }`}
              title={isInPlaylist ? "Already in playlist" : "Add to playlist"}
            >
              <FaPlus size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="flex-grow min-w-0">
        <h3 className="text-sm font-medium text-white truncate group-hover:text-[#FF6B6B] transition-colors">
          {title}
        </h3>
        <p className="text-xs text-gray-400 truncate group-hover:text-gray-300 transition-colors">
          {subtitle}
        </p>
      </div>

      {/* Service Icon */}
      <div className="flex-shrink-0">
        <div
          className={`p-2 rounded-full ${config.bgColor} ${config.color} ${config.hoverColor} transition-all duration-200 group-hover:scale-110`}
        >
          <IconComponent size={16} />
        </div>
      </div>
    </div>
  );
};

export default SearchResultItem;
