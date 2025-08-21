"use client";

import { useEffect, useState } from "react";

// Import atomic design components
import Button from "@/app/components/atoms/Button";
import Icon from "@/app/components/atoms/Icon";
import { FaCheck, FaExclamationTriangle } from "react-icons/fa";
import { useNotifications } from "@/app/context/NotificationContext";

export default function SpotifyAuthCheck() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const { addNotification } = useNotifications();

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("spotify_token");
      const wasAuthenticated = isAuthenticated;
      const newAuthState = !!token;

      setIsAuthenticated(newAuthState);
      setIsChecking(false);

      // Show notification when auth state changes
      if (wasAuthenticated !== newAuthState) {
        if (newAuthState) {
          addNotification({
            type: "success",
            message: "Spotify connected successfully",
            icon: <FaCheck size={16} />,
            duration: 4000,
          });
        } else {
          addNotification({
            type: "warning",
            message: "Spotify disconnected",
            icon: <FaExclamationTriangle size={16} />,
            duration: 4000,
          });
        }
      }
    };

    // Show initial status notification
    const token = localStorage.getItem("spotify_token");
    if (token) {
      addNotification({
        type: "info",
        message: "Welcome back! Spotify is connected",
        duration: 3000,
      });
    }

    checkAuth();

    // Listen for storage changes (when token is added/removed)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "spotify_token") {
        checkAuth();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [isAuthenticated, addNotification]);

  const handleLogin = () => {
    window.location.href = "/api/spotify/login?origin=/reamp";
  };

  if (isChecking) {
    return null; // Don't show anything while checking
  }

  if (!isAuthenticated) {
    return (
      <div className="bg-red-600/90 text-white px-3 py-1.5 rounded-lg backdrop-blur-sm shadow-lg">
        <div className="flex items-center gap-2">
          <Icon icon={<FaExclamationTriangle size={14} />} color="white" />
          <span className="text-sm">Spotify not connected</span>
          <Button
            onClick={handleLogin}
            variant="ghost"
            size="sm"
            className="bg-white text-red-600 hover:bg-gray-100 text-xs px-2 py-1"
          >
            Connect
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-green-600/90 text-white px-3 py-1.5 rounded-lg backdrop-blur-sm shadow-lg">
      <div className="flex items-center gap-2">
        <Icon icon={<FaCheck size={14} />} color="white" />
        <span className="text-sm">Spotify connected</span>
      </div>
    </div>
  );
}
