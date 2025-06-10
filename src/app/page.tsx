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
        <div className="relative">
          <h1 className="text-8xl md:text-9xl font-bold text-transparent bg-clip-text bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1DB954] via-[#FF0000] to-[#1DB954] tracking-tighter relative">
            ReAMP
            <style jsx>{`
              h1 {
                text-shadow: 0 0 20px rgba(29, 185, 84, 0.6),
                  0 0 40px rgba(255, 0, 0, 0.5), 0 0 60px rgba(29, 185, 84, 0.4);
                animation: colorPulse 4s ease-in-out infinite;
                background-size: 200% 200%;
                background-position: 0% 0%;
              }
              @keyframes colorPulse {
                0% {
                  background-position: 0% 0%;
                  text-shadow: 0 0 20px rgba(29, 185, 84, 0.6),
                    0 0 40px rgba(255, 0, 0, 0.5),
                    0 0 60px rgba(29, 185, 84, 0.4);
                }
                25% {
                  background-position: 100% 0%;
                  text-shadow: 0 0 30px rgba(255, 0, 0, 0.6),
                    0 0 50px rgba(29, 185, 84, 0.5),
                    0 0 70px rgba(255, 0, 0, 0.4);
                }
                50% {
                  background-position: 100% 100%;
                  text-shadow: 0 0 20px rgba(29, 185, 84, 0.6),
                    0 0 40px rgba(255, 0, 0, 0.5),
                    0 0 60px rgba(29, 185, 84, 0.4);
                }
                75% {
                  background-position: 0% 100%;
                  text-shadow: 0 0 30px rgba(255, 0, 0, 0.6),
                    0 0 50px rgba(29, 185, 84, 0.5),
                    0 0 70px rgba(255, 0, 0, 0.4);
                }
                100% {
                  background-position: 0% 0%;
                  text-shadow: 0 0 20px rgba(29, 185, 84, 0.6),
                    0 0 40px rgba(255, 0, 0, 0.5),
                    0 0 60px rgba(29, 185, 84, 0.4);
                }
              }
              .seed {
                position: absolute;
                background: conic-gradient(
                  from 45deg,
                  #1db954,
                  #ff0000,
                  #1db954
                );
                border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
                opacity: 0.95;
                box-shadow: 0 0 15px rgba(29, 185, 84, 0.7),
                  0 0 30px rgba(255, 0, 0, 0.5);
                animation: seedFloat 3s ease-in-out infinite;
                filter: brightness(1.2) contrast(1.2);
              }
              @keyframes seedFloat {
                0%,
                100% {
                  transform: translate(0, 0) rotate(var(--rotation)) scale(1);
                  box-shadow: 0 0 15px rgba(29, 185, 84, 0.7),
                    0 0 30px rgba(255, 0, 0, 0.5);
                }
                25% {
                  transform: translate(2px, -2px)
                    rotate(calc(var(--rotation) + 5deg)) scale(1.1);
                  box-shadow: 0 0 20px rgba(255, 0, 0, 0.7),
                    0 0 35px rgba(29, 185, 84, 0.5);
                }
                50% {
                  transform: translate(0, 0) rotate(var(--rotation)) scale(1);
                  box-shadow: 0 0 15px rgba(29, 185, 84, 0.7),
                    0 0 30px rgba(255, 0, 0, 0.5);
                }
                75% {
                  transform: translate(-2px, 2px)
                    rotate(calc(var(--rotation) - 5deg)) scale(0.9);
                  box-shadow: 0 0 20px rgba(255, 0, 0, 0.7),
                    0 0 35px rgba(29, 185, 84, 0.5);
                }
              }
              .seed-1 {
                --rotation: -45deg;
                width: 6px;
                height: 9px;
                top: 45%;
                left: 15%;
                animation-delay: 0s;
              }
              .seed-2 {
                --rotation: 30deg;
                width: 5px;
                height: 8px;
                top: 45%;
                right: 25%;
                animation-delay: 0.5s;
              }
              .seed-3 {
                --rotation: -20deg;
                width: 4px;
                height: 7px;
                top: 45%;
                left: 30%;
                animation-delay: 1s;
              }
              .seed-4 {
                --rotation: 45deg;
                width: 5px;
                height: 8px;
                top: 45%;
                right: 15%;
                animation-delay: 1.5s;
              }
              .seed-5 {
                --rotation: -30deg;
                width: 4px;
                height: 6px;
                top: 45%;
                right: 30%;
                animation-delay: 2s;
              }
              .seed-6 {
                --rotation: 15deg;
                width: 5px;
                height: 7px;
                top: 45%;
                left: 25%;
                animation-delay: 2.5s;
              }
              @media (min-width: 768px) {
                .seed-1 {
                  width: 8px;
                  height: 12px;
                }
                .seed-2 {
                  width: 7px;
                  height: 10px;
                }
                .seed-3 {
                  width: 6px;
                  height: 9px;
                }
                .seed-4 {
                  width: 7px;
                  height: 10px;
                }
                .seed-5 {
                  width: 5px;
                  height: 8px;
                }
                .seed-6 {
                  width: 6px;
                  height: 9px;
                }
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

        {/* Service Buttons */}
        <div className="flex flex-col md:flex-row gap-8">
          {/* ReAMP Button */}
          <a
            href="/reamp"
            className="group relative"
            onMouseEnter={() => setHovered("reamp")}
            onMouseLeave={() => setHovered(null)}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#FF6B6B] to-[#FF8E8E] rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative flex items-center space-x-4 px-8 py-4 bg-[#1A1A1A] rounded-2xl border border-white/20 hover:border-white/40 transition-all duration-300">
              <FaMusic className="w-8 h-8 text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B6B] to-[#FF8E8E]" />
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
