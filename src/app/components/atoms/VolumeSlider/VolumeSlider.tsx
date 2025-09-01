import React, { useCallback, useRef, useState } from "react";
import { FaVolumeUp, FaVolumeMute } from "react-icons/fa";

export interface VolumeSliderProps {
  volume: number;
  onVolumeChange: (volume: number) => void;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  playerColor?: string;
}

const VolumeSlider: React.FC<VolumeSliderProps> = ({
  volume,
  onVolumeChange,
  showIcon = true,
  size = "md",
  className = "",
  playerColor = "#FF6B6B",
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
      if (!isDragging || !sliderRef.current) return;

      const rect = sliderRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, x / rect.width));
      const newVolume = Math.round(percentage * 100);
      setDragVolume(newVolume);
    },
    [isDragging]
  );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setIsDragging(true);
      handleMouseMove(e);
    },
    [handleMouseMove]
  );

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    onVolumeChange(dragVolume);
  }, [isDragging, onVolumeChange, dragVolume]);

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
    onVolumeChange(isMuted ? 50 : 0);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showIcon && (
        <button
          onClick={handleMuteToggle}
          className="text-gray-400 hover:text-[#FF6B6B] transition-colors hover:scale-110"
        >
          {isMuted ? (
            <FaVolumeMute size={iconSizes[size]} />
          ) : (
            <FaVolumeUp size={iconSizes[size]} />
          )}
        </button>
      )}

      <div className="flex items-center gap-2 flex-1">
        <input
          type="range"
          min="0"
          max="100"
          value={currentVolume}
          onChange={(e) => onVolumeChange(parseInt(e.target.value))}
          className={`flex-1 rounded-lg appearance-none cursor-pointer slider ${sizeClasses[size]} bg-gray-700 hover:bg-gray-600 transition-colors`}
          style={{
            background: `linear-gradient(to right, ${playerColor} 0%, ${playerColor} ${currentVolume}%, #374151 ${currentVolume}%, #374151 100%)`,
            boxShadow: `0 0 10px ${playerColor}20`,
          }}
        />

        <span className="text-xs text-gray-400 w-8 text-right">
          {currentVolume}
        </span>
      </div>
    </div>
  );
};

export default VolumeSlider;
