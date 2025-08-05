import React, { useState, useCallback, useRef } from "react";
import { FaVolumeUp, FaVolumeMute, FaVolumeDown } from "react-icons/fa";

export interface VolumeControlProps {
  volume: number;
  onVolumeChange: (volume: number) => void;
  onMute?: () => void;
  isMuted?: boolean;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
  showSlider?: boolean;
  playerColor?: string;
}

const VolumeControl: React.FC<VolumeControlProps> = ({
  volume,
  onVolumeChange,
  onMute,
  isMuted = false,
  disabled = false,
  className = "",
  size = "md",
  showSlider = true,
  playerColor = "#FF6B6B",
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  const iconSizes = {
    sm: 12,
    md: 16,
    lg: 20,
  };

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) {
      return <FaVolumeMute size={iconSizes[size]} />;
    } else if (volume < 0.5) {
      return <FaVolumeDown size={iconSizes[size]} />;
    } else {
      return <FaVolumeUp size={iconSizes[size]} />;
    }
  };

  const handleSliderClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled || !sliderRef.current) return;

      const rect = sliderRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const width = rect.width;
      const newVolume = Math.max(0, Math.min(1, clickX / width));
      onVolumeChange(newVolume);
    },
    [disabled, onVolumeChange]
  );

  const handleSliderDrag = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled || !isDragging || !sliderRef.current) return;

      const rect = sliderRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const width = rect.width;
      const newVolume = Math.max(0, Math.min(1, clickX / width));
      onVolumeChange(newVolume);
    },
    [disabled, isDragging, onVolumeChange]
  );

  const handleMouseDown = useCallback(() => {
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
    setIsHovered(false);
  }, []);

  // Add global mouse event listeners for dragging
  React.useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        if (sliderRef.current) {
          const rect = sliderRef.current.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const width = rect.width;
          const newVolume = Math.max(0, Math.min(1, clickX / width));
          onVolumeChange(newVolume);
        }
      };

      const handleGlobalMouseUp = () => {
        setIsDragging(false);
      };

      document.addEventListener("mousemove", handleGlobalMouseMove);
      document.addEventListener("mouseup", handleGlobalMouseUp);

      return () => {
        document.removeEventListener("mousemove", handleGlobalMouseMove);
        document.removeEventListener("mouseup", handleGlobalMouseUp);
      };
    }
  }, [isDragging, onVolumeChange]);

  return (
    <div
      className={`flex items-center gap-2 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
    >
      {/* Volume Icon Button */}
      {onMute && (
        <button
          onClick={onMute}
          disabled={disabled}
          className="text-gray-400 hover:text-white transition-colors"
        >
          {getVolumeIcon()}
        </button>
      )}

      {/* Volume Slider */}
      {showSlider && (
        <div className="flex items-center gap-2 flex-1">
          <input
            type="range"
            min="0"
            max="100"
            value={isMuted ? 0 : volume * 100}
            onChange={(e) => onVolumeChange(parseInt(e.target.value) / 100)}
            className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, ${playerColor} 0%, ${playerColor} ${
                isMuted ? 0 : volume * 100
              }%, #374151 ${isMuted ? 0 : volume * 100}%, #374151 100%)`,
            }}
          />

          <span className="text-xs text-gray-400 w-8 text-right">
            {isMuted ? 0 : Math.round(volume * 100)}
          </span>
        </div>
      )}
    </div>
  );
};

export default VolumeControl;
