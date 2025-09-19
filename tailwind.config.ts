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
        // Spotify brand colors
        spotify: {
          green: "#1DB954",
          "green-hover": "#1AA34A",
        },
        // Google brand colors
        google: {
          blue: "#4285F4",
          "blue-hover": "#3367D6",
        },
      },
    },
  },
  plugins: [],
};

export default config;
