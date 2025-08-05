"use client";

import { useEffect, useState } from "react";

export default function SpotifyAuthCheck() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("spotify_token");
      setIsAuthenticated(!!token);
      setIsChecking(false);
    };

    checkAuth();

    // Listen for storage changes (when token is added/removed)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "spotify_token") {
        checkAuth();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleLogin = () => {
    window.location.href = "/api/spotify/login?origin=/reamp";
  };

  if (isChecking) {
    return (
      <div className="fixed top-4 right-4 bg-yellow-600/90 text-white px-4 py-2 rounded-lg z-50 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          <span>Checking Spotify authentication...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="fixed top-4 right-4 bg-red-600/90 text-white px-4 py-2 rounded-lg z-50 backdrop-blur-sm shadow-lg">
        <div className="flex items-center gap-2">
          <span>🎵 Spotify not connected</span>
          <button
            onClick={handleLogin}
            className="bg-white text-red-600 px-3 py-1 rounded text-sm hover:bg-gray-100 transition-colors font-medium"
          >
            Connect Spotify
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-4 right-4 bg-green-600/90 text-white px-4 py-2 rounded-lg z-50 backdrop-blur-sm shadow-lg">
      <div className="flex items-center gap-2">
        <span>✅ Spotify connected</span>
      </div>
    </div>
  );
}
