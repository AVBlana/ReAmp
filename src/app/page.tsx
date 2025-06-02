"use client";

import { FaYoutube, FaSpotify, FaMusic } from "react-icons/fa";
import { useState } from "react";

export default function Home() {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="relative flex items-center justify-center min-h-screen w-full overflow-hidden bg-[#0A0A0A]">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black_70%)]" />

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center space-y-16">
        {/* Title */}
        <h1 className="text-8xl md:text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FF0000] via-[#1DB954] to-[#FF0000] tracking-tighter">
          ReAMP
        </h1>

        {/* Service Buttons */}
        <div className="flex flex-col md:flex-row gap-8">
          {/* ReAMP Button */}
          <a
            href="/reamp"
            className="group relative"
            onMouseEnter={() => setHovered("reamp")}
            onMouseLeave={() => setHovered(null)}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#FF0000] via-[#1DB954] to-[#FF0000] rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative flex items-center space-x-4 px-8 py-4 bg-[#1A1A1A] rounded-2xl border border-white/20 hover:border-white/40 transition-all duration-300">
              <FaMusic className="w-8 h-8 text-transparent bg-clip-text bg-gradient-to-r from-[#FF0000] via-[#1DB954] to-[#FF0000]" />
              <span className="text-white text-xl font-medium">ReAMP</span>
            </div>
          </a>

          {/* YouTube Button */}
          <a
            href="/youtube"
            className="group relative"
            onMouseEnter={() => setHovered("youtube")}
            onMouseLeave={() => setHovered(null)}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#FF0000] to-[#FF0000]/50 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative flex items-center space-x-4 px-8 py-4 bg-[#1A1A1A] rounded-2xl border border-[#FF0000]/20 hover:border-[#FF0000]/40 transition-all duration-300">
              <FaYoutube className="text-[#FF0000] w-8 h-8" />
              <span className="text-white text-xl font-medium">YouTube</span>
            </div>
          </a>

          {/* Spotify Button */}
          <a
            href="/api/spotify/login"
            className="group relative"
            onMouseEnter={() => setHovered("spotify")}
            onMouseLeave={() => setHovered(null)}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#1DB954] to-[#1DB954]/50 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative flex items-center space-x-4 px-8 py-4 bg-[#1A1A1A] rounded-2xl border border-[#1DB954]/20 hover:border-[#1DB954]/40 transition-all duration-300">
              <FaSpotify className="text-[#1DB954] w-8 h-8" />
              <span className="text-white text-xl font-medium">Spotify</span>
            </div>
          </a>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] pointer-events-none">
          {/* ReAMP Circle */}
          <div
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full border border-white/20 transition-all duration-1000 ${
              hovered === "reamp"
                ? "scale-150 opacity-100"
                : "scale-100 opacity-0"
            }`}
          />
          {/* YouTube Circle */}
          <div
            className={`absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full border border-[#FF0000]/20 transition-all duration-1000 ${
              hovered === "youtube"
                ? "scale-150 opacity-100"
                : "scale-100 opacity-0"
            }`}
          />
          {/* Spotify Circle */}
          <div
            className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full border border-[#1DB954]/20 transition-all duration-1000 ${
              hovered === "spotify"
                ? "scale-150 opacity-100"
                : "scale-100 opacity-0"
            }`}
          />
        </div>
      </div>
    </div>
  );
}
