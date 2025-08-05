import React from "react";
import { FaPlus, FaCheck } from "react-icons/fa";
import Image from "next/image";
import { ServiceType } from "@/app/types/playerTypes";

export interface SearchResultItemProps {
  result: {
    id: string;
    title: string;
    artist?: string;
    thumbnail?: string;
    service: ServiceType;
    duration?: number;
  };
  onAddToPlaylist?: () => void;
  isInPlaylist?: boolean;
  isDraggable?: boolean;
  className?: string;
}

const SearchResultItem: React.FC<SearchResultItemProps> = ({
  result,
  onAddToPlaylist,
  isInPlaylist = false,
  isDraggable = true,
  className = "",
}) => {
  return (
    <div
      className={`flex items-center space-x-4 p-3 hover:bg-white/5 transition-colors cursor-pointer group ${className}`}
      draggable={isDraggable}
      data-draggable-id={`${result.service}-${result.id}`}
    >
      {/* Thumbnail */}
      <div className="w-12 h-12 flex-shrink-0 rounded overflow-hidden relative">
        <Image
          src={result.thumbnail || ""}
          alt=""
          fill
          className="object-cover"
          sizes="48px"
        />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToPlaylist?.();
            }}
            disabled={isInPlaylist}
            className={`p-1.5 rounded-full ${
              isInPlaylist
                ? "bg-gray-500 cursor-not-allowed"
                : "bg-[#FF6B6B] hover:bg-[#FF6B6B]/80"
            } transition-colors`}
            title={isInPlaylist ? "Already in playlist" : "Add to playlist"}
          >
            {isInPlaylist ? (
              <FaCheck className="text-white" size={12} />
            ) : (
              <FaPlus className="text-white" size={12} />
            )}
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="flex-grow min-w-0">
        <h3 className="text-sm font-medium text-white truncate">
          {result.title}
        </h3>
        {result.artist && (
          <p className="text-xs text-gray-400 truncate">{result.artist}</p>
        )}
      </div>

      {/* Service Icon */}
      <div className="flex-shrink-0">
        {result.service === ServiceType.Youtube ? (
          <div className="text-[#FF0000] text-sm font-medium">YT</div>
        ) : (
          <div className="text-[#1DB954] text-sm font-medium">SP</div>
        )}
      </div>
    </div>
  );
};

export default SearchResultItem;
