"use client";

import React, { useState } from "react";
import {
  Bell,
  Mail,
  Smartphone,
  PackageCheck,
  Truck,
  Sparkles,
  Tag,
  Save,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CustomerLayoutFrame } from "./customer-layout-frame";

interface NotificationRow {
  id: string;
  category: "order" | "marketing";
  title: string;
  description: string;
  email: boolean;
  sms: boolean;
}

const DEFAULT_NOTIFICATION_SETTINGS: NotificationRow[] = [
  {
    id: "notif-1",
    category: "order",
    title: "Order Confirmation & Receipt",
    description: "Instant order receipt and digital invoice upon checkout completion.",
    email: true,
    sms: true,
  },
  {
    id: "notif-2",
    category: "order",
    title: "Dispatch & Tracking Number",
    description: "Courier tracking link dispatched when the abaya package leaves the boutique.",
    email: true,
    sms: true,
  },
  {
    id: "notif-3",
    category: "order",
    title: "Out for Delivery Alert",
    description: "Driver dispatch notification sent on morning of expected arrival.",
    email: false,
    sms: true,
  },
  {
    id: "notif-4",
    category: "marketing",
    title: "New Abaya Collection Drops",
    description: "VIP early access to new seasonal modest collections (Ramadan & Eid drops).",
    email: true,
    sms: false,
  },
  {
    id: "notif-5",
    category: "marketing",
    title: "Back in Stock Sizing Alerts",
    description: "Automated alert when saved out-of-stock abaya size or color restocks.",
    email: true,
    sms: true,
  },
  {
    id: "notif-6",
    category: "marketing",
    title: "Promotional Discounts & Flash Sales",
    description: "Exclusive boutique promo codes and seasonal private sale invitations.",
    email: true,
    sms: false,
  },
];

export function CustomerNotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationRow[]>(
    DEFAULT_NOTIFICATION_SETTINGS
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = (id: string, channel: "email" | "sms") => {
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
      toast.success("Customer communication preferences updated successfully");
    }, 400);
  };

  const handleDiscard = () => {
    setNotifications(DEFAULT_NOTIFICATION_SETTINGS);
    toast.info("Communication preferences reset to defaults");
  };

  const orderNotifs = notifications.filter((n) => n.category === "order");
  const marketingNotifs = notifications.filter((n) => n.category === "marketing");

  return (
    <CustomerLayoutFrame currentTab="notifications" pageTitle="Communications">
      <div className="space-y-6">
        {/* Main Card */}
        <div className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#141414] shadow-xs overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-200/80 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Bell className="size-5 text-indigo-600 dark:text-indigo-400" />
                <span>Customer Notifications &amp; Messaging</span>
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                Configure channels (Email &amp; SMS) through which customer receives boutique updates.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                onClick={handleDiscard}
                className="h-9 px-3.5 rounded-xl text-xs font-semibold border-gray-200/80 dark:border-white/10 cursor-pointer"
              >
                <RotateCcw className="size-3.5 mr-1.5" />
                Reset Defaults
              </Button>
              <Button
                disabled={isSaving}
                onClick={handleSaveChanges}
                className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs cursor-pointer"
              >
                <Save className="size-3.5 mr-1.5" />
                {isSaving ? "Saving..." : "Save Preferences"}
              </Button>
            </div>
          </div>

          {/* Section 1: Order & Delivery Fulfillment */}
          <div className="p-6 border-b border-gray-200/80 dark:border-white/10 space-y-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider text-xs flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <Truck className="size-4" />
              <span>Order &amp; Shipping Fulfillment Alerts</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50/60 dark:bg-white/[0.02] border-y border-gray-200/80 dark:border-white/10 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <tr>
                    <th scope="col" className="px-4 py-3 min-w-[240px]">
                      Notification Trigger
                    </th>
                    <th scope="col" className="px-4 py-3 text-center w-28">
                      <div className="flex items-center justify-center gap-1.5">
                        <Mail className="size-3.5" />
                        <span>Email</span>
                      </div>
                    </th>
                    <th scope="col" className="px-4 py-3 text-center w-28">
                      <div className="flex items-center justify-center gap-1.5">
                        <Smartphone className="size-3.5" />
                        <span>SMS / WA</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/80 dark:divide-white/10">
                  {orderNotifs.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-4 py-3.5">
                        <span className="font-semibold text-gray-900 dark:text-white text-sm block">
                          {row.title}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {row.description}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <input
                          type="checkbox"
                          aria-label={`${row.title} email`}
                          checked={row.email}
                          onChange={() => handleToggle(row.id, "email")}
                          className="size-4.5 rounded-md border-gray-300 dark:border-white/20 accent-indigo-600 cursor-pointer"
                        />
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <input
                          type="checkbox"
                          aria-label={`${row.title} SMS`}
                          checked={row.sms}
                          onChange={() => handleToggle(row.id, "sms")}
                          className="size-4.5 rounded-md border-gray-300 dark:border-white/20 accent-indigo-600 cursor-pointer"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Marketing & Collection Drops */}
          <div className="p-6 space-y-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider text-xs flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <Sparkles className="size-4" />
              <span>Marketing, Sizing &amp; Collection Launches</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50/60 dark:bg-white/[0.02] border-y border-gray-200/80 dark:border-white/10 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <tr>
                    <th scope="col" className="px-4 py-3 min-w-[240px]">
                      Campaign Type
                    </th>
                    <th scope="col" className="px-4 py-3 text-center w-28">
                      <div className="flex items-center justify-center gap-1.5">
                        <Mail className="size-3.5" />
                        <span>Email</span>
                      </div>
                    </th>
                    <th scope="col" className="px-4 py-3 text-center w-28">
                      <div className="flex items-center justify-center gap-1.5">
                        <Smartphone className="size-3.5" />
                        <span>SMS / WA</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/80 dark:divide-white/10">
                  {marketingNotifs.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-4 py-3.5">
                        <span className="font-semibold text-gray-900 dark:text-white text-sm block">
                          {row.title}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {row.description}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <input
                          type="checkbox"
                          aria-label={`${row.title} email`}
                          checked={row.email}
                          onChange={() => handleToggle(row.id, "email")}
                          className="size-4.5 rounded-md border-gray-300 dark:border-white/20 accent-indigo-600 cursor-pointer"
                        />
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <input
                          type="checkbox"
                          aria-label={`${row.title} SMS`}
                          checked={row.sms}
                          onChange={() => handleToggle(row.id, "sms")}
                          className="size-4.5 rounded-md border-gray-300 dark:border-white/20 accent-indigo-600 cursor-pointer"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </CustomerLayoutFrame>
  );
}
