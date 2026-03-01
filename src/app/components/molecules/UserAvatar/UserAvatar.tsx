"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useNotifications } from "@/app/context/NotificationContext";
import { useOutsideClick } from "@/app/hooks";
import NotificationBadge from "@/app/components/atoms/NotificationBadge";
import { getConnectUrl } from "@/lib/auth-helpers";
import { FaUser, FaBell, FaChevronDown } from "react-icons/fa";

const UserAvatar: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const { notifications, removeNotification } = useNotifications();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useOutsideClick(dropdownRef, () => {
    setIsDropdownOpen(false);
  });

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  if (!isAuthenticated) {
    return null;
  }

  const persistentNotifications = notifications.filter((n) => n.duration === 0);
  const transientNotifications = notifications.filter((n) => n.duration !== 0);
  const totalNotifications = notifications.length;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* User Avatar Button */}
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-700/50 transition-colors relative"
        aria-label="User notifications"
      >
        {/* Avatar */}
        <div className="w-8 h-8 bg-gradient-to-br from-[#FF6B6B] to-[#4ECDC4] rounded-full flex items-center justify-center">
          {user?.image && !imageError ? (
            // eslint-disable-next-line @next/next/no-img-element -- dynamic external avatar URL
            <img
              src={user.image}
              alt={user.name || "User"}
              className="w-8 h-8 rounded-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <FaUser className="text-white text-sm" />
          )}
        </div>

        {/* Notification Bell with Badge */}
        <div className="relative">
          <FaBell className="text-gray-400 hover:text-white transition-colors" />
          {totalNotifications > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {totalNotifications > 9 ? "9+" : totalNotifications}
            </span>
          )}
        </div>

        {/* Dropdown Arrow */}
        <FaChevronDown
          className={`text-gray-400 transition-transform ${
            isDropdownOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Notifications Dropdown */}
      {isDropdownOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-gray-800 rounded-lg shadow-xl border border-gray-700 z-50 max-h-96 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-white">
                Notifications
              </h3>
              <span className="text-sm text-gray-400">
                {totalNotifications} notification
                {totalNotifications !== 1 ? "s" : ""}
              </span>
            </div>

            {totalNotifications === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <FaBell className="mx-auto mb-2 text-2xl" />
                <p>No notifications</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Persistent notifications */}
                {persistentNotifications.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-2">
                      Service Status
                    </h4>
                    {persistentNotifications.map((notification) => (
                      <NotificationBadge
                        key={notification.id}
                        notification={notification}
                        onDismiss={removeNotification}
                        onAction={() => {
                          if (notification.message.includes("Spotify")) {
                            window.location.href = getConnectUrl("spotify");
                          } else if (notification.message.includes("YouTube")) {
                            window.location.href = getConnectUrl("google");
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
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserAvatar;
