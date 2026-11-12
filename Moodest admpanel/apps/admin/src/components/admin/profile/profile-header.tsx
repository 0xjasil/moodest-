"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldCheck,
  Building2,
  Mail,
  Settings,
  LogOut,
  User,
  Users,
  Edit,
} from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { AvatarWithFallback } from "@/components/ui/avatar-with-fallback";
import { LogoutDialog } from "@/components/auth/logout-modal";

interface ProfileHeaderProps {
  activeTab?: "profile" | "teams";
}

export function ProfileHeader({ activeTab = "profile" }: ProfileHeaderProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [customAvatar, setCustomAvatar] = useState<string | null>(null);

  useEffect(() => {
    const syncAvatar = () => {
      try {
        const stored = localStorage.getItem("admin_avatar");
        if (stored) setCustomAvatar(stored);
      } catch {}
    };
    syncAvatar();
    window.addEventListener("admin_avatar_updated", syncAvatar);
    return () => window.removeEventListener("admin_avatar_updated", syncAvatar);
  }, []);

  const currentTab = activeTab || (pathname.includes("/teams") ? "teams" : "profile");

  const displayName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email.split("@")[0]
    : "Modest Store Admin";

  const displayRole = user?.role
    ? user.role.replace(/_/g, " ")
    : "ADMIN";

  const userAvatar = customAvatar || user?.avatar || user?.image || "/images/avatars/1.webp";
  const userEmail = user?.email || "admin@modest.com";

  return (
    <div className="space-y-6">
      {/* Main Profile Header Card (No cover banner image) */}
      <div className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#141414] shadow-xs p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left: Minimal Inline Avatar + Details */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="relative size-16 sm:size-20 rounded-full overflow-hidden border-2 border-gray-200/80 dark:border-white/15 shadow-xs bg-white dark:bg-zinc-800 shrink-0 group">
              <AvatarWithFallback
                src={userAvatar}
                name={displayName}
                size={80}
                className="size-full rounded-full text-base font-bold object-cover"
              />
              <Link
                href="/settings"
                className="absolute inset-0 bg-black/45 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[1px] cursor-pointer"
                title="Change Admin Avatar in Settings"
              >
                <Edit className="size-4" />
              </Link>
            </div>

            {/* Name & Meta Row */}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                  {displayName}
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/40">
                  {displayRole}
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Admin Session
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-500 dark:text-gray-400 mt-1.5 font-medium">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5 text-emerald-500" />
                  Verified Authenticated Admin
                </span>
                <span className="flex items-center gap-1.5">
                  <Building2 className="size-3.5 text-indigo-500" />
                  Modest Luxury Boutique
                </span>
                <span className="flex items-center gap-1.5">
                  <Mail className="size-3.5 text-gray-400" />
                  {userEmail}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Quick Admin Controls */}
          <div className="pt-1 md:pt-0 flex items-center gap-2 shrink-0">
            <Link href="/settings">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8.5 px-3 rounded-xl text-xs font-semibold border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer"
              >
                <Settings className="size-3.5 mr-1.5" />
                Store Settings
              </Button>
            </Link>

            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => setLogoutOpen(true)}
              className="h-8.5 px-3 rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
            >
              <LogOut className="size-3.5 mr-1.5" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Navigation Tabs (Profile & Teams) */}
        <nav className="mt-5 flex items-center gap-2 border-t border-gray-100 dark:border-white/5 pt-3.5 overflow-x-auto">
          <Link
            href="/profile"
            className={cn(
              "flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs sm:text-sm font-semibold transition-all duration-150 whitespace-nowrap cursor-pointer",
              currentTab === "profile"
                ? "bg-[#0070BA] text-white shadow-xs"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
            )}
          >
            <User className="size-3.5" />
            <span>Overview & Admin Details</span>
          </Link>

          <Link
            href="/profile/teams"
            className={cn(
              "flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs sm:text-sm font-semibold transition-all duration-150 whitespace-nowrap cursor-pointer",
              currentTab === "teams"
                ? "bg-[#0070BA] text-white shadow-xs"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
            )}
          >
            <Users className="size-3.5" />
            <span>Store Operations Teams</span>
          </Link>
        </nav>
      </div>

      {/* Logout Modal */}
      <LogoutDialog open={logoutOpen} setOpen={setLogoutOpen} />
    </div>
  );
}
