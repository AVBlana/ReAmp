"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaBell,
  FaTimes,
  FaCheck,
  FaExclamationTriangle,
  FaInfo,
  FaExclamationCircle,
} from "react-icons/fa";
import {
  useNotifications,
  Notification,
} from "@/app/context/NotificationContext";
import Icon from "@/app/components/atoms/Icon";

const getNotificationIcon = (type: Notification["type"]) => {
  switch (type) {
    case "success":
      return <FaCheck size={14} />;
    case "error":
      return <FaExclamationCircle size={14} />;
    case "warning":
      return <FaExclamationTriangle size={14} />;
    case "info":
      return <FaInfo size={14} />;
    default:
      return <FaInfo size={14} />;
  }
};

const getNotificationColor = (type: Notification["type"]) => {
  switch (type) {
    case "success":
      return "bg-green-500";
    case "error":
      return "bg-red-500";
    case "warning":
      return "bg-yellow-500";
    case "info":
      return "bg-blue-500";
    default:
      return "bg-gray-500";
  }
};

const getNotificationBgColor = (type: Notification["type"]) => {
  switch (type) {
    case "success":
      return "bg-green-50 border-green-200";
    case "error":
      return "bg-red-50 border-red-200";
    case "warning":
      return "bg-yellow-50 border-yellow-200";
    case "info":
      return "bg-blue-50 border-blue-200";
    default:
      return "bg-gray-50 border-gray-200";
  }
};

const getNotificationTextColor = (type: Notification["type"]) => {
  switch (type) {
    case "success":
      return "text-green-800";
    case "error":
      return "text-red-800";
    case "warning":
      return "text-yellow-800";
    case "info":
      return "text-blue-800";
    default:
      return "text-gray-800";
  }
};

export default function NotificationBadge() {
  const {
    notifications,
    removeNotification,
    clearNotifications,
    addNotification,
  } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.length;

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    if (minutes > 0) {
      return `${minutes}m ago`;
    } else if (seconds > 0) {
      return `${seconds}s ago`;
    } else {
      return "Just now";
    }
  };

  // Demo function to test notifications
  const addDemoNotification = () => {
    const types: Notification["type"][] = [
      "success",
      "error",
      "warning",
      "info",
    ];
    const randomType = types[Math.floor(Math.random() * types.length)];
    const messages = [
      "Demo notification message",
      "This is a test notification",
      "Another demo notification",
      "Testing the notification system",
    ];
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];

    addNotification({
      type: randomType,
      message: randomMessage,
      duration: 5000,
    });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/10"
        aria-label="Notifications"
      >
        <Icon icon={<FaBell size={18} />} size="lg" />

        {/* Notification Badge */}
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`absolute -top-1 -right-1 ${getNotificationColor(
              "info"
            )} text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium`}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </motion.div>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={addDemoNotification}
                  className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors"
                >
                  Demo
                </button>
                {unreadCount > 0 && (
                  <button
                    onClick={clearNotifications}
                    className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <FaBell size={24} className="mx-auto mb-2 text-gray-300" />
                  <p>No notifications</p>
                  <button
                    onClick={addDemoNotification}
                    className="mt-2 text-xs bg-gray-200 text-gray-600 px-3 py-1 rounded hover:bg-gray-300 transition-colors"
                  >
                    Add demo notification
                  </button>
                </div>
              ) : (
                notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className={`p-4 border-b border-gray-100 ${getNotificationBgColor(
                      notification.type
                    )}`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-1 p-1.5 rounded-full ${getNotificationColor(
                          notification.type
                        )} text-white`}
                      >
                        {notification.icon ||
                          getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-medium ${getNotificationTextColor(
                            notification.type
                          )}`}
                        >
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatTime(notification.timestamp)}
                        </p>
                      </div>
                      <button
                        onClick={() => removeNotification(notification.id)}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                        aria-label="Dismiss notification"
                      >
                        <FaTimes size={12} />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
