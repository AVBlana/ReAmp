import React from "react";
import Image from "next/image";

export interface AlbumArtProps {
  src: string;
  alt: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  variant?: "square" | "rounded" | "circle" | "vinyl";
  className?: string;
  fallbackText?: string;
  loading?: "lazy" | "eager";
  priority?: boolean;
}

const AlbumArt: React.FC<AlbumArtProps> = ({
  src,
  alt,
  size = "md",
  variant = "rounded",
  className = "",
  fallbackText = "No Image",
  loading = "lazy",
  priority = false,
}) => {
  const sizeClasses = {
    xs: "w-8 h-8",
    sm: "w-12 h-12",
    md: "w-16 h-16",
    lg: "w-24 h-24",
    xl: "w-32 h-32",
  };

  const variantClasses = {
    square: "rounded-none",
    rounded: "rounded-lg",
    circle: "rounded-full",
    vinyl: "rounded-full shadow-[0_0_0_3px_#FF6B6B,0_0_18px_#fff8_inset]",
  };

  const fallbackClasses = {
    square: "bg-gradient-to-br from-gray-700 to-gray-900",
    rounded: "bg-gradient-to-br from-gray-700 to-gray-900",
    circle: "bg-gradient-to-br from-gray-700 to-gray-900",
    vinyl: "bg-gradient-to-br from-black to-gray-800",
  };

  const classes = `${sizeClasses[size]} ${variantClasses[variant]} ${fallbackClasses[variant]} ${className}`;

  const [imageError, setImageError] = React.useState(false);

  if (imageError || !src) {
    return (
      <div
        className={`${classes} flex items-center justify-center overflow-hidden`}
      >
        <span className="text-gray-400 text-xs font-mono text-center px-1">
          {fallbackText}
        </span>
      </div>
    );
  }

  return (
    <div className={`${classes} overflow-hidden relative`}>
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        sizes={`${sizeClasses[size].split(" ")[1]}px`}
        {...(priority ? { priority: true } : { loading })}
        onError={() => setImageError(true)}
      />
    </div>
  );
};

export default AlbumArt;
