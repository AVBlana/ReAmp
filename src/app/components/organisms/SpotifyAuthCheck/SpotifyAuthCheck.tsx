"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

// Import atomic design components
import Button from "@/app/components/atoms/Button";
import Icon from "@/app/components/atoms/Icon";
import { FaCheck, FaExclamationTriangle } from "react-icons/fa";
import { useNotifications } from "@/app/context/NotificationContext";

export default function SpotifyAuthCheck() {
  const { data: session, status } = useSession();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const { addNotification } = useNotifications();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsChecking(true);
        const response = await fetch("/api/user/connected-services", {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          const wasAuthenticated = isAuthenticated;
          const newAuthState = data.user?.providers?.spotify || false;

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
        } else {
          setIsAuthenticated(false);
          setIsChecking(false);
        }
      } catch (error) {
        console.error("Error checking Spotify auth:", error);
        setIsAuthenticated(false);
        setIsChecking(false);
      }
    };

    if (status === "loading") {
      setIsChecking(true);
    } else if (session?.user) {
      checkAuth();
    } else {
      setIsAuthenticated(false);
      setIsChecking(false);
    }
  }, [session, status, isAuthenticated, addNotification]);

  const handleLogin = () => {
    window.location.href = "/";
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
