import React from "react";

export interface ControlButtonProps {
  onClick?: () => void;
  icon: React.ReactNode;
  variant?: "primary" | "secondary" | "danger" | "ghost" | "dj" | "watermelon";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  active?: boolean;
  className?: string;
  title?: string;
}

const ControlButton: React.FC<ControlButtonProps> = ({
  onClick,
  icon,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  active = false,
  className = "",
  title,
}) => {
  const baseClasses =
    "inline-flex items-center justify-center font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variantClasses = {
    primary:
      "bg-[#FF6B6B] hover:bg-[#FF5252] text-white focus:ring-[#FF6B6B] shadow-lg hover:shadow-xl hover:shadow-[#FF6B6B]/25",
    secondary:
      "bg-[#4ECDC4] hover:bg-[#45B7AA] text-white focus:ring-[#4ECDC4] shadow-lg hover:shadow-xl hover:shadow-[#4ECDC4]/25",
    danger:
      "bg-red-500/90 hover:bg-red-600 text-white focus:ring-red-500 shadow-lg hover:shadow-xl",
    ghost:
      "bg-transparent hover:bg-white/10 text-gray-400 hover:text-white focus:ring-white/20 border border-white/20 hover:border-[#FF6B6B]/40",
    dj: "bg-black/50 hover:bg-black/70 text-white border border-gray-600 hover:border-[#FF6B6B] focus:ring-[#FF6B6B] shadow-lg hover:shadow-xl",
    watermelon:
      "bg-gradient-to-br from-[#FF6B6B] to-[#FF5252] hover:from-[#FF5252] hover:to-[#FF4040] text-white focus:ring-[#FF6B6B] shadow-lg hover:shadow-xl hover:shadow-[#FF6B6B]/30",
  };

  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
  };

  const activeClasses = active
    ? "ring-2 ring-[#FF6B6B]/50 bg-opacity-80 shadow-lg shadow-[#FF6B6B]/25"
    : "";

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${activeClasses} ${className}`;

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={classes}
      title={title}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        <div>{icon}</div>
      )}
    </button>
  );
};

export default ControlButton;
