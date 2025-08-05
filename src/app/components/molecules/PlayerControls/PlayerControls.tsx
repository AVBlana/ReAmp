import React from "react";
import {
  FaPlay,
  FaPause,
  FaStop,
  FaStepForward,
  FaStepBackward,
  FaVolumeUp,
  FaVolumeMute,
  FaVolumeDown,
  FaExpand,
  FaCompress,
  FaCog,
  FaHeart,
  FaRegHeart,
  FaRandom,
  FaRedo,
} from "react-icons/fa";

export interface PlayerControlsProps {
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onShuffle?: () => void;
  onRepeat?: () => void;
  canPlay?: boolean;
  canPause?: boolean;
  canNext?: boolean;
  canPrevious?: boolean;
  isShuffled?: boolean;
  repeatMode?: "none" | "one" | "all";
  className?: string;
  size?: "sm" | "md" | "lg";
}

const PlayerControls: React.FC<PlayerControlsProps> = ({
  isPlaying,
  onPlay,
  onPause,
  onNext,
  onPrevious,
  onShuffle,
  onRepeat,
  canPlay = true,
  canPause = true,
  canNext = true,
  canPrevious = true,
  isShuffled = false,
  repeatMode = "none",
  className = "",
  size = "md",
}) => {
  const iconSize = size === "sm" ? 12 : size === "lg" ? 20 : 16;

  const getRepeatIcon = () => {
    switch (repeatMode) {
      case "one":
        return <FaRedo className="text-[#FF6B6B]" />;
      case "all":
        return <FaRedo />;
      default:
        return <FaRedo className="text-gray-400" />;
    }
  };

  return (
    <div className={`flex items-center justify-center space-x-2 ${className}`}>
      {/* Shuffle Button */}
      {onShuffle && (
        <button
          onClick={onShuffle}
          disabled={!canPlay}
          className={`p-2 rounded-full transition-all ${
            isShuffled ? "text-[#FF6B6B]" : "text-gray-400"
          }`}
        >
          <FaRandom size={iconSize} />
        </button>
      )}

      {/* Previous Button */}
      <button
        onClick={onPrevious}
        disabled={!canPrevious}
        className="p-2 rounded-full bg-transparent hover:bg-white/10 text-gray-400 hover:text-white transition-all"
      >
        <FaStepBackward size={iconSize} />
      </button>

      {/* Play/Pause Button */}
      <button
        onClick={isPlaying ? onPause : onPlay}
        disabled={isPlaying ? !canPause : !canPlay}
        className={`p-2 rounded-full transition-all ${
          isPlaying
            ? "bg-red-600 hover:bg-red-700"
            : "bg-green-600 hover:bg-green-700"
        }`}
      >
        {isPlaying ? <FaPause size={iconSize} /> : <FaPlay size={iconSize} />}
      </button>

      {/* Next Button */}
      <button
        onClick={onNext}
        disabled={!canNext}
        className="p-2 rounded-full bg-transparent hover:bg-white/10 text-gray-400 hover:text-white transition-all"
      >
        <FaStepForward size={iconSize} />
      </button>

      {/* Repeat Button */}
      {onRepeat && (
        <button
          onClick={onRepeat}
          disabled={!canPlay}
          className="p-2 rounded-full bg-transparent hover:bg-white/10 text-gray-400 hover:text-white transition-all"
        >
          {getRepeatIcon()}
        </button>
      )}
    </div>
  );
};

export default PlayerControls;
