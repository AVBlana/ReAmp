"use client";

import { FaYoutube, FaSpotify } from "react-icons/fa";
import { useState } from "react";

export default function Home() {
  const [rotated, setRotated] = useState(false);

  return (
    <div
      className="relative flex items-center justify-center min-h-screen w-full overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse at 50% 50%, #232325 60%, #000 100%)",
      }}
    >
      <div
        className="relative w-[80vw] h-[80vw] max-w-[900px] max-h-[900px] flex items-center justify-center"
        onMouseEnter={() => setRotated(true)}
        onMouseLeave={() => setRotated(false)}
      >
        {/* SVG Yin-Yang Symbol */}
        <svg
          viewBox="0 0 100 100"
          className={`absolute inset-0 w-full h-full transition-transform duration-700 ease-in-out ${
            rotated ? "rotate-180" : "rotate-0"
          }`}
          style={{ display: "block", filter: "drop-shadow(0 0 32px #fff8)" }}
        >
          {/* White teardrop (top) */}
          <path
            d="M50,0 A50,50 0 1,1 50,100 A25,25 0 1,0 50,50 A25,25 0 1,1 50,0 Z"
            fill="#fff"
          />
          {/* Black teardrop (bottom) */}
          <path
            d="M50,100 A50,50 0 1,1 50,0 A25,25 0 1,0 50,50 A25,25 0 1,1 50,100 Z"
            fill="#121212"
          />
          {/* Small black circle in white half */}
          <circle cx="50" cy="25" r="10" fill="#121212" />
          {/* Small white circle in black half */}
          <circle cx="50" cy="75" r="10" fill="#fff" />
        </svg>
        {/* App Title Centered Over Symbol */}
        <h1 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 text-7xl md:text-8xl lg:text-9xl font-bold mix-blend-difference pointer-events-none select-none max-w-[80vw] max-w-[900px] w-full text-center leading-none">
          ReAMP
        </h1>
        {/* YouTube icon in black circle (top) */}
        <a
          href="/youtube"
          className="absolute z-20 group"
          style={{
            left: "50%",
            top: "25%",
            transform: "translate(-50%, -50%)",
            width: "20%",
            height: "20%",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.01)",
            transition: "box-shadow 0.2s, background 0.2s",
          }}
          tabIndex={0}
        >
          <span className="absolute inset-0 rounded-full group-hover:ring-4 group-hover:ring-[#FF0000]/30 transition" />
          <FaYoutube className="text-[#FF0000] w-16 h-16 drop-shadow-[0_0_8px_#0008] relative z-10" />
        </a>
        {/* Spotify icon in white circle (bottom) */}
        <a
          href="/spotify"
          className="absolute z-20 group"
          style={{
            left: "50%",
            top: "75%",
            transform: "translate(-50%, -50%)",
            width: "20%",
            height: "20%",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.01)",
            transition: "box-shadow 0.2s, background 0.2s",
          }}
          tabIndex={0}
        >
          <span className="absolute inset-0 rounded-full group-hover:ring-4 group-hover:ring-[#1DB954]/30 transition" />
          <FaSpotify className="text-[#1DB954] w-16 h-16 drop-shadow-[0_0_8px_#fff8] relative z-10" />
        </a>
      </div>
    </div>
  );
}
