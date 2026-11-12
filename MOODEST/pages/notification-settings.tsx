import React, { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import { useNotification } from "@/context/NotificationContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

type DigestFrequency = "immediate" | "daily" | "weekly" | "never";

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  inAppNotifications: boolean;
  orderUpdates: boolean;
  promoEmails: boolean;
  reviewReminders: boolean;
  wishlistDrops: boolean;
  digestFrequency: DigestFrequency;
}

export default function NotificationSettings() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { preferences, fetchPreferences, updatePreferences, isLoading } =
    useNotification();
  const [settings, setSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    inAppNotifications: true,
    orderUpdates: true,
    promoEmails: true,
    reviewReminders: true,
    wishlistDrops: true,
    digestFrequency: "daily",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login?redirect=/notification-settings");
      return;
    }
    loadPreferences();
  }, [user, authLoading, router]);

  const loadPreferences = async () => {
    try {
      await fetchPreferences();
    } catch (error) {
      console.error("Failed to load preferences:", error);
    }
  };

  useEffect(() => {
    if (preferences) {
      setSettings({
        emailNotifications: preferences.emailNotifications,
        pushNotifications: preferences.pushNotifications,
        smsNotifications: preferences.smsNotifications,
        inAppNotifications: preferences.inAppNotifications,
        orderUpdates: preferences.orderUpdates,
        promoEmails: preferences.promoEmails,
        reviewReminders: preferences.reviewReminders,
        wishlistDrops: preferences.wishlistDrops,
        digestFrequency: preferences.digestFrequency as DigestFrequency,
      });
    }
  }, [preferences]);

  const handleToggle = (key: keyof NotificationSettings) => {
    if (typeof settings[key] === "boolean") {
      setSettings((prev) => ({
        ...prev,
        [key]: !prev[key],
      }));
    }
  };

  const handleDigestChange = (freq: DigestFrequency) => {
    setSettings((prev) => ({
      ...prev,
      digestFrequency: freq,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      await updatePreferences(settings);
      setMessage({
        type: "success",
        text: "Notification settings updated successfully!",
      });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({
        type: "error",
        text: "Failed to update settings. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <Head>
          <title>Notification Settings | Moryella</title>
        </Head>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
            <p className="mt-4 text-gray-600">Loading settings...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Notification Settings | Moryella</title>
        <meta name="description" content="Manage your notification preferences" />
      </Head>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Notification Settings
            </h1>
            <p className="text-gray-600">
              Choose how and when you want to receive notifications
            </p>
          </div>

          {/* Message */}
          {message && (
            <div
              className={`p-4 rounded-lg mb-6 ${
                message.type === "success"
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Channels */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Notification Channels
            </h2>
            <p className="text-gray-600 text-sm mb-4">
              Choose which channels you'd like to receive notifications on
            </p>

            <div className="space-y-4">
              <ToggleItem
                label="Email Notifications"
                description="Receive updates via email"
                enabled={settings.emailNotifications}
                onChange={() => handleToggle("emailNotifications")}
                icon="📧"
              />
              <ToggleItem
                label="Push Notifications"
                description="Browser push notifications (web)"
                enabled={settings.pushNotifications}
                onChange={() => handleToggle("pushNotifications")}
                icon="🔔"
              />
              <ToggleItem
                label="SMS Notifications"
                description="Text message alerts for urgent updates"
                enabled={settings.smsNotifications}
                onChange={() => handleToggle("smsNotifications")}
                icon="💬"
              />
              <ToggleItem
                label="In-App Notifications"
                description="Notifications within the Moryella app"
                enabled={settings.inAppNotifications}
                onChange={() => handleToggle("inAppNotifications")}
                icon="📱"
              />
            </div>
          </div>

          {/* Notification Types */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              What to Notify About
            </h2>
            <p className="text-gray-600 text-sm mb-4">
              Choose which types of notifications you want to receive
            </p>

            <div className="space-y-4">
              <ToggleItem
                label="Order Updates"
                description="Order confirmations, shipping, and delivery status"
                enabled={settings.orderUpdates}
                onChange={() => handleToggle("orderUpdates")}
                icon="📦"
              />
              <ToggleItem
                label="Promotional Emails"
                description="Sales, discounts, and special offers"
                enabled={settings.promoEmails}
                onChange={() => handleToggle("promoEmails")}
                icon="🏷️"
              />
              <ToggleItem
                label="Review Reminders"
                description="Reminders to review purchased items"
                enabled={settings.reviewReminders}
                onChange={() => handleToggle("reviewReminders")}
                icon="⭐"
              />
              <ToggleItem
                label="Wishlist Drops"
                description="Price drops on items in your wishlist"
                enabled={settings.wishlistDrops}
                onChange={() => handleToggle("wishlistDrops")}
                icon="💖"
              />
            </div>
          </div>

          {/* Digest Frequency */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Digest Frequency
            </h2>
            <p className="text-gray-600 text-sm mb-4">
              How often you'd like to receive digest emails combining multiple notifications
            </p>

            <div className="space-y-2">
              {(["immediate", "daily", "weekly", "never"] as const).map(
                (freq) => (
                  <label
                    key={freq}
                    className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="digestFrequency"
                      value={freq}
                      checked={settings.digestFrequency === freq}
                      onChange={() => handleDigestChange(freq)}
                      className="w-4 h-4 text-pink-600"
                    />
                    <span className="ml-3">
                      <span className="font-medium text-gray-900 block">
                        {freq === "immediate"
                          ? "Immediate"
                          : freq === "daily"
                          ? "Daily Digest"
                          : freq === "weekly"
                          ? "Weekly Digest"
                          : "Never (Opt-out)"}
                      </span>
                      <span className="text-sm text-gray-600">
                        {freq === "immediate"
                          ? "Get notified right away"
                          : freq === "daily"
                          ? "One email per day with all updates"
                          : freq === "weekly"
                          ? "One email per week with all updates"
                          : "Don't send me digest emails"}
                      </span>
                    </span>
                  </label>
                )
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition"
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>
            <button
              onClick={() => router.back()}
              className="flex-1 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 font-medium transition"
            >
              Cancel
            </button>
          </div>

          {/* Info Box */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              💡 <span className="font-medium">Tip:</span> We'll always send critical
              notifications like order confirmations and account security alerts,
              regardless of your preference settings.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

interface ToggleItemProps {
  label: string;
  description: string;
  enabled: boolean;
  onChange: () => void;
  icon: string;
}

function ToggleItem({
  label,
  description,
  enabled,
  onChange,
  icon,
}: ToggleItemProps) {
  return (
    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
      <div className="flex items-center space-x-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={onChange}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
      </label>
    </div>
  );
}
