import React, { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import { useNotification } from "@/context/NotificationContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function NotificationsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { notifications, unreadCount, fetchNotifications, markAsRead, deleteNotification, markAllAsRead } = useNotification();
  const [filterType, setFilterType] = useState<"all" | "unread" | "info" | "success" | "warning" | "error">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login?redirect=/notifications");
      return;
    }
    loadNotifications();
  }, [user, authLoading, router]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      await fetchNotifications();
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredNotifications = notifications.filter((notif) => {
    if (filterType === "all") return true;
    if (filterType === "unread") return !notif.read;
    return notif.type === filterType;
  });

  const typeIcons: Record<string, string> = {
    info: "ℹ️",
    success: "✅",
    warning: "⚠️",
    error: "❌",
  };

  const typeColors: Record<string, string> = {
    info: "border-blue-200 bg-blue-50",
    success: "border-green-200 bg-green-50",
    warning: "border-yellow-200 bg-yellow-50",
    error: "border-red-200 bg-red-50",
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>Notifications | Moryella</title>
        </Head>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
            <p className="mt-4 text-gray-600">Loading notifications...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Notifications | Moryella</title>
        <meta name="description" content="View your notifications and updates" />
      </Head>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                Notifications
              </h1>
              <p className="text-gray-600">
                {unreadCount > 0 ? `${unreadCount} unread` : "All read"}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-pink-600 hover:text-pink-700 font-medium text-sm"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="mb-6 flex flex-wrap gap-2">
            {(["all", "unread", "info", "success", "warning", "error"] as const).map(
              (filter) => (
                <button
                  key={filter}
                  onClick={() => setFilterType(filter)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    filterType === filter
                      ? "bg-pink-600 text-white"
                      : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {filter === "all"
                    ? "All"
                    : filter === "unread"
                    ? "Unread"
                    : filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              )
            )}
          </div>

          {/* Notifications List */}
          {filteredNotifications.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-600 mb-4">
                {filterType === "unread"
                  ? "No unread notifications"
                  : "No notifications"}
              </p>
              <Link href="/">
                <button className="text-pink-600 hover:text-pink-700 font-medium">
                  Go back home
                </button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onRead={() => markAsRead(notification.id)}
                  onDelete={() => deleteNotification(notification.id)}
                  icon={typeIcons[notification.type]}
                  colorClass={typeColors[notification.type]}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

interface NotificationCardProps {
  notification: any;
  onRead: () => void;
  onDelete: () => void;
  icon: string;
  colorClass: string;
}

function NotificationCard({
  notification,
  onRead,
  onDelete,
  icon,
  colorClass,
}: NotificationCardProps) {
  const handleClick = () => {
    if (!notification.read) {
      onRead();
    }
    if (notification.action) {
      // Navigate to action URL
      window.location.href = notification.action.url;
    }
  };

  return (
    <div
      className={`border-l-4 rounded-lg p-4 cursor-pointer transition hover:shadow-md ${colorClass} ${
        !notification.read ? "shadow-md" : ""
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 flex items-start space-x-3">
          <div className="text-2xl mt-1">{icon}</div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-gray-900">{notification.title}</h3>
              {!notification.read && (
                <span className="w-2 h-2 bg-pink-600 rounded-full"></span>
              )}
            </div>
            <p className="text-sm text-gray-700 mb-2">{notification.message}</p>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                {new Date(notification.createdAt).toLocaleDateString()} at{" "}
                {new Date(notification.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              {notification.action && (
                <span className="text-xs text-pink-600 font-medium hover:underline">
                  → {notification.action.text}
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="text-gray-400 hover:text-gray-600 ml-4"
          title="Delete notification"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
