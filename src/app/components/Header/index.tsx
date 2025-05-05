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
    <header className="bg-black/80 border-b border-white/10 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center justify-between w-full md:w-auto">
            <div className="flex items-center space-x-2">
              {icon}
              <h1 className="text-2xl font-bold text-white">{title}</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <FaHome size={24} />
              </Link>
              {showLogout && onLogout && (
                <button
                  onClick={onLogout}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Logout
                </button>
              )}
            </div>
          </div>
          <div className="w-full md:w-1/2 lg:w-1/3">{searchComponent}</div>
        </div>
      </div>
    </header>
  );
}
