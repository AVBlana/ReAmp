"use client";

import React, { useEffect, useState } from "react";
import { useNotifications } from "@/app/context/NotificationContext";
import { useAuth } from "@/app/context/AuthContext";
import NotificationBadge from "@/app/components/atoms/NotificationBadge";
import { FaSpotify, FaGoogle } from "react-icons/fa";

const NotificationArea: React.FC = () => {
  const { notifications, addNotification, removeNotification } =
    useNotifications();
  const { isAuthenticated } = useAuth();
  const [hasCheckedServices, setHasCheckedServices] = useState(false);

  // Check connected services and add notifications for missing ones
  useEffect(() => {
    const checkConnectedServices = async () => {
      if (!isAuthenticated || hasCheckedServices) return;

      try {
        const response = await fetch("/api/user/connected-services");
        if (response.ok) {
          const services = await response.json();

          // Add notifications for missing services only if they're actually missing
          if (!services.spotify) {
            // Check if this is a recent disconnection (could be due to revoked token)
            const wasRecentlyConnected = localStorage.getItem(
              "spotify_was_connected"
            );
            const lastConnectionCheck =
              localStorage.getItem("spotify_last_check");
            const now = Date.now();
            const isRecentDisconnection =
              wasRecentlyConnected === "true" &&
              lastConnectionCheck &&
              now - parseInt(lastConnectionCheck) < 300000; // 5 minutes

            if (isRecentDisconnection) {
              addNotification({
                type: "error",
                message:
                  "Spotify connection was lost. Your Spotify account may have been disconnected. Please reconnect to continue using Spotify features.",
                icon: <FaSpotify className="text-green-500" />,
                duration: 0, // Persistent notification
              });
            } else {
              addNotification({
                type: "warning",
                message:
                  "Spotify is not connected. Connect your Spotify account to search and play Spotify tracks.",
                icon: <FaSpotify className="text-green-500" />,
                duration: 0, // Persistent notification
              });
            }
          } else {
            // Spotify is connected, update tracking
            localStorage.setItem("spotify_was_connected", "true");
          }

          if (!services.youtube) {
            addNotification({
              type: "warning",
              message:
                "YouTube (Google) is not connected. Connect your Google account to search and play YouTube videos.",
              icon: <FaGoogle className="text-blue-500" />,
              duration: 0, // Persistent notification
            });
          }
        } else {
          console.error("Failed to fetch connected services:", response.status);
        }
      } catch (error) {
        console.error("Error checking connected services:", error);
        addNotification({
          type: "error",
          message:
            "Failed to check connected services. Please refresh the page.",
          duration: 10000,
        });
      } finally {
        setHasCheckedServices(true);
        // Update last check timestamp
        localStorage.setItem("spotify_last_check", Date.now().toString());
      }
    };

    checkConnectedServices();
  }, [isAuthenticated, hasCheckedServices, addNotification]);

  // Filter persistent notifications (those that should stay until resolved)
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

      {/* Persistent notifications */}
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
              onAction={() => {
                // Handle connect action
                if (notification.message.includes("Spotify")) {
                  window.location.href =
                    "/api/auth/signin/spotify?callbackUrl=" +
                    encodeURIComponent(
                      window.location.origin + "/?connected=spotify"
                    );
                } else if (notification.message.includes("YouTube")) {
                  window.location.href =
                    "/api/auth/signin/google?callbackUrl=" +
                    encodeURIComponent(
                      window.location.origin + "/?connected=google"
                    );
                }
              }}
              actionLabel="Connect"
            />
          ))}
        </div>
      )}

      {/* Transient notifications */}
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
