import React, { useState, useCallback, useRef } from "react";
import { FaVolumeUp, FaVolumeMute, FaVolumeDown } from "react-icons/fa";

export interface VolumeControlProps {
  volume: number;
  onVolumeChange: (volume: number) => void;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  showLabel?: boolean;
  className?: string;
  disabled?: boolean;
}

const VolumeControl: React.FC<VolumeControlProps> = ({
  volume,
  onVolumeChange,
  size = "md",
  showIcon = true,
  showLabel = false,
  className = "",
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragVolume, setDragVolume] = useState(volume);
  const sliderRef = useRef<HTMLDivElement>(null);

  const currentVolume = isDragging ? dragVolume : volume;
  const isMuted = currentVolume === 0;

  const sizeClasses = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3",
  };

  const iconSizes = {
    sm: 12,
    md: 16,
    lg: 20,
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent | MouseEvent) => {
      if (!isDragging || !sliderRef.current || disabled) return;

      const rect = sliderRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, x / rect.width));
      const newVolume = Math.round(percentage * 100);
      setDragVolume(newVolume);
    },
    [isDragging, disabled]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (disabled) return;
      setIsDragging(true);
      handleMouseMove(e);
    },
    [disabled, handleMouseMove]
  );

  const handleMouseUp = useCallback(() => {
    if (!isDragging || disabled) return;
    setIsDragging(false);
    onVolumeChange(dragVolume);
  }, [isDragging, onVolumeChange, dragVolume, disabled]);

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleMuteToggle = () => {
    if (disabled) return;
    onVolumeChange(isMuted ? 50 : 0);
  };

  const getVolumeIcon = () => {
    if (isMuted) return FaVolumeMute;
    if (currentVolume < 30) return FaVolumeDown;
    return FaVolumeUp;
  };

  const VolumeIcon = getVolumeIcon();

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {showIcon && (
        <button
          onClick={handleMuteToggle}
          disabled={disabled}
          className={`text-gray-400 hover:text-[#FF6B6B] transition-colors hover:scale-110 ${
            disabled ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <VolumeIcon size={iconSizes[size]} />
        </button>
      )}

      {showLabel && (
        <span className="text-white font-mono text-xs min-w-[32px] text-right">
          VOL
        </span>
      )}

      <div className="flex items-center gap-2 flex-1">
        <div
          ref={sliderRef}
          className={`relative flex-1 ${
            sizeClasses[size]
          } bg-gray-700 rounded-lg cursor-pointer ${
            disabled ? "opacity-50 cursor-not-allowed" : ""
          } hover:bg-gray-600 transition-colors`}
          onMouseDown={handleMouseDown}
        >
          <input
            type="range"
            min="0"
            max="100"
            value={currentVolume}
            onChange={(e) => onVolumeChange(parseInt(e.target.value))}
            disabled={disabled}
            className={`absolute inset-0 w-full h-full opacity-0 cursor-pointer ${
              disabled ? "cursor-not-allowed" : ""
            }`}
          />
          <div
            className={`h-full rounded-lg transition-all duration-100 ${
              isMuted
                ? "bg-gray-500"
                : "bg-gradient-to-r from-[#FF6B6B] to-[#FF5252] shadow-lg"
            }`}
            style={{ width: `${currentVolume}%` }}
          />
        </div>

        <span className="text-xs text-gray-400 w-8 text-right font-mono">
          {currentVolume}
        </span>
      </div>
    </div>
  );
};

export default VolumeControl;
