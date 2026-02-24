import React, { useCallback, useRef, useState } from "react";
import { formatTimeFromMs } from "@/utils/helpers";

export interface ProgressBarProps {
  currentTime: number;
  duration: number;
  onSeek?: (time: number) => void;
  color?: "red" | "blue" | "green" | "purple" | "teal" | "watermelon";
  height?: "sm" | "md" | "lg";
  showTime?: boolean;
  disabled?: boolean;
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  currentTime,
  duration,
  onSeek,
  color = "watermelon",
  height = "md",
  showTime = false,
  disabled = false,
  className = "",
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragTime, setDragTime] = useState(currentTime);
  const progressRef = useRef<HTMLDivElement>(null);

  const progress =
    duration > 0 ? (isDragging ? dragTime : currentTime) / duration : 0;

  const colorClasses = {
    red: "bg-[#FF6B6B]",
    blue: "bg-blue-500",
    green: "bg-[#4ECDC4]",
    purple: "bg-purple-500",
    teal: "bg-[#4ECDC4]",
    watermelon: "bg-gradient-to-r from-[#FF6B6B] to-[#FF5252]",
  };

  const heightClasses = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3",
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent | MouseEvent) => {
      if (!isDragging || !progressRef.current || !onSeek) return;

      const rect = progressRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, x / rect.width));
      const newTime = percentage * duration;
      setDragTime(newTime);
    },
    [isDragging, duration, onSeek]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (disabled || !onSeek) return;
      setIsDragging(true);
      handleMouseMove(e);
    },
    [disabled, onSeek, handleMouseMove]
  );

  const handleMouseUp = useCallback(() => {
    if (!isDragging || !onSeek) return;
    setIsDragging(false);
    onSeek(dragTime);
  }, [isDragging, onSeek, dragTime]);

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

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showTime && (
        <span className="text-xs text-gray-400 font-mono min-w-[40px]">
          {formatTimeFromMs(isDragging ? dragTime : currentTime)}
        </span>
      )}

      <div
        ref={progressRef}
        className={`flex-1 bg-gray-700 rounded-full cursor-pointer relative ${
          heightClasses[height]
        } ${
          disabled ? "opacity-50 cursor-not-allowed" : ""
        } hover:bg-gray-600 transition-colors`}
        onMouseDown={handleMouseDown}
      >
        <div
          className={`h-full rounded-full ${colorClasses[color]} relative shadow-lg`}
          style={{ width: `${progress * 100}%` }}
        />

        {!disabled && onSeek && (
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg border-2 border-[#FF6B6B] hover:scale-110 transition-transform"
            style={{ left: `${progress * 100}%` }}
          />
        )}
      </div>

      {showTime && (
        <span className="text-xs text-gray-400 font-mono min-w-[40px]">
          {formatTimeFromMs(duration)}
        </span>
      )}
    </div>
  );
};

export default ProgressBar;
