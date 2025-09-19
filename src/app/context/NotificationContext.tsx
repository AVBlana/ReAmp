"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";

export interface Notification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  message: string;
  icon?: React.ReactNode;
  duration?: number;
  timestamp: Date;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (
    notification: Omit<Notification, "id" | "timestamp">
  ) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id)
    );
  }, []);

  const addNotification = useCallback(
    (notification: Omit<Notification, "id" | "timestamp">) => {
      // Check for duplicate notifications (same type and message)
      setNotifications((prev) => {
        const isDuplicate = prev.some(
          (existing) =>
            existing.type === notification.type &&
            existing.message === notification.message
        );

        if (isDuplicate) {
          return prev; // Don't add duplicate
        }

        const id = Math.random().toString(36).substr(2, 9);
        const newNotification: Notification = {
          ...notification,
          id,
          timestamp: new Date(),
        };

        const updatedNotifications = [...prev, newNotification];

        // Auto-remove notification after duration (default: 5 seconds)
        if (notification.duration !== 0) {
          setTimeout(() => {
            removeNotification(id);
          }, notification.duration || 5000);
        }

        return updatedNotifications;
      });
    },
    [removeNotification]
  );

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const value = useMemo(
    () => ({
      notifications,
      addNotification,
      removeNotification,
      clearNotifications,
    }),
    [notifications, addNotification, removeNotification, clearNotifications]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
