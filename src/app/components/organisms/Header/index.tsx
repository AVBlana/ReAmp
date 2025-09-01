"use client";

import Link from "next/link";
import { FaHome } from "react-icons/fa";
import { ReactNode } from "react";
// Import atomic design components
import Button from "@/app/components/atoms/Button";
import Icon from "@/app/components/atoms/Icon";
import NotificationBadge from "@/app/components/atoms/NotificationBadge";

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
      <div className="p-6">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* Left section with icon and title */}
          <div className="flex items-center space-x-3 w-full lg:w-auto justify-between lg:justify-start">
            <div className="flex items-center space-x-3">
              {icon && icon}
              <h1
                className="text-2xl font-bold text-transparent tracking-tighter relative"
                style={{
                  WebkitTextStroke: "1px #ff6b6b",
                }}
              >
                {title}
              </h1>
            </div>
            {/* Show home, notifications, spotify status, and logout on mobile */}
            <div className="flex items-center space-x-2 lg:hidden">
              <Link
                href="/"
                className="text-gray-400 hover:text-white transition-colors p-1.5"
                aria-label="Home"
              >
                <Icon icon={<FaHome size={18} />} size="lg" />
              </Link>
              <NotificationBadge />
              {showLogout && onLogout && (
                <Button
                  onClick={onLogout}
                  variant="danger"
                  size="sm"
                  className="px-2 py-1"
                >
                  Logout
                </Button>
              )}
            </div>
          </div>

          {/* Center section with search */}
          <div className="w-full lg:flex-1 lg:max-w-2xl lg:mx-4 order-3 lg:order-2">
            {searchComponent}
          </div>

          {/* Right section with home, notifications, spotify status, and logout - hidden on mobile */}
          <div className="hidden lg:flex items-center space-x-3 min-w-[120px] justify-end order-2 lg:order-3">
            <Link
              href="/"
              className="text-gray-400 hover:text-white transition-colors p-2"
              aria-label="Home"
            >
              <Icon icon={<FaHome size={20} />} size="xl" />
            </Link>
            <NotificationBadge />
            {showLogout && onLogout && (
              <Button onClick={onLogout} variant="danger" size="md">
                Logout
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
