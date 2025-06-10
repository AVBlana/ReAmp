import Link from "next/link";
import { FaHome } from "react-icons/fa";
import { ReactNode } from "react";

interface HeaderProps {
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
              <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#1DB954] to-[#FF0000] tracking-tighter relative">
                {title}
                <style jsx>{`
                  .seed {
                    position: absolute;
                    background: linear-gradient(to right, #1db954, #ff0000);
                    border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
                    opacity: 0.95;
                    filter: brightness(1.2) contrast(1.2);
                  }
                  .seed-1 {
                    --rotation: -45deg;
                    width: 3px;
                    height: 5px;
                    top: 45%;
                    left: 15%;
                    transform: rotate(-45deg);
                  }
                  .seed-2 {
                    --rotation: 30deg;
                    width: 2.5px;
                    height: 4px;
                    top: 45%;
                    right: 25%;
                    transform: rotate(30deg);
                  }
                  .seed-3 {
                    --rotation: -20deg;
                    width: 2px;
                    height: 3.5px;
                    top: 45%;
                    left: 30%;
                    transform: rotate(-20deg);
                  }
                  .seed-4 {
                    --rotation: 45deg;
                    width: 2.5px;
                    height: 4px;
                    top: 45%;
                    right: 15%;
                    transform: rotate(45deg);
                  }
                  .seed-5 {
                    --rotation: -30deg;
                    width: 2px;
                    height: 3px;
                    top: 45%;
                    right: 30%;
                    transform: rotate(-30deg);
                  }
                  .seed-6 {
                    --rotation: 15deg;
                    width: 2.5px;
                    height: 3.5px;
                    top: 45%;
                    left: 25%;
                    transform: rotate(15deg);
                  }
                `}</style>
                <span className="seed seed-1"></span>
                <span className="seed seed-2"></span>
                <span className="seed seed-3"></span>
                <span className="seed seed-4"></span>
                <span className="seed seed-5"></span>
                <span className="seed seed-6"></span>
              </h1>
            </div>
            {/* Show home and logout on mobile */}
            <div className="flex items-center space-x-2 lg:hidden">
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
          <div className="w-full lg:flex-1 lg:max-w-2xl lg:mx-4 order-3 lg:order-2">
            {searchComponent}
          </div>

          {/* Right section with home and logout - hidden on mobile */}
          <div className="hidden lg:flex items-center space-x-3 min-w-[120px] justify-end order-2 lg:order-3">
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
