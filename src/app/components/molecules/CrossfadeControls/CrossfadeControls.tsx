import React, { useCallback, useRef, useState } from "react";
import { FaExchangeAlt } from "react-icons/fa";

export interface CrossfadeControlsProps {
  enabled: boolean;
  percentage: number;
  onToggle: () => void;
  onChange: (percentage: number) => void;
  className?: string;
}

const CrossfadeControls: React.FC<CrossfadeControlsProps> = ({
  enabled,
  percentage,
  onToggle,
  onChange,
  className = "",
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragPercentage, setDragPercentage] = useState(percentage);
  const sliderRef = useRef<HTMLDivElement>(null);

  const currentPercentage = isDragging ? dragPercentage : percentage;

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!enabled) return;
      setIsDragging(true);
      handleMouseMove(e);
    },
    [enabled]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent | MouseEvent) => {
      if (!isDragging || !sliderRef.current || !enabled) return;

      const rect = sliderRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setDragPercentage(Math.round(percentage));
    },
    [isDragging, enabled]
  );

  const handleMouseUp = useCallback(() => {
    if (!isDragging || !enabled) return;
    setIsDragging(false);
    onChange(dragPercentage);
  }, [isDragging, enabled, onChange, dragPercentage]);

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
    <div
      className={`flex items-center gap-4 p-4 bg-black/30 rounded-lg ${className}`}
    >
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
          enabled
            ? "bg-[#FF6B6B] text-white"
            : "bg-gray-600/50 text-gray-400 hover:bg-gray-600/70"
        }`}
      >
        <FaExchangeAlt size={16} />
        <span className="text-sm font-medium">Crossfade</span>
      </button>

      {/* Slider */}
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 font-mono min-w-[40px]">
            0%
          </span>

          <div
            ref={sliderRef}
            className={`flex-1 h-2 bg-gray-700 rounded-full cursor-pointer relative ${
              enabled ? "" : "opacity-50 cursor-not-allowed"
            }`}
            onMouseDown={handleMouseDown}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#4ECDC4] to-[#FF6B6B]"
              style={{ width: `${currentPercentage}%` }}
            />

            {enabled && (
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg"
                style={{ left: `${currentPercentage}%` }}
              />
            )}
          </div>

          <span className="text-xs text-gray-400 font-mono min-w-[40px]">
            {currentPercentage}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default CrossfadeControls;
