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
  }, []);

  const handleLogin = () => {
    window.location.href = "/api/spotify/login?origin=/reamp";
  };

  if (isChecking) {
    return (
      <div className="fixed top-4 right-4 bg-yellow-600/90 text-white px-4 py-2 rounded-lg z-50">
        Checking Spotify authentication...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="fixed top-4 right-4 bg-red-600/90 text-white px-4 py-2 rounded-lg z-50">
        <div className="flex items-center gap-2">
          <span>Spotify not connected</span>
          <button
            onClick={handleLogin}
            className="bg-white text-red-600 px-2 py-1 rounded text-sm hover:bg-gray-100 transition-colors"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return null;
}
