import React from "react";
import { FaYoutube, FaSpotify, FaMusic } from "react-icons/fa";

export interface ServiceIconProps {
  service: "youtube" | "spotify" | "music" | "unknown";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  variant?: "default" | "outlined" | "filled" | "watermelon";
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

const ServiceIcon: React.FC<ServiceIconProps> = ({
  service,
  size = "md",
  variant = "default",
  className = "",
  onClick,
  disabled = false,
}) => {
  const sizeClasses = {
    xs: "w-3 h-3",
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
    xl: "w-8 h-8",
  };

  const getIcon = () => {
    switch (service) {
      case "youtube":
        return FaYoutube;
      case "spotify":
        return FaSpotify;
      case "music":
        return FaMusic;
      default:
        return FaMusic;
    }
  };

  const getColors = () => {
    switch (service) {
      case "youtube":
        return {
          default: "text-[#FF0000]",
          outlined: "text-[#FF0000] border border-[#FF0000]",
          filled: "bg-[#FF0000] text-white",
          watermelon: "text-[#FF0000] hover:text-[#CC0000] transition-colors",
        };
      case "spotify":
        return {
          default: "text-[#1DB954]",
          outlined: "text-[#1DB954] border border-[#1DB954]",
          filled: "bg-[#1DB954] text-white",
          watermelon: "text-[#1DB954] hover:text-[#1ed760] transition-colors",
        };
      case "music":
        return {
          default: "text-[#FF6B6B]",
          outlined: "text-[#FF6B6B] border border-[#FF6B6B]",
          filled: "bg-[#FF6B6B] text-white",
          watermelon: "text-[#FF6B6B] hover:text-[#FF5252] transition-colors",
        };
      default:
        return {
          default: "text-gray-400",
          outlined: "text-gray-400 border border-gray-400",
          filled: "bg-gray-400 text-white",
          watermelon: "text-gray-400 hover:text-[#FF6B6B] transition-colors",
        };
    }
  };

  const IconComponent = getIcon();
  const colors = getColors();
  const colorClasses = colors[variant] || colors.default;

  const baseClasses = `inline-block transition-all duration-200 ${sizeClasses[size]} ${colorClasses}`;
  const interactiveClasses = onClick ? "cursor-pointer hover:scale-110" : "";
  const disabledClasses = disabled ? "opacity-50 cursor-not-allowed" : "";

  const classes = `${baseClasses} ${interactiveClasses} ${disabledClasses} ${className}`;

  return (
    <div className={classes} onClick={disabled ? undefined : onClick}>
      <IconComponent size={parseInt(sizeClasses[size].split(" ")[1])} />
    </div>
  );
};

export default ServiceIcon;
