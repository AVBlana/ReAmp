import React from "react";

export interface IconProps {
  icon: React.ReactNode;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  color?: "primary" | "secondary" | "white" | "gray" | "red";
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  animated?: boolean;
}

const Icon: React.FC<IconProps> = ({
  icon,
  size = "md",
  color = "white",
  className = "",
  onClick,
  disabled = false,
  animated = false,
}) => {
  const sizeClasses = {
    xs: "w-3 h-3",
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
    xl: "w-8 h-8",
  };

  const colorClasses = {
    primary: "text-[#FF6B6B]",
    secondary: "text-[#4ECDC4]",
    white: "text-white",
    gray: "text-gray-400",
    red: "text-red-500",
  };

  const baseClasses = `inline-block transition-colors duration-200 ${sizeClasses[size]} ${colorClasses[color]}`;
  const interactiveClasses = onClick ? "cursor-pointer hover:scale-110" : "";
  const disabledClasses = disabled ? "opacity-50 cursor-not-allowed" : "";

  const classes = `${baseClasses} ${interactiveClasses} ${disabledClasses} ${className}`;

  return (
    <div className={classes} onClick={disabled ? undefined : onClick}>
      {icon}
    </div>
  );
};

export default Icon;
