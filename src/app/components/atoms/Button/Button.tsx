import React from "react";

export interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?:
    | "primary"
    | "secondary"
    | "danger"
    | "ghost"
    | "spotify"
    | "youtube"
    | "watermelon";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit" | "reset";
  icon?: React.ReactNode;
  loading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = "primary",
  size = "md",
  disabled = false,
  className = "",
  type = "button",
  icon,
  loading = false,
}) => {
  const baseClasses =
    "inline-flex items-center justify-center font-medium rounded-md transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";

  const variantClasses = {
    primary:
      "bg-[#FF6B6B] hover:bg-[#FF5252] text-white shadow-lg hover:shadow-xl hover:shadow-[#FF6B6B]/25",
    secondary:
      "bg-[#4ECDC4] hover:bg-[#45B7AA] text-white shadow-lg hover:shadow-xl hover:shadow-[#4ECDC4]/25",
    danger:
      "bg-red-500/90 hover:bg-red-600 text-white shadow-lg hover:shadow-xl",
    ghost:
      "bg-transparent hover:bg-white/10 text-gray-400 hover:text-white border border-white/20 hover:border-[#FF6B6B]/40",
    spotify:
      "bg-[#1DB954] hover:bg-[#1ed760] text-white shadow-lg hover:shadow-xl hover:shadow-[#1DB954]/25",
    youtube:
      "bg-[#FF0000] hover:bg-[#CC0000] text-white shadow-lg hover:shadow-xl hover:shadow-[#FF0000]/25",
    watermelon:
      "bg-gradient-to-r from-[#FF6B6B] to-[#FF5252] hover:from-[#FF5252] hover:to-[#FF4040] text-white shadow-lg hover:shadow-xl hover:shadow-[#FF6B6B]/30",
  };

  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base",
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={classes}
    >
      {loading && (
        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full mr-2 animate-spin" />
      )}
      {icon && !loading && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};

export default Button;
