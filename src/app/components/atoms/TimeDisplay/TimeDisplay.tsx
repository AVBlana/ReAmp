import React from "react";
import { formatTimeFromMs } from "@/utils/helpers";

export interface TimeDisplayProps {
  currentTime: number;
  duration: number;
  format?: "mm:ss" | "mm:ss.ms" | "auto";
  size?: "sm" | "md" | "lg";
  color?: "primary" | "secondary" | "white" | "watermelon";
  className?: string;
  showLabels?: boolean;
}

const TimeDisplay: React.FC<TimeDisplayProps> = ({
  currentTime,
  duration,
  format = "mm:ss",
  size = "md",
  color = "watermelon",
  className = "",
  showLabels = false,
}) => {
  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  const colorClasses = {
    primary: "text-[#FF6B6B]",
    secondary: "text-[#4ECDC4]",
    white: "text-white",
    watermelon: "text-[#FF6B6B]",
  };

  const getFormat = () => {
    if (format === "auto") {
      return duration > 60000 ? "mm:ss" : "mm:ss.ms"; // Show ms for tracks under 1 minute
    }
    return format;
  };

  const currentFormat = getFormat();
  const includeMs = currentFormat === "mm:ss.ms";

  const classes = `${sizeClasses[size]} ${colorClasses[color]} font-mono ${className}`;

  return (
    <div className={`flex items-center gap-2 ${classes}`}>
      {showLabels && <span className="text-gray-400">Time:</span>}
      <span className="min-w-[40px] text-right">
        {formatTimeFromMs(currentTime, includeMs)}
      </span>
      <span className="text-gray-400">/</span>
      <span className="min-w-[40px] text-left">
        {formatTimeFromMs(duration, includeMs)}
      </span>
    </div>
  );
};

export default TimeDisplay;
