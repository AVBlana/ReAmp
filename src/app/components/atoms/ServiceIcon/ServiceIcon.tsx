import React from "react";
import { FaYoutube, FaSpotify } from "react-icons/fa";
import { ServiceType } from "@/app/types/playerTypes";

export interface ServiceIconProps {
  service: ServiceType;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const ServiceIcon: React.FC<ServiceIconProps> = ({
  service,
  size = "md",
  className = "",
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const serviceConfig = {
    [ServiceType.Youtube]: {
      icon: FaYoutube,
      color: "text-red-500",
      bgColor: "bg-red-500/20",
    },
    [ServiceType.Spotify]: {
      icon: FaSpotify,
      color: "text-green-500",
      bgColor: "bg-green-500/20",
    },
  };

  const config = serviceConfig[service];
  const IconComponent = config.icon;

  return (
    <div
      className={`flex items-center justify-center rounded-full ${config.bgColor} ${sizeClasses[size]} ${className}`}
    >
      <IconComponent className={`${config.color} ${sizeClasses[size]}`} />
    </div>
  );
};

export default ServiceIcon;
