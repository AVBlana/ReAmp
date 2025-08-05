import React from "react";
import { FaPlay, FaPause, FaTrash, FaHeart, FaRegHeart } from "react-icons/fa";
import Image from "next/image";

export interface PlaylistItemProps {
  id: string;
  title: string;
  subtitle?: string;
  thumbnail?: string;
  duration?: string;
  isPlaying?: boolean;
  isSelected?: boolean;
  isLiked?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onSelect?: () => void;
  onRemove?: () => void;
  onLike?: () => void;
  onUnlike?: () => void;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const PlaylistItem: React.FC<PlaylistItemProps> = ({
  title,
  subtitle,
  thumbnail,
  isPlaying = false,
  isSelected = false,
  isLiked = false,
  onPlay,
  onPause,
  onSelect,
  onRemove,
  onLike,
  onUnlike,
  disabled = false,
  className = "",
  size = "md",
}) => {
  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      onPause?.();
    } else {
      onPlay?.();
    }
  };

  const handleLikeToggle = () => {
    if (isLiked) {
      onUnlike?.();
    } else {
      onLike?.();
    }
  };

  return (
    <div
      className={`flex items-center space-x-4 p-3 ${
        isSelected
          ? "bg-[#FF6B6B]/10 border-2 border-[#FF6B6B] shadow-[0_0_8px_rgba(255,107,107,0.6)]"
          : "hover:bg-[#FF6B6B]/5"
      } transition-colors ${disabled ? "opacity-50" : ""} ${className}`}
      onClick={onSelect}
    >
      {/* Thumbnail */}
      <div className="w-12 h-12 flex-shrink-0 rounded overflow-hidden relative">
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt={title}
            fill
            className="object-cover"
            sizes="48px"
          />
        ) : (
          <div className="w-full h-full bg-black/20 flex items-center justify-center">
            <FaPlay size={iconSizes[size]} className="text-gray-400" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-grow min-w-0">
        <h3 className="text-sm font-medium text-white truncate">{title}</h3>
        {subtitle && (
          <p className="text-xs text-gray-400 truncate">{subtitle}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-2">
        {/* Play/Pause Button */}
        {onPlay && onPause && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePlayPause();
            }}
            disabled={disabled}
            className="p-2 text-[#1DB954] hover:bg-[#1DB954]/20 rounded-full transition-colors"
          >
            {isPlaying ? (
              <FaPause size={iconSizes[size]} />
            ) : (
              <FaPlay size={iconSizes[size]} />
            )}
          </button>
        )}

        {/* Like Button */}
        {(onLike || onUnlike) && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleLikeToggle();
            }}
            disabled={disabled}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/20 rounded-full transition-colors"
          >
            {isLiked ? (
              <FaHeart size={iconSizes[size]} className="text-red-500" />
            ) : (
              <FaRegHeart size={iconSizes[size]} />
            )}
          </button>
        )}

        {/* Remove Button */}
        {onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            disabled={disabled}
            className="p-2 text-gray-400 hover:text-[#FF6B6B] hover:bg-[#FF6B6B]/20 rounded-full transition-colors"
          >
            <FaTrash size={iconSizes[size]} />
          </button>
        )}
      </div>
    </div>
  );
};

export default PlaylistItem;
