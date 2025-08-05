import React, { useState } from "react";
import { motion } from "framer-motion";
import { FaMusic, FaImage } from "react-icons/fa";

export interface AlbumArtProps {
  src?: string;
  alt?: string;
  size?: "sm" | "md" | "lg" | "xl";
  fallback?: React.ReactNode;
  className?: string;
  aspectRatio?: "square" | "video" | "custom";
}

const AlbumArt: React.FC<AlbumArtProps> = ({
  src,
  alt = "Album Art",
  size = "md",
  fallback,
  className = "",
  aspectRatio = "square",
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-16 h-16",
    lg: "w-24 h-24",
    xl: "w-32 h-32",
  };

  const aspectClasses = {
    square: "aspect-square",
    video: "aspect-video",
    custom: "",
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  const renderFallback = () => {
    if (fallback) return fallback;

    return (
      <div className="flex items-center justify-center w-full h-full bg-gray-700 rounded-lg">
        <FaMusic className="text-gray-400 text-xl" />
      </div>
    );
  };

  if (!src || imageError) {
    return (
      <div
        className={`${sizeClasses[size]} ${aspectClasses[aspectRatio]} ${className}`}
      >
        {renderFallback()}
      </div>
    );
  }

  return (
    <div
      className={`relative ${sizeClasses[size]} ${aspectClasses[aspectRatio]} ${className}`}
    >
      <motion.img
        src={src}
        alt={alt}
        className="w-full h-full object-cover rounded-lg"
        onError={handleImageError}
        onLoad={handleImageLoad}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: imageLoaded ? 1 : 0, scale: imageLoaded ? 1 : 0.9 }}
        transition={{ duration: 0.3 }}
      />

      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-700 rounded-lg">
          <FaImage className="text-gray-400 text-xl animate-pulse" />
        </div>
      )}
    </div>
  );
};

export default AlbumArt;
