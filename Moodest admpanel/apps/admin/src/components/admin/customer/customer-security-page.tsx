"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  KeyRound,
  Mail,
  Smartphone,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Lock,
  LogOut,
  FileText,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CustomerLayoutFrame } from "./customer-layout-frame";

export function CustomerSecurityPage() {
  const [accountStatus, setAccountStatus] = useState<"Active" | "Suspended">("Active");
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [customerNotes, setCustomerNotes] = useState(
    "Preferred delivery address is Dubai Villa. Prefers morning deliveries between 10 AM - 1 PM. Sizes ordered: 54 & 56."
  );

  const handleSendResetEmail = () => {
    setIsSendingReset(true);
    setTimeout(() => {
      setIsSendingReset(false);
      toast.success("Password reset instructions emailed to fatima.alzahra@example.com");
    }, 600);
  };

  const handleInvalidateSessions = () => {
    toast.success("All active customer mobile and web storefront sessions have been signed out.");
  };

  const handleToggleStatus = () => {
    const nextStatus = accountStatus === "Active" ? "Suspended" : "Active";
    setAccountStatus(nextStatus);
    toast.success(`Customer account status updated to ${nextStatus}`);
  };

  const handleSaveNotes = () => {
    toast.success("Customer staff notes saved successfully");
  };

  return (
    <CustomerLayoutFrame currentTab="security" pageTitle="Account Security">
      <div className="space-y-6">
        {/* 1. Account Status & Authentication Credentials */}
        <div className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#141414] shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="size-5 text-indigo-600 dark:text-indigo-400" />
                <span>Account Status &amp; Access</span>
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                Manage storefront login status, security credentials, and access permissions.
              </p>
            </div>

            <Button
              onClick={handleToggleStatus}
              variant={accountStatus === "Active" ? "outline" : "default"}
              className={`h-9 px-4 rounded-xl text-xs font-semibold cursor-pointer ${
                accountStatus === "Active"
                  ? "border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900/40 dark:text-rose-400 dark:hover:bg-rose-950/40"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
              }`}
            >
              {accountStatus === "Active" ? "Suspend Account" : "Reactivate Account"}
            </Button>
          </div>

          {/* Account Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl border border-gray-200/70 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] space-y-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Account Status
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    accountStatus === "Active"
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                      : "bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20"
                  }`}
                >
                  <span
                    className={`size-1.5 rounded-full ${
                      accountStatus === "Active" ? "bg-emerald-500" : "bg-rose-500"
                    }`}
                  />
                  {accountStatus}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Can checkout &amp; place orders
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-gray-200/70 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] space-y-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Verified Email
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  fatima.alzahra@example.com
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="size-3.5" />
                  Verified
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-gray-200/70 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] space-y-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Verified Mobile Phone
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  +971 50 123 4567
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="size-3.5" />
                  OTP Verified
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-gray-200/70 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] space-y-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Customer Since
              </span>
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                <Calendar className="size-4 text-gray-400" />
                <span>January 15, 2026</span>
              </div>
            </div>
          </div>

          {/* Quick Actions (Reset & Session control) */}
          <div className="pt-4 border-t border-gray-200/70 dark:border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <KeyRound className="size-4 text-gray-400 shrink-0" />
              <span className="text-xs text-gray-600 dark:text-gray-400">
                Customer forgot their storefront password?
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={handleInvalidateSessions}
                className="h-9 px-3.5 rounded-xl text-xs font-semibold border-gray-200/80 dark:border-white/10 cursor-pointer"
              >
                <LogOut className="size-3.5 mr-1.5" />
                Sign Out Sessions
              </Button>

              <Button
                type="button"
                disabled={isSendingReset}
                onClick={handleSendResetEmail}
                className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs cursor-pointer"
              >
                <Mail className="size-3.5 mr-1.5" />
                {isSendingReset ? "Sending Link..." : "Send Password Reset Link"}
              </Button>
            </div>
          </div>
        </div>

        {/* 2. E-Commerce Fraud & Order Verification Card */}
        <div className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#141414] shadow-xs p-6 space-y-4">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Boutique Fraud &amp; Order Verification
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Automated risk assessment based on order delivery history and payment verification.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded-xl border border-emerald-200/80 dark:border-emerald-900/30 bg-emerald-50/40 dark:bg-emerald-950/20">
              <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                Risk Assessment
              </span>
              <p className="text-base font-bold text-emerald-700 dark:text-emerald-400 mt-1">
                Low Risk (Safe)
              </p>
              <p className="text-[11px] text-emerald-600/90 dark:text-emerald-400/80 mt-0.5">
                0 suspicious flags detected
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-gray-200/80 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02]">
              <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                Delivery Success Rate
              </span>
              <p className="text-base font-bold text-gray-900 dark:text-white mt-1">
                100% (6/6 Orders)
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                0 failed delivery attempts
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-gray-200/80 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02]">
              <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                Payment Chargebacks
              </span>
              <p className="text-base font-bold text-gray-900 dark:text-white mt-1">
                0 Disputes
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                Clean payment record
              </p>
            </div>
          </div>
        </div>

        {/* 3. Internal Staff Notes */}
        <div className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#141414] shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className="size-4 text-indigo-600 dark:text-indigo-400" />
                <span>Internal Staff Notes</span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Confidential notes visible only to Moodest boutique administrators.
              </p>
            </div>

            <Button
              onClick={handleSaveNotes}
              className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs cursor-pointer"
            >
              <Save className="size-3.5 mr-1.5" />
              Save Notes
            </Button>
          </div>

          <textarea
            rows={3}
            value={customerNotes}
            onChange={(e) => setCustomerNotes(e.target.value)}
            className="w-full rounded-xl border border-gray-200/80 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] p-3 text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            placeholder="Add special instructions, delivery preferences, or abaya sizing preferences..."
          />
        </div>
      </div>
    </CustomerLayoutFrame>
  );
}
