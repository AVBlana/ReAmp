"use client";

import { FaMusic } from "react-icons/fa";
import { useState } from "react";
import { motion } from "framer-motion";

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
          <motion.h1
            className="text-8xl md:text-9xl font-bold text-transparent tracking-tighter relative"
            style={{
              WebkitTextStroke: "1px #ff6b6b",
            }}
            animate={{
              filter: [
                "drop-shadow(0 0 8px rgba(255, 107, 107, 0.8)) drop-shadow(0 0 16px rgba(255, 107, 107, 0.6)) drop-shadow(0 0 24px rgba(255, 107, 107, 0.4)) drop-shadow(0 0 32px rgba(255, 107, 107, 0.2))",
                "drop-shadow(0 0 12px rgba(255, 107, 107, 1)) drop-shadow(0 0 24px rgba(255, 107, 107, 0.8)) drop-shadow(0 0 36px rgba(255, 107, 107, 0.6)) drop-shadow(0 0 48px rgba(255, 107, 107, 0.4))",
                "drop-shadow(0 0 8px rgba(255, 107, 107, 0.8)) drop-shadow(0 0 16px rgba(255, 107, 107, 0.6)) drop-shadow(0 0 24px rgba(255, 107, 107, 0.4)) drop-shadow(0 0 32px rgba(255, 107, 107, 0.2))",
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            ReAMP
          </motion.h1>
        </div>

        {/* ReAMP Button */}
        <div className="flex flex-col md:flex-row gap-8">
          <motion.a
            href="/reamp"
            className="group relative"
            onMouseEnter={() => setHovered("reamp")}
            onMouseLeave={() => setHovered(null)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-[#FF6B6B] to-[#FF8E8E] rounded-2xl blur-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: hovered === "reamp" ? 1 : 0 }}
              transition={{ duration: 0.5 }}
            />
            <div className="relative flex items-center space-x-4 px-8 py-4 bg-[#1A1A1A] rounded-2xl border border-white/20 hover:border-white/40 transition-all duration-300">
              <FaMusic className="w-8 h-8 text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B6B] to-[#FF8E8E]" />
              <span className="text-white text-xl font-medium">ReAMP</span>
            </div>
          </motion.a>

          {/* Demo Button */}
          <motion.a
            href="/demo"
            className="group relative"
            onMouseEnter={() => setHovered("demo")}
            onMouseLeave={() => setHovered(null)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-[#4ECDC4] to-[#6EE7DF] rounded-2xl blur-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: hovered === "demo" ? 1 : 0 }}
              transition={{ duration: 0.5 }}
            />
            <div className="relative flex items-center space-x-4 px-8 py-4 bg-[#1A1A1A] rounded-2xl border border-white/20 hover:border-white/40 transition-all duration-300">
              <FaMusic className="w-8 h-8 text-transparent bg-clip-text bg-gradient-to-r from-[#4ECDC4] to-[#6EE7DF]" />
              <span className="text-white text-xl font-medium">Demo</span>
            </div>
          </motion.a>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] pointer-events-none">
          {/* ReAMP Circle */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full border border-white/20"
            animate={{
              scale: hovered === "reamp" ? 1.5 : 1,
              opacity: hovered === "reamp" ? 1 : 0,
            }}
            transition={{ duration: 1 }}
          />
        </div>
      </div>
    </div>
  );
}
