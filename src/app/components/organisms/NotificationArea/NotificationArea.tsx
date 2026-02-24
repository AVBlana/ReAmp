"use client";

import React, { useEffect, useState } from "react";
import { useNotifications } from "@/app/context/NotificationContext";
import { useAuth } from "@/app/context/AuthContext";
import { useConnectedServices } from "@/app/hooks/useConnectedServices";
import NotificationBadge from "@/app/components/atoms/NotificationBadge";
import { FaSpotify, FaGoogle } from "react-icons/fa";
import { getConnectUrl } from "@/lib/auth-helpers";

const NotificationArea: React.FC = () => {
  const { notifications, addNotification, removeNotification } =
    useNotifications();
  const { isAuthenticated } = useAuth();
  const { spotify, youtube, loading } = useConnectedServices();
  const [hasCheckedServices, setHasCheckedServices] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || loading || hasCheckedServices) return;

    if (!spotify) {
      const wasRecentlyConnected = localStorage.getItem("spotify_was_connected");
      const lastConnectionCheck = localStorage.getItem("spotify_last_check");
      const now = Date.now();
      const isRecentDisconnection =
        wasRecentlyConnected === "true" &&
        lastConnectionCheck &&
        now - parseInt(lastConnectionCheck, 10) < 300000;

      addNotification({
        type: isRecentDisconnection ? "error" : "warning",
        message: isRecentDisconnection
          ? "Spotify connection was lost. Your Spotify account may have been disconnected. Please reconnect to continue using Spotify features."
          : "Spotify is not connected. Connect your Spotify account to search and play Spotify tracks.",
        icon: <FaSpotify className="text-green-500" />,
        duration: 0,
      });
    } else {
      localStorage.setItem("spotify_was_connected", "true");
    }

    if (!youtube) {
      addNotification({
        type: "warning",
        message:
          "YouTube (Google) is not connected. Connect your Google account to search and play YouTube videos.",
        icon: <FaGoogle className="text-blue-500" />,
        duration: 0,
      });
    }

    localStorage.setItem("spotify_last_check", Date.now().toString());
    setHasCheckedServices(true);
  }, [isAuthenticated, loading, hasCheckedServices, spotify, youtube, addNotification]);

  const handleConnectAction = (notification: { message: string }) => {
    if (notification.message.includes("Spotify")) {
      window.location.href = getConnectUrl("spotify");
    } else if (notification.message.includes("YouTube")) {
      window.location.href = getConnectUrl("google");
    }
  };

  const persistentNotifications = notifications.filter((n) => n.duration === 0);
  const transientNotifications = notifications.filter((n) => n.duration !== 0);

  if (
    persistentNotifications.length === 0 &&
    transientNotifications.length === 0
  ) {
    return null;
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-6">
      <h3 className="text-lg font-semibold text-white mb-4">Notifications</h3>

      {persistentNotifications.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-300 mb-2">
            Service Status
          </h4>
          {persistentNotifications.map((notification) => (
            <NotificationBadge
              key={notification.id}
              notification={notification}
              onDismiss={removeNotification}
              onAction={() => handleConnectAction(notification)}
              actionLabel="Connect"
            />
          ))}
        </div>
      )}

      {transientNotifications.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-2">
            Recent Activity
          </h4>
          {transientNotifications.map((notification) => (
            <NotificationBadge
              key={notification.id}
              notification={notification}
              onDismiss={removeNotification}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationArea;
