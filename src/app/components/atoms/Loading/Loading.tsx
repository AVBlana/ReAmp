import React from "react";

export interface LoadingProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  color?: "primary" | "secondary" | "white" | "watermelon";
  className?: string;
  text?: string;
}

const Loading: React.FC<LoadingProps> = ({
  size = "md",
  color = "watermelon",
  className = "",
  text,
}) => {
  const sizeClasses = {
    xs: "w-3 h-3",
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12",
  };

  const colorClasses = {
    primary: "border-[#FF6B6B] border-t-[#FF6B6B]/30",
    secondary: "border-[#4ECDC4] border-t-[#4ECDC4]/30",
    white: "border-white border-t-white/30",
    watermelon: "border-[#FF6B6B] border-t-[#FF6B6B]/30",
  };

  const textSizeClasses = {
    xs: "text-xs",
    sm: "text-sm",
    md: "text-sm",
    lg: "text-base",
    xl: "text-lg",
  };

  const classes = `${sizeClasses[size]} ${colorClasses[color]} ${className}`;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`${classes} border-2 rounded-full animate-spin`} />
      {text && (
        <span className={`text-gray-400 ${textSizeClasses[size]} font-mono`}>
          {text}
        </span>
      )}
    </div>
  );
};

export default Loading;
