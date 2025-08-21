import React, { forwardRef } from "react";

export interface InputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "email" | "password" | "search";
  variant?: "default" | "search" | "ghost" | "watermelon";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
  onIconClick?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  autoFocus?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      value,
      onChange,
      placeholder = "",
      type = "text",
      variant = "default",
      size = "md",
      disabled = false,
      className = "",
      icon,
      onIconClick,
      onFocus,
      onBlur,
      onKeyDown,
      autoFocus = false,
    },
    ref
  ) => {
    const baseClasses =
      "w-full text-white placeholder-gray-400 rounded-lg border-2 focus:outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

    const variantClasses = {
      default:
        "bg-black/20 border-[#FF6B6B] focus:bg-black/30 focus:border-[#FF5252] focus:shadow-lg focus:shadow-[#FF6B6B]/25",
      search:
        "bg-black/20 border-[#FF6B6B] focus:bg-black/30 focus:border-[#FF5252] focus:shadow-lg focus:shadow-[#FF6B6B]/25",
      ghost:
        "bg-transparent border-transparent focus:bg-black/10 focus:border-[#FF6B6B]/40",
      watermelon:
        "bg-black/30 border-[#FF6B6B] focus:bg-black/40 focus:border-[#FF5252] focus:shadow-lg focus:shadow-[#FF6B6B]/30",
    };

    const sizeClasses = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2 text-base",
      lg: "px-5 py-3 text-lg",
    };

    const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

    return (
      <div className="relative">
        <input
          ref={ref}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={classes}
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
          autoFocus={autoFocus}
        />
        {icon && (
          <div
            className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
              onIconClick ? "cursor-pointer" : ""
            }`}
            onClick={onIconClick}
          >
            {icon}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
