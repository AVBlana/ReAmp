import React from "react";

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

  const formatTime = (time: number, includeMs = false) => {
    if (!time || isNaN(time)) return "0:00";

    const totalSeconds = Math.floor(time / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (includeMs) {
      const milliseconds = Math.floor((time % 1000) / 10);
      return `${minutes}:${seconds.toString().padStart(2, "0")}.${milliseconds
        .toString()
        .padStart(2, "0")}`;
    }

    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
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
        {formatTime(currentTime, includeMs)}
      </span>
      <span className="text-gray-400">/</span>
      <span className="min-w-[40px] text-left">
        {formatTime(duration, includeMs)}
      </span>
    </div>
  );
};

export default TimeDisplay;
