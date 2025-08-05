import React from "react";

export interface LoadingProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  variant?: "spinner" | "dots" | "pulse";
  color?: "primary" | "secondary" | "white" | "gray";
  className?: string;
  text?: string;
}

const Loading: React.FC<LoadingProps> = ({
  size = "md",
  variant = "spinner",
  color = "primary",
  className = "",
  text,
}) => {
  const sizeClasses = {
    xs: "w-3 h-3",
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
    xl: "w-8 h-8",
  };

  const colorClasses = {
    primary: "border-[#FF6B6B]",
    secondary: "border-[#4ECDC4]",
    white: "border-white",
    gray: "border-gray-400",
  };

  const textSizeClasses = {
    xs: "text-xs",
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-xl",
  };

  const Spinner = () => (
    <div
      className={`${sizeClasses[size]} border-2 border-transparent ${colorClasses[color]} rounded-full animate-spin`}
      style={{
        borderTopColor: "currentColor",
      }}
    />
  );

  const Dots = () => (
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`${sizeClasses[size]} bg-current rounded-full ${colorClasses[color]} animate-pulse`}
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  );

  const Pulse = () => (
    <div
      className={`${sizeClasses[size]} bg-current rounded-full ${colorClasses[color]} animate-pulse`}
    />
  );

  const renderLoader = () => {
    switch (variant) {
      case "dots":
        return <Dots />;
      case "pulse":
        return <Pulse />;
      default:
        return <Spinner />;
    }
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="flex flex-col items-center space-y-2">
        {renderLoader()}
        {text && (
          <p className={`text-gray-400 ${textSizeClasses[size]} animate-pulse`}>
            {text}
          </p>
        )}
      </div>
    </div>
  );
};

export default Loading;
