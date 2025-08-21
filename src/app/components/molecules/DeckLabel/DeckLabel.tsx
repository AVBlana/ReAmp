import React from "react";

export interface DeckLabelProps {
  deckId: "A" | "B" | string;
  isActive?: boolean;
  isPlaying?: boolean;
  variant?: "default" | "watermelon" | "minimal";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const DeckLabel: React.FC<DeckLabelProps> = ({
  deckId,
  isActive = false,
  isPlaying = false,
  variant = "watermelon",
  size = "md",
  className = "",
}) => {
  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1.5",
    lg: "text-base px-4 py-2",
  };

  const variantClasses = {
    default: "bg-gray-700 text-white border border-gray-600",
    watermelon:
      "bg-gradient-to-r from-[#FF6B6B] to-[#FF5252] text-white shadow-lg shadow-[#FF6B6B]/25",
    minimal: "bg-transparent text-white border border-white/20",
  };

  const stateClasses = {
    active: isActive
      ? "ring-2 ring-[#FF6B6B]/50 shadow-lg shadow-[#FF6B6B]/25"
      : "",
    playing: isPlaying ? "animate-pulse" : "",
  };

  const baseClasses =
    "font-mono font-bold rounded-lg transition-all duration-200";
  const classes = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${stateClasses.active} ${stateClasses.playing} ${className}`;

  return <div className={classes}>DECK {deckId}</div>;
};

export default DeckLabel;
