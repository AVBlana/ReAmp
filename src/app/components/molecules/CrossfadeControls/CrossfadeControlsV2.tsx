import React from "react";
import { FaExchangeAlt, FaPlay, FaCog, FaLightbulb } from "react-icons/fa";

export interface CrossfadeControlsV2Props {
  crossfadeEnabled: boolean;
  crossfadeDuration: number;
  autoCrossfadeThreshold: number;
  minTimeRemaining: number;
  isCrossfadeActive: boolean;
  canCrossfade: boolean;
  crossfadeSuggestions: Array<{
    fromDeck: "A" | "B";
    toDeck: "A" | "B";
    reason: string;
    priority: "high" | "medium" | "low";
  }>;
  onToggleCrossfade: () => void;
  onManualCrossfade: () => void;
  onSetCrossfadeDuration: (duration: number) => void;
  onSetAutoCrossfadeThreshold: (threshold: number) => void;
  onSetMinTimeRemaining: (minTime: number) => void;
  className?: string;
}

const CrossfadeControlsV2: React.FC<CrossfadeControlsV2Props> = ({
  crossfadeEnabled,
  crossfadeDuration,
  autoCrossfadeThreshold,
  minTimeRemaining,
  isCrossfadeActive,
  canCrossfade,
  crossfadeSuggestions,
  onToggleCrossfade,
  onManualCrossfade,
  onSetCrossfadeDuration,
  onSetAutoCrossfadeThreshold,
  onSetMinTimeRemaining,
  className = "",
}) => {
  const [showAdvancedSettings, setShowAdvancedSettings] = React.useState(false);

  const getPriorityColor = (priority: "high" | "medium" | "low") => {
    switch (priority) {
      case "high":
        return "text-red-400";
      case "medium":
        return "text-yellow-400";
      case "low":
        return "text-blue-400";
      default:
        return "text-gray-400";
    }
  };

  const getPriorityIcon = (priority: "high" | "medium" | "low") => {
    switch (priority) {
      case "high":
        return "🔴";
      case "medium":
        return "🟡";
      case "low":
        return "🔵";
      default:
        return "⚪";
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Crossfade Controls */}
      <div className="flex flex-row items-center gap-4">
        {/* Crossfade Toggle Button */}
        <button
          onClick={onToggleCrossfade}
          disabled={isCrossfadeActive}
          className={`px-4 py-2 rounded-lg font-mono text-sm transition-all duration-200 ${
            isCrossfadeActive
              ? "bg-gradient-to-r from-[#4ECDC4] to-[#4ECDC4] text-white shadow-lg shadow-[#4ECDC4]/25 cursor-not-allowed"
              : crossfadeEnabled
              ? "bg-gradient-to-r from-[#FF6B6B] to-[#FF5252] hover:from-[#FF5252] hover:to-[#FF4040] text-white shadow-lg hover:shadow-xl hover:shadow-[#FF6B6B]/30"
              : "bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white shadow-lg hover:shadow-xl"
          }`}
          title={
            crossfadeEnabled
              ? "Click to disable crossfade"
              : "Click to enable crossfade"
          }
        >
          <div className="flex items-center gap-2">
            <FaExchangeAlt
              className={`inline ${isCrossfadeActive ? "animate-spin" : ""}`}
            />
            {isCrossfadeActive
              ? "CROSSFADING..."
              : crossfadeEnabled
              ? "CROSSFADE ON"
              : "CROSSFADE OFF"}
          </div>
        </button>

        {/* Manual Crossfade Button */}
        <button
          onClick={onManualCrossfade}
          disabled={isCrossfadeActive || !canCrossfade || !crossfadeEnabled}
          className={`px-4 py-2 rounded-lg font-mono text-sm transition-all duration-200 ${
            isCrossfadeActive || !canCrossfade || !crossfadeEnabled
              ? "bg-gray-600 text-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-[#4ECDC4] to-[#45B7AA] hover:from-[#45B7AA] hover:to-[#4ECDC4] text-white shadow-lg hover:shadow-xl hover:shadow-[#4ECDC4]/30"
          }`}
          title={
            !crossfadeEnabled
              ? "Enable crossfade first"
              : !canCrossfade
              ? "No suitable tracks for crossfade"
              : "Manually trigger crossfade now"
          }
        >
          <div className="flex items-center gap-2">
            <FaPlay className="inline" />
            MANUAL CROSSFADE
          </div>
        </button>

        {/* Advanced Settings Toggle */}
        <button
          onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
          className="px-3 py-2 rounded-lg font-mono text-sm bg-gray-600 hover:bg-gray-500 text-white transition-all duration-200"
          title="Advanced crossfade settings"
        >
          <FaCog
            className={`inline transition-transform duration-200 ${
              showAdvancedSettings ? "rotate-90" : ""
            }`}
          />
        </button>
      </div>

      {/* Crossfade Suggestions */}
      {crossfadeEnabled && crossfadeSuggestions.length > 0 && (
        <div className="bg-black/30 rounded-lg p-3 border border-gray-600">
          <div className="flex items-center gap-2 mb-2">
            <FaLightbulb className="text-yellow-400" />
            <span className="text-sm font-mono text-white">
              Crossfade Suggestions
            </span>
          </div>
          <div className="space-y-1">
            {crossfadeSuggestions.slice(0, 3).map((suggestion, index) => (
              <div
                key={index}
                className={`text-xs font-mono ${getPriorityColor(
                  suggestion.priority
                )}`}
              >
                {getPriorityIcon(suggestion.priority)} {suggestion.reason} (
                {suggestion.fromDeck} → {suggestion.toDeck})
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Advanced Settings Panel */}
      {showAdvancedSettings && (
        <div className="bg-black/30 rounded-lg p-4 border border-gray-600 space-y-4">
          <h3 className="text-sm font-mono text-white border-b border-gray-600 pb-2">
            Advanced Crossfade Settings
          </h3>

          {/* Crossfade Duration */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-gray-300">
              Crossfade Duration: {Math.round(crossfadeDuration / 1000)}s
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="500"
                max="5000"
                step="100"
                value={crossfadeDuration}
                onChange={(e) => onSetCrossfadeDuration(Number(e.target.value))}
                className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-xs font-mono text-gray-400 w-12">
                {Math.round(crossfadeDuration / 1000)}s
              </span>
            </div>
          </div>

          {/* Auto-crossfade Threshold */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-gray-300">
              Auto-crossfade Threshold:{" "}
              {Math.round(autoCrossfadeThreshold / 1000)}s
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="3000"
                max="15000"
                step="1000"
                value={autoCrossfadeThreshold}
                onChange={(e) =>
                  onSetAutoCrossfadeThreshold(Number(e.target.value))
                }
                className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-xs font-mono text-gray-400 w-12">
                {Math.round(autoCrossfadeThreshold / 1000)}s
              </span>
            </div>
          </div>

          {/* Minimum Time Remaining */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-gray-300">
              Minimum Time Remaining: {Math.round(minTimeRemaining / 1000)}s
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="1000"
                max="5000"
                step="500"
                value={minTimeRemaining}
                onChange={(e) => onSetMinTimeRemaining(Number(e.target.value))}
                className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-xs font-mono text-gray-400 w-12">
                {Math.round(minTimeRemaining / 1000)}s
              </span>
            </div>
          </div>

          {/* Status Information */}
          <div className="text-xs font-mono text-gray-400 space-y-1 pt-2 border-t border-gray-600">
            <div>Status: {crossfadeEnabled ? "Enabled" : "Disabled"}</div>
            <div>Can Crossfade: {canCrossfade ? "Yes" : "No"}</div>
            <div>Active: {isCrossfadeActive ? "Yes" : "No"}</div>
          </div>
        </div>
      )}

      {/* Status indicator */}
      <div
        className={`text-xs font-mono ${
          crossfadeEnabled ? "text-green-400" : "text-gray-500"
        }`}
      >
        {crossfadeEnabled
          ? "Auto-crossfade enabled"
          : "Auto-crossfade disabled"}
      </div>
    </div>
  );
};

export default CrossfadeControlsV2;
