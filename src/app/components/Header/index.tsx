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
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left section with icon and title */}
          <div className="flex items-center space-x-3 min-w-[200px]">
            {icon}
            <h1 className="text-xl font-bold text-white truncate">{title}</h1>
          </div>

          {/* Center section with search */}
          <div className="flex-1 max-w-2xl mx-4">{searchComponent}</div>

          {/* Right section with home and logout */}
          <div className="flex items-center space-x-3 min-w-[120px] justify-end">
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
