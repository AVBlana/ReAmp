import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      animation: {
        marquee: "marquee 10s linear infinite",
        spin: "spin 8s linear infinite",
        scratch: "scratch 0.15s ease-in-out infinite",
        "needle-shake": "needle-shake 0.15s ease-in-out infinite",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-100%)" },
        },
        scratch: {
          "0%": { transform: "rotate(0deg) scale(1)" },
          "25%": { transform: "rotate(3deg) scale(1.01)" },
          "50%": { transform: "rotate(0deg) scale(1)" },
          "75%": { transform: "rotate(-3deg) scale(0.99)" },
          "100%": { transform: "rotate(0deg) scale(1)" },
        },
        "needle-shake": {
          "0%": { transform: "rotate(var(--needle-rotation))" },
          "25%": { transform: "rotate(calc(var(--needle-rotation) + 1deg))" },
          "50%": { transform: "rotate(var(--needle-rotation))" },
          "75%": { transform: "rotate(calc(var(--needle-rotation) - 1deg))" },
          "100%": { transform: "rotate(var(--needle-rotation))" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
