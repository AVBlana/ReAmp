import React from "react";
import { FaExchangeAlt, FaPlay } from "react-icons/fa";

export interface CrossfadeControlsProps {
  crossfade: number;
  onCrossfadeChange: (value: number) => void;
  isEnabled: boolean;
  onToggle: () => void;
  onManualCrossfade?: () => void;
  isActive?: boolean;
  className?: string;
}

const CrossfadeControls: React.FC<CrossfadeControlsProps> = ({
  crossfade,
  onCrossfadeChange,
  isEnabled,
  onToggle,
  onManualCrossfade,
  isActive = false,
  className = "",
}) => {
  return (
    <div className={`flex flex-row items-center gap-4 ${className}`}>
      {/* Crossfade Toggle Button */}
      <button
        onClick={onToggle}
        disabled={isActive}
        className={`px-4 py-2 rounded-lg font-mono text-sm transition-all duration-200 ${
          isActive
            ? "bg-gradient-to-r from-[#4ECDC4] to-[#4ECDC4] text-white shadow-lg shadow-[#4ECDC4]/25 cursor-not-allowed"
            : isEnabled
            ? "bg-gradient-to-r from-[#FF6B6B] to-[#FF5252] hover:from-[#FF5252] hover:to-[#FF4040] text-white shadow-lg hover:shadow-xl hover:shadow-[#FF6B6B]/30"
            : "bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white shadow-lg hover:shadow-xl"
        }`}
        title={
          isEnabled ? "Click to disable crossfade" : "Click to enable crossfade"
        }
      >
        <div className="flex items-center gap-2">
          <FaExchangeAlt
            className={`inline ${isActive ? "animate-spin" : ""}`}
          />
          {isActive
            ? "CROSSFADING..."
            : isEnabled
            ? "CROSSFADE ON"
            : "CROSSFADE OFF"}
        </div>
      </button>

      {/* Manual Crossfade Button */}
      {onManualCrossfade && (
        <button
          onClick={onManualCrossfade}
          disabled={isActive || !isEnabled}
          className={`px-4 py-2 rounded-lg font-mono text-sm transition-all duration-200 ${
            isActive || !isEnabled
              ? "bg-gray-600 text-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-[#4ECDC4] to-[#45B7AA] hover:from-[#45B7AA] hover:to-[#4ECDC4] text-white shadow-lg hover:shadow-xl hover:shadow-[#4ECDC4]/30"
          }`}
          title={
            isEnabled
              ? "Manually trigger crossfade now"
              : "Enable crossfade first"
          }
        >
          <div className="flex items-center gap-2">
            <FaPlay className="inline" />
            MANUAL CROSSFADE
          </div>
        </button>
      )}

      {/* Crossfade Slider */}
      <div className="w-48">
        <div className="flex items-center gap-3">
          <span
            className={`font-mono text-sm ${
              isEnabled ? "text-white" : "text-gray-500"
            }`}
          >
            CROSSFADE
          </span>
          <div
            className={`flex-1 h-2 rounded-full relative ${
              isEnabled ? "bg-gray-700" : "bg-gray-800"
            }`}
          >
            <input
              type="range"
              min="0"
              max="100"
              value={crossfade}
              onChange={(e) => onCrossfadeChange(Number(e.target.value))}
              disabled={!isEnabled}
              className={`absolute inset-0 w-full h-full opacity-0 ${
                isEnabled ? "cursor-pointer" : "cursor-not-allowed"
              }`}
            />
            <div
              className={`absolute top-0 left-0 h-full rounded-full transition-all duration-100 ${
                isEnabled
                  ? "bg-gradient-to-r from-[#FF6B6B] to-[#FF5252] shadow-lg"
                  : "bg-gray-600"
              }`}
              style={{ width: `${crossfade}%` }}
            />
          </div>
          <span
            className={`font-mono text-sm ${
              isEnabled ? "text-white" : "text-gray-500"
            }`}
          >
            {isEnabled ? `${crossfade}%` : "OFF"}
          </span>
        </div>
      </div>

      {/* Status indicator */}
      <div
        className={`text-xs font-mono ${
          isEnabled ? "text-green-400" : "text-gray-500"
        }`}
      >
        {isEnabled ? "Auto-crossfade enabled" : "Auto-crossfade disabled"}
      </div>
    </div>
  );
};

export default CrossfadeControls;
