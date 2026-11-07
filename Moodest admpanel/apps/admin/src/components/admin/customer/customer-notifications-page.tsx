"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CustomerLayoutFrame } from "./customer-layout-frame";

interface NotificationRow {
  id: string;
  type: string;
  description: string;
  email: boolean;
  browser: boolean;
  app: boolean;
}

const defaultNotifications: NotificationRow[] = [
  {
    id: "notif-1",
    type: "New for you",
    description: "A new product is published, or a collection is added.",
    email: true,
    browser: true,
    app: true,
  },
  {
    id: "notif-2",
    type: "Account activity",
    description: "Important security alerts and account status changes.",
    email: true,
    browser: true,
    app: true,
  },
  {
    id: "notif-3",
    type: "A new browser used to sign in",
    description: "Notification whenever a new browser logs into your account.",
    email: true,
    browser: true,
    app: false,
  },
  {
    id: "notif-4",
    type: "A new device is linked",
    description: "Notification when a new mobile or desktop device connects.",
    email: true,
    browser: false,
    app: true,
  },
];

export function CustomerNotificationsPage() {
  const [notifications, setNotifications] =
    useState<NotificationRow[]>(defaultNotifications);
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = (
    id: string,
    channel: "email" | "browser" | "app"
  ) => {
    setNotifications((prev) =>
      prev.map((row) =>
        row.id === id ? { ...row, [channel]: !row[channel] } : row
      )
    );
  };

  const handleSaveChanges = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success("Notification preferences saved successfully");
    }, 400);
  };

  const handleDiscard = () => {
    setNotifications(defaultNotifications);
    toast.info("Notification changes discarded");
  };

  return (
    <CustomerLayoutFrame
      currentTab="notifications"
      pageTitle="Notifications"
    >
      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#141414] shadow-xs overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-200/80 dark:border-white/10">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Notifications
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
              You will receive notification for the below selected items.
            </p>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/80 dark:bg-white/[0.02] border-b border-gray-200/80 dark:border-white/10 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <tr>
                  <th scope="col" className="px-6 py-3.5 min-w-[220px]">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-center w-28">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-center w-28">
                    Browser
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-center w-28">
                    App
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/80 dark:divide-white/10">
                {notifications.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <span className="font-semibold text-gray-900 dark:text-white text-sm block">
                          {row.type}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {row.description}
                        </span>
                      </div>
                    </td>

                    {/* Email Checkbox */}
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          aria-label={`${row.type} email notification`}
                          checked={row.email}
                          onChange={() => handleToggle(row.id, "email")}
                          className="size-4.5 rounded-md border-gray-300 dark:border-white/20 accent-indigo-600 focus:ring-indigo-500 cursor-pointer transition-colors"
                        />
                      </div>
                    </td>

                    {/* Browser Checkbox */}
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          aria-label={`${row.type} browser notification`}
                          checked={row.browser}
                          onChange={() => handleToggle(row.id, "browser")}
                          className="size-4.5 rounded-md border-gray-300 dark:border-white/20 accent-indigo-600 focus:ring-indigo-500 cursor-pointer transition-colors"
                        />
                      </div>
                    </td>

                    {/* App Checkbox */}
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          aria-label={`${row.type} app notification`}
                          checked={row.app}
                          onChange={() => handleToggle(row.id, "app")}
                          className="size-4.5 rounded-md border-gray-300 dark:border-white/20 accent-indigo-600 focus:ring-indigo-500 cursor-pointer transition-colors"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Action Buttons Footer */}
          <div className="p-6 border-t border-gray-200/80 dark:border-white/10 flex flex-wrap items-center gap-3">
            <Button
              onClick={handleSaveChanges}
              disabled={isSaving}
              className="h-10 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              variant="outline"
              onClick={handleDiscard}
              className="h-10 px-5 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-white/10 dark:hover:bg-white/15 dark:text-gray-200 border-transparent rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
            >
              Discard
            </Button>
          </div>
        </div>
      </div>
    </CustomerLayoutFrame>
  );
}
