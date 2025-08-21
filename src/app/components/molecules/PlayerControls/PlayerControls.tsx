import React from "react";
import {
  FaPlay,
  FaPause,
  FaStop,
  FaStepForward,
  FaStepBackward,
} from "react-icons/fa";

export interface PlayerControlsProps {
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "watermelon" | "minimal";
  className?: string;
}

const PlayerControls: React.FC<PlayerControlsProps> = ({
  isPlaying,
  onPlay,
  onPause,
  onStop,
  onNext,
  onPrevious,
  disabled = false,
  size = "md",
  variant = "watermelon",
  className = "",
}) => {
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
  };

  const variantClasses = {
    default: "bg-gray-700 hover:bg-gray-600 text-white",
    watermelon:
      "bg-[#FF6B6B] hover:bg-[#FF5252] text-white shadow-lg hover:shadow-xl hover:shadow-[#FF6B6B]/25",
    minimal:
      "bg-transparent hover:bg-white/10 text-white border border-white/20",
  };

  const baseClasses =
    "inline-flex items-center justify-center font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const classes = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`;

  return (
    <div className="flex items-center gap-2">
      {/* Previous Button */}
      {onPrevious && (
        <button onClick={onPrevious} disabled={disabled} className={classes}>
          <FaStepBackward size={size === "sm" ? 12 : size === "md" ? 14 : 16} />
        </button>
      )}

      {/* Play/Pause Button */}
      <button
        onClick={isPlaying ? onPause : onPlay}
        disabled={disabled}
        className={`${classes} ${
          variant === "watermelon"
            ? "bg-[#4ECDC4] hover:bg-[#45B7AA] hover:shadow-[#4ECDC4]/25"
            : ""
        }`}
      >
        {isPlaying ? (
          <FaPause size={size === "sm" ? 12 : size === "md" ? 14 : 16} />
        ) : (
          <FaPlay size={size === "sm" ? 12 : size === "md" ? 14 : 16} />
        )}
      </button>

      {/* Stop Button */}
      <button onClick={onStop} disabled={disabled} className={classes}>
        <FaStop size={size === "sm" ? 12 : size === "md" ? 14 : 16} />
      </button>

      {/* Next Button */}
      {onNext && (
        <button onClick={onNext} disabled={disabled} className={classes}>
          <FaStepForward size={size === "sm" ? 12 : size === "md" ? 14 : 16} />
        </button>
      )}
    </div>
  );
};

export default PlayerControls;
