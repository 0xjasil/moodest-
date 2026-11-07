"use client";

import React, { useState } from "react";
import {
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  Monitor,
  Smartphone,
  Laptop,
  Tablet,
  Globe,
  Info,
  X,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { CustomerLayoutFrame } from "./customer-layout-frame";

interface DeviceSession {
  id: string;
  browser: string;
  os: string;
  device: string;
  location: string;
  recentActivity: string;
  icon: "windows" | "iphone" | "android" | "macos" | "tablet" | "firefox";
}

const initialDevices: DeviceSession[] = [
  {
    id: "dev-1",
    browser: "Chrome",
    os: "Windows",
    device: "HP Spectre 360",
    location: "Switzerland",
    recentActivity: "10, July 2021 20:07",
    icon: "windows",
  },
  {
    id: "dev-2",
    browser: "Chrome",
    os: "iPhone",
    device: "iPhone 12x",
    location: "Australia",
    recentActivity: "13, July 2021 10:10",
    icon: "iphone",
  },
  {
    id: "dev-3",
    browser: "Chrome",
    os: "Android",
    device: "Oneplus 9 Pro",
    location: "Dubai",
    recentActivity: "14, July 2021 15:15",
    icon: "android",
  },
  {
    id: "dev-4",
    browser: "Chrome",
    os: "MacOS",
    device: "Apple iMac",
    location: "India",
    recentActivity: "16, July 2021 16:17",
    icon: "macos",
  },
  {
    id: "dev-5",
    browser: "Firefox",
    os: "Windows",
    device: "Lenovo ThinkPad",
    location: "United States",
    recentActivity: "18, July 2021 19:42",
    icon: "firefox",
  },
  {
    id: "dev-6",
    browser: "Safari",
    os: "iPadOS",
    device: "iPad Pro 11",
    location: "Canada",
    recentActivity: "20, July 2021 11:25",
    icon: "tablet",
  },
];

export function CustomerSecurityPage() {
  // Password State
  const [showRequirementAlert, setShowRequirementAlert] = useState(true);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 2FA SMS State
  const [phoneNumber, setPhoneNumber] = useState("+1 (609) 972-22-22");
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [tempPhone, setTempPhone] = useState(phoneNumber);
  const [isLearnMoreOpen, setIsLearnMoreOpen] = useState(false);

  // Devices State
  const [devices, setDevices] = useState<DeviceSession[]>(initialDevices);

  // Handlers
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) {
      toast.error("Please enter a new password");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      toast.error("Password must contain at least one uppercase letter");
      return;
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      toast.error("Password must contain at least one special symbol");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    toast.success("Password changed successfully");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleUpdatePhone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempPhone.trim()) {
      toast.error("Phone number cannot be empty");
      return;
    }
    setPhoneNumber(tempPhone);
    setIsPhoneModalOpen(false);
    toast.success("Two-step verification phone number updated");
  };

  const handleRemovePhone = () => {
    setPhoneNumber("");
    toast.info("SMS two-step verification removed");
  };

  const renderDeviceIcon = (type: DeviceSession["icon"]) => {
    switch (type) {
      case "windows":
        return <Monitor className="size-4 text-sky-500" />;
      case "iphone":
        return <Smartphone className="size-4 text-rose-500" />;
      case "android":
        return <Smartphone className="size-4 text-emerald-500" />;
      case "macos":
        return <Laptop className="size-4 text-indigo-500" />;
      case "firefox":
        return <Globe className="size-4 text-amber-500" />;
      case "tablet":
        return <Tablet className="size-4 text-cyan-500" />;
      default:
        return <Monitor className="size-4 text-gray-500" />;
    }
  };

  return (
    <CustomerLayoutFrame currentTab="security" pageTitle="Security">
      <div className="space-y-6">
        {/* 1. Change Password Card */}
        <div className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#141414] shadow-xs p-6 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Change Password
            </h2>
          </div>

          {/* Warning / Requirements Banner */}
          {showRequirementAlert && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-500/5 p-4 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <Info className="size-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                    Ensure that these requirements are met
                  </p>
                  <p className="text-xs text-amber-700/90 dark:text-amber-400/80 mt-0.5">
                    Minimum 8 characters long, uppercase &amp; symbol
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRequirementAlert(false)}
                className="size-7 rounded-lg hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 inline-flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Dismiss alert"
              >
                <X className="size-4" />
              </button>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="new-password"
                  className="text-xs font-semibold text-gray-700 dark:text-gray-300"
                >
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="············"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-10 pr-10 rounded-xl border-gray-200/80 dark:border-white/10 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                  >
                    {showNewPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="confirm-password"
                  className="text-xs font-semibold text-gray-700 dark:text-gray-300"
                >
                  Confirm New Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="············"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-10 pr-10 rounded-xl border-gray-200/80 dark:border-white/10 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="h-10 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
            >
              Change Password
            </Button>
          </form>
        </div>

        {/* 2. Two-steps verification Card */}
        <div className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#141414] shadow-xs p-6 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Two-steps verification
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
              Keep your account secure with authentication step.
            </p>
          </div>

          <div className="pt-2 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              SMS
            </h3>

            <div className="flex items-center gap-3">
              <Input
                readOnly
                value={phoneNumber || "No phone number set"}
                className="h-10 max-w-xs rounded-xl border-gray-200/80 dark:border-white/10 bg-gray-50/70 dark:bg-white/5 text-sm text-gray-900 dark:text-white"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setTempPhone(phoneNumber);
                  setIsPhoneModalOpen(true);
                }}
                className="size-10 rounded-xl border-gray-200/80 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer"
                title="Edit Phone Number"
              >
                <Edit2 className="size-4 text-gray-600 dark:text-gray-300" />
              </Button>
              {phoneNumber && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleRemovePhone}
                  className="size-10 rounded-xl border-gray-200/80 dark:border-white/10 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 cursor-pointer"
                  title="Remove Phone Number"
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>

            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 pt-1">
              Two-factor authentication adds an additional layer of security to
              your account by requiring more than just a password to log in.{" "}
              <button
                type="button"
                onClick={() => setIsLearnMoreOpen(true)}
                className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline inline-block cursor-pointer"
              >
                Learn more.
              </button>
            </p>
          </div>
        </div>

        {/* 3. Recent Devices Card */}
        <div className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#141414] shadow-xs overflow-hidden">
          <div className="p-6 border-b border-gray-200/80 dark:border-white/10">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Recent Devices
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/80 dark:bg-white/[0.02] border-b border-gray-200/80 dark:border-white/10 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <tr>
                  <th scope="col" className="px-6 py-3.5">
                    Browser
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Device
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Location
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-right">
                    Recent Activity
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/80 dark:divide-white/10">
                {devices.map((device) => (
                  <tr
                    key={device.id}
                    className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2.5 font-medium text-gray-900 dark:text-white">
                        {renderDeviceIcon(device.icon)}
                        <span>
                          {device.browser} on {device.os}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">
                      {device.device}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">
                      {device.location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-gray-500 dark:text-gray-400 text-xs">
                      {device.recentActivity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Phone Number Dialog */}
      <Dialog open={isPhoneModalOpen} onOpenChange={setIsPhoneModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Update Verification Phone</DialogTitle>
            <DialogDescription>
              Enter the mobile number where SMS verification codes will be sent.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdatePhone} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label
                htmlFor="phone-input"
                className="text-xs font-semibold text-gray-700 dark:text-gray-300"
              >
                Phone Number
              </Label>
              <Input
                id="phone-input"
                value={tempPhone}
                onChange={(e) => setTempPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="rounded-xl border-gray-200/80 dark:border-white/10 text-sm"
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPhoneModalOpen(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
              >
                Save Number
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Learn More Dialog */}
      <Dialog open={isLearnMoreOpen} onOpenChange={setIsLearnMoreOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-indigo-600 dark:text-indigo-400" />
              Two-Factor Authentication (2FA)
            </DialogTitle>
            <DialogDescription>
              Enhanced protection for customer accounts.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 text-sm text-gray-600 dark:text-gray-300">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
              <p>
                <strong>Unauthorized sign-in prevention:</strong> Prevents
                access even if the customer&apos;s password is compromised.
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
              <p>
                <strong>Real-time OTP verification:</strong> A 6-digit one-time
                code is delivered via SMS immediately upon login.
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
              <p>
                <strong>Device trust controls:</strong> Customers can review and
                revoke trusted devices at any time.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setIsLearnMoreOpen(false)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl w-full"
            >
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CustomerLayoutFrame>
  );
}
