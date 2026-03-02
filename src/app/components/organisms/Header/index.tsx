"use client";

import Link from "next/link";
import { FaHome } from "react-icons/fa";
import { ReactNode } from "react";
// Import atomic design components
import Button from "@/app/components/atoms/Button";
import UserAvatar from "@/app/components/molecules/UserAvatar";

export interface HeaderProps {
  icon?: ReactNode;
  title: string;
  searchComponent: ReactNode;
  onLogout?: () => void;
  showLogout?: boolean;
}

export default function Header({
  icon,
  title,
  searchComponent,
  onLogout,
  showLogout = false,
}: HeaderProps) {
  return (
    <header className="bg-black/80 border-b border-white/10 sticky top-0 z-50 backdrop-blur-sm w-full">
      <div className="px-6 py-4">
        {/* Mobile Layout */}
        <div className="flex lg:hidden items-center justify-between gap-4">
          {/* Left: Icon and Title */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            {icon && icon}
            <h1
              className="text-xl font-bold text-transparent tracking-tighter"
              style={{
                WebkitTextStroke: "1px #ff6b6b",
              }}
            >
              {title}
            </h1>
          </div>

          {/* Right: User actions - finger-sized touch targets on mobile */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            <Link
              href="/"
              className="text-gray-400 hover:text-white transition-colors min-w-[44px] min-h-[44px] p-2 rounded-lg hover:bg-gray-700/50 flex items-center justify-center touch-manipulation"
              aria-label="Home"
            >
              <FaHome size={20} />
            </Link>
            <UserAvatar />
            {showLogout && onLogout && (
              <Button
                onClick={onLogout}
                variant="danger"
                size="sm"
                className="min-h-[44px] min-w-[44px] px-3 py-2 lg:px-2 lg:py-1 lg:min-h-0 lg:min-w-0"
              >
                Logout
              </Button>
            )}
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:flex items-center justify-between gap-8">
          {/* Left: Icon and Title */}
          <div className="flex items-center space-x-4 flex-shrink-0">
            {icon && icon}
            <h1
              className="text-2xl font-bold text-transparent tracking-tighter"
              style={{
                WebkitTextStroke: "1px #ff6b6b",
              }}
            >
              {title}
            </h1>
          </div>

          {/* Center: Search */}
          <div className="flex-1 max-w-2xl mx-8">{searchComponent}</div>

          {/* Right: User actions */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            <Link
              href="/"
              className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-700/50 flex items-center justify-center"
              aria-label="Home"
            >
              <FaHome size={20} />
            </Link>
            <UserAvatar />
            {showLogout && onLogout && (
              <Button onClick={onLogout} variant="danger" size="md">
                Logout
              </Button>
            )}
          </div>
        </div>

        {/* Search on mobile - separate row */}
        <div className="lg:hidden mt-4">{searchComponent}</div>
      </div>
    </header>
  );
}
