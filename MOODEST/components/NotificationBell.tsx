import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { useNotification } from "@/context/NotificationContext";

export default function NotificationBell() {
  const { notifications, unreadCount, fetchNotifications, markAsRead } =
    useNotification();
  const [isOpen, setIsOpen] = useState(false);
  const [recentNotifications, setRecentNotifications] = useState(
    notifications.slice(0, 3)
  );

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    setRecentNotifications(notifications.slice(0, 3));
  }, [notifications]);

  const typeIcons: Record<string, string> = {
    info: "ℹ️",
    success: "✅",
    warning: "⚠️",
    error: "❌",
  };

  const handleNotificationClick = (id: string) => {
    markAsRead(id);
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-700 hover:text-pink-600 transition cursor-pointer"
        title="Notifications"
      >
        <Icon icon="lucide:bell" className="w-6 h-6" />

        {/* Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-pink-600 rounded-full">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-50 border border-gray-200">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-900">Notifications</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          {/* Notifications List */}
          {recentNotifications.length === 0 ? (
            <div className="px-4 py-6 text-center text-gray-600">
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {recentNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition ${
                    !notif.read ? "bg-blue-50" : ""
                  }`}
                  onClick={() => {
                    handleNotificationClick(notif.id);
                    if (notif.action) {
                      window.location.href = notif.action.url;
                    }
                  }}
                >
                  <div className="flex items-start space-x-2">
                    <span className="text-lg mt-0.5">
                      {typeIcons[notif.type]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900 text-sm truncate">
                          {notif.title}
                        </p>
                        {!notif.read && (
                          <span className="w-2 h-2 bg-pink-600 rounded-full flex-shrink-0 ml-2"></span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                        {notif.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTime(new Date(notif.createdAt))}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-100 flex space-x-2">
            <Link href="/notifications" className="flex-1">
              <button className="w-full text-center text-sm text-pink-600 hover:text-pink-700 font-medium py-2 hover:bg-pink-50 rounded transition">
                View all
              </button>
            </Link>
            <Link href="/notification-settings" className="flex-1">
              <button className="w-full text-center text-sm text-gray-600 hover:text-gray-700 font-medium py-2 hover:bg-gray-100 rounded transition">
                Settings
              </button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function formatTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}
