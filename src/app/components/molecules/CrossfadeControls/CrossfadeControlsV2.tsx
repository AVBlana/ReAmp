import React, { useEffect } from "react";
import { FaExchangeAlt, FaPlay, FaCog, FaLightbulb, FaTimes } from "react-icons/fa";

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
  /** When provided, clicking a suggestion runs this crossfade (fromDeck → toDeck) */
  onSuggestionClick?: (fromDeck: "A" | "B", toDeck: "A" | "B") => void;
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
  onSuggestionClick,
  className = "",
}) => {
  const [showAdvancedSettings, setShowAdvancedSettings] = React.useState(false);

  useEffect(() => {
    if (showAdvancedSettings) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [showAdvancedSettings]);

  const getPriorityColor = (priority: "high" | "medium" | "low") => {
    switch (priority) {
      case "high":
        return "text-red-400";
      case "medium":
        return "text-yellow-400";
      case "low":
        return "text-[#4ECDC4]";
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

  const rangeInputClass =
    "flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#FF6B6B] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#FF6B6B] [&::-webkit-slider-thumb]:cursor-pointer";

  return (
    <div className={`relative ${className}`}>
      {/* Main Crossfade Controls - app style: black/20, borders, primary/secondary colors */}
      <div className="flex flex-row items-center gap-2 sm:gap-3 flex-wrap justify-center sm:justify-start">
        <button
          onClick={onToggleCrossfade}
          disabled={isCrossfadeActive}
          className={`min-h-[44px] sm:min-h-[40px] px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 touch-manipulation ${
            isCrossfadeActive
              ? "bg-[#4ECDC4]/80 text-white cursor-not-allowed border border-[#4ECDC4]/50"
              : crossfadeEnabled
              ? "bg-[#FF6B6B] hover:bg-[#FF5252] text-white border border-[#FF6B6B]/60"
              : "bg-black/30 hover:bg-white/10 text-gray-400 border border-white/10"
          }`}
          title={
            crossfadeEnabled
              ? "Click to disable crossfade"
              : "Click to enable crossfade"
          }
        >
          <div className="flex items-center gap-2">
            <FaExchangeAlt
              className={`inline text-sm ${isCrossfadeActive ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">
              {isCrossfadeActive
                ? "CROSSFADING..."
                : crossfadeEnabled
                ? "CROSSFADE ON"
                : "CROSSFADE OFF"}
            </span>
            <span className="sm:hidden">
              {isCrossfadeActive ? "..." : crossfadeEnabled ? "ON" : "OFF"}
            </span>
          </div>
        </button>

        <button
          onClick={onManualCrossfade}
          disabled={isCrossfadeActive || !canCrossfade || !crossfadeEnabled}
          className={`min-h-[44px] sm:min-h-[40px] px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 touch-manipulation ${
            isCrossfadeActive || !canCrossfade || !crossfadeEnabled
              ? "bg-black/20 text-gray-500 border border-white/5 cursor-not-allowed"
              : "bg-[#4ECDC4] hover:bg-[#45B7AA] text-white border border-[#4ECDC4]/50"
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
            <FaPlay className="inline text-sm" />
            <span className="hidden sm:inline">Manual</span>
          </div>
        </button>

        <button
          onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
          className="min-h-[44px] sm:min-h-[40px] px-3 py-2 rounded-lg text-sm font-medium bg-black/20 hover:bg-white/10 text-gray-300 border border-white/10 transition-all duration-200 touch-manipulation"
          title="Advanced crossfade settings"
        >
          <FaCog
            className={`inline text-sm transition-transform duration-200 ${
              showAdvancedSettings ? "rotate-90" : ""
            }`}
          />
        </button>
      </div>

      {/* Suggestions - app panel style */}
      {crossfadeEnabled && crossfadeSuggestions.length > 0 && (
        <div className="mt-2 bg-black/20 rounded-lg p-2 border border-white/10">
          <div className="flex items-center gap-2 mb-1">
            <FaLightbulb className="text-[#FFE66D] text-xs" />
            <span className="text-xs text-white font-medium">Suggestions</span>
          </div>
          <div className="space-y-0.5">
            {crossfadeSuggestions.slice(0, 2).map((suggestion, index) => {
              const clickable = !!onSuggestionClick && !isCrossfadeActive;
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() =>
                    clickable &&
                    onSuggestionClick?.(suggestion.fromDeck, suggestion.toDeck)
                  }
                  disabled={!clickable}
                  title={clickable ? "Click to start crossfade now" : undefined}
                  className={`w-full text-left text-xs rounded px-2 py-1.5 transition-colors ${getPriorityColor(
                    suggestion.priority
                  )} ${clickable ? "hover:bg-white/10 cursor-pointer" : "cursor-default"}`}
                >
                  {getPriorityIcon(suggestion.priority)} {suggestion.reason} (
                  {suggestion.fromDeck} → {suggestion.toDeck})
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Advanced Settings: full-screen overlay on mobile, dropdown on desktop; scrollable content */}
      {showAdvancedSettings && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] sm:bg-transparent sm:backdrop-blur-none sm:block sm:inset-auto sm:absolute sm:top-full sm:right-0 sm:mt-2 sm:w-80 sm:rounded-lg sm:border sm:border-white/10 sm:shadow-xl sm:z-50"
            aria-hidden
            onClick={() => setShowAdvancedSettings(false)}
          />
          <div className="fixed inset-4 sm:inset-auto sm:absolute sm:top-full sm:right-0 sm:mt-2 sm:w-80 sm:max-w-[calc(100vw-2rem)] flex flex-col sm:block z-[101] sm:z-50 pointer-events-none sm:pointer-events-auto">
            <div className="bg-[#0A0A0A] rounded-xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[70vh] pointer-events-auto m-auto sm:m-0 w-full sm:w-80">
              <div className="flex items-center justify-between flex-shrink-0 px-4 py-3 border-b border-white/10">
                <h3 className="text-sm font-semibold text-white">
                  Crossfade Settings
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAdvancedSettings(false)}
                  className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center sm:min-w-0 sm:min-h-0 sm:p-1"
                  aria-label="Close settings"
                >
                  <FaTimes className="text-lg sm:text-base" />
                </button>
              </div>
              <div className="overflow-y-auto custom-scrollbar flex-1 p-4 space-y-4">
                <div>
                  <label className="block text-xs text-gray-300 mb-1">
                    Duration: {Math.round(crossfadeDuration / 1000)}s
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="500"
                      max="5000"
                      step="100"
                      value={crossfadeDuration}
                      onChange={(e) =>
                        onSetCrossfadeDuration(Number(e.target.value))
                      }
                      className={rangeInputClass}
                    />
                    <span className="text-xs text-gray-400 w-8 shrink-0">
                      {Math.round(crossfadeDuration / 1000)}s
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-300 mb-1">
                    Auto threshold: {Math.round(autoCrossfadeThreshold / 1000)}s
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
                      className={rangeInputClass}
                    />
                    <span className="text-xs text-gray-400 w-8 shrink-0">
                      {Math.round(autoCrossfadeThreshold / 1000)}s
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-300 mb-1">
                    Min time: {Math.round(minTimeRemaining / 1000)}s
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="1000"
                      max="5000"
                      step="500"
                      value={minTimeRemaining}
                      onChange={(e) =>
                        onSetMinTimeRemaining(Number(e.target.value))
                      }
                      className={rangeInputClass}
                    />
                    <span className="text-xs text-gray-400 w-8 shrink-0">
                      {Math.round(minTimeRemaining / 1000)}s
                    </span>
                  </div>
                </div>

                <div className="text-xs text-gray-400 space-y-1 pt-3 border-t border-white/10">
                  <div>Status: {crossfadeEnabled ? "On" : "Off"}</div>
                  <div>Can crossfade: {canCrossfade ? "Yes" : "No"}</div>
                  <div>Active: {isCrossfadeActive ? "Yes" : "No"}</div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <div
        className={`text-xs mt-1 text-center sm:text-left ${
          crossfadeEnabled ? "text-[#4ECDC4]" : "text-gray-500"
        }`}
      >
        {crossfadeEnabled ? "Auto crossfade on" : "Auto crossfade off"}
      </div>
    </div>
  );
};

export default CrossfadeControlsV2;
