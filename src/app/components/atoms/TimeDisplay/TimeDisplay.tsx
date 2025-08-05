import React from "react";

export interface TimeDisplayProps {
  time: number;
  format?: "short" | "long";
  showHours?: boolean;
  className?: string;
}

const TimeDisplay: React.FC<TimeDisplayProps> = ({
  time,
  format = "short",
  showHours = false,
  className = "",
}) => {
  const formatTime = (timeInSeconds: number) => {
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = Math.floor(timeInSeconds % 60);

    if (format === "long" || (showHours && hours > 0)) {
      return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    } else {
      return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    }
  };

  return (
    <span className={`font-mono text-gray-400 ${className}`}>
      {formatTime(time)}
    </span>
  );
};

export default TimeDisplay;
