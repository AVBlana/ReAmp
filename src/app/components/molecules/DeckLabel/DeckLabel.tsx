import React from "react";

export interface DeckLabelProps {
  playerId: "A" | "B";
  variant?: "default" | "compact" | "highlighted";
  isActive?: boolean;
  className?: string;
}

const DeckLabel: React.FC<DeckLabelProps> = ({
  playerId,
  variant = "default",
  isActive = false,
  className = "",
}) => {
  const playerColor = playerId === "A" ? "#FF6B6B" : "#4ECDC4";

  const variantClasses = {
    default: "text-xl font-bold font-mono",
    compact: "text-sm font-medium",
    highlighted: "text-2xl font-bold font-mono",
  };

  const activeClasses = isActive ? "ring-2 ring-white/50 bg-opacity-80" : "";

  return (
    <div
      className={`text-center ${variantClasses[variant]} ${activeClasses} ${className}`}
      style={{ color: playerColor }}
    >
      DECK {playerId}
    </div>
  );
};

export default DeckLabel;
