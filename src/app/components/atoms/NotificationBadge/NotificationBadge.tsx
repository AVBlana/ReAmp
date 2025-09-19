import React from "react";
import { Notification } from "@/app/context/NotificationContext";
import {
  FaTimes,
  FaExclamationTriangle,
  FaInfoCircle,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";

interface NotificationBadgeProps {
  notification: Notification;
  onDismiss: (id: string) => void;
  onAction?: () => void;
  actionLabel?: string;
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  notification,
  onDismiss,
  onAction,
  actionLabel = "Action",
}) => {
  const getIcon = () => {
    switch (notification.type) {
      case "success":
        return <FaCheckCircle className="text-green-500" />;
      case "error":
        return <FaTimesCircle className="text-red-500" />;
      case "warning":
        return <FaExclamationTriangle className="text-yellow-500" />;
      case "info":
        return <FaInfoCircle className="text-blue-500" />;
      default:
        return <FaInfoCircle className="text-gray-500" />;
    }
  };

  const getBackgroundColor = () => {
    switch (notification.type) {
      case "success":
        return "bg-green-900/20 border-green-500/30";
      case "error":
        return "bg-red-900/20 border-red-500/30";
      case "warning":
        return "bg-yellow-900/20 border-yellow-500/30";
      case "info":
        return "bg-blue-900/20 border-blue-500/30";
      default:
        return "bg-gray-900/20 border-gray-500/30";
    }
  };

  return (
    <div className={`p-4 rounded-lg border ${getBackgroundColor()} mb-3`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white font-medium">
              {notification.message}
            </p>
            {notification.icon && (
              <div className="mt-2">{notification.icon}</div>
            )}
            {onAction && (
              <button
                onClick={onAction}
                className="mt-2 text-sm text-blue-400 hover:text-blue-300 underline"
              >
                {actionLabel}
              </button>
            )}
          </div>
        </div>
        <button
          onClick={() => onDismiss(notification.id)}
          className="flex-shrink-0 ml-2 text-gray-400 hover:text-white transition-colors"
        >
          <FaTimes size={14} />
        </button>
      </div>
    </div>
  );
};

export default NotificationBadge;
