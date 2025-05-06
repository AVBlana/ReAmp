import Link from "next/link";
import { FaHome } from "react-icons/fa";
import { ReactNode } from "react";

interface HeaderProps {
  icon: ReactNode;
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
    <header className="bg-black/80 border-b border-white/10 sticky top-0 z-50 backdrop-blur-sm">
      <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4">
          {/* Left section with icon and title */}
          <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center space-x-2 sm:space-x-3">
              {icon}
              <h1 className="text-lg sm:text-xl font-bold text-white truncate max-w-[150px] sm:max-w-none">
                {title}
              </h1>
            </div>
            {/* Show home and logout on mobile */}
            <div className="flex items-center space-x-2 sm:hidden">
              <Link
                href="/"
                className="text-gray-400 hover:text-white transition-colors p-1.5"
                aria-label="Home"
              >
                <FaHome size={18} />
              </Link>
              {showLogout && onLogout && (
                <button
                  onClick={onLogout}
                  className="px-2 py-1 bg-red-500/90 hover:bg-red-600 text-white text-xs rounded-md transition-colors"
                >
                  Logout
                </button>
              )}
            </div>
          </div>

          {/* Center section with search */}
          <div className="w-full sm:flex-1 sm:max-w-2xl sm:mx-4 order-3 sm:order-2">
            {searchComponent}
          </div>

          {/* Right section with home and logout - hidden on mobile */}
          <div className="hidden sm:flex items-center space-x-3 min-w-[120px] justify-end order-2 sm:order-3">
            <Link
              href="/"
              className="text-gray-400 hover:text-white transition-colors p-2"
              aria-label="Home"
            >
              <FaHome size={20} />
            </Link>
            {showLogout && onLogout && (
              <button
                onClick={onLogout}
                className="px-3 py-1.5 bg-red-500/90 hover:bg-red-600 text-white text-sm rounded-md transition-colors"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
