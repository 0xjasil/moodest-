"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { AvatarWithFallback } from "@/components/ui/avatar-with-fallback";
import { LogoutDialog } from "@/components/auth/logout-modal";
import Image from "next/image";

interface ProfileHeaderProps {
  activeTab?: "profile" | "teams";
}

export function ProfileHeader({ activeTab = "profile" }: ProfileHeaderProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [logoutOpen, setLogoutOpen] = useState(false);

  const currentTab = activeTab || (pathname.includes("/teams") ? "teams" : "profile");

  const displayName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email.split("@")[0]
    : "Store Administrator";

  const displayRole = user?.role
    ? user.role.replace(/_/g, " ")
    : "ADMINISTRATOR";

  const userAvatar = user?.avatar || user?.image || null;
  const userEmail = user?.email || "admin@moodest.com";

  return (
    <div className="space-y-6">
      {/* Main Profile Card with Cover Photo & Identity */}
      <div className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#141414] shadow-xs overflow-hidden">
        {/* Cover Banner */}
        <div className="relative h-44 sm:h-56 md:h-60 w-full bg-linear-to-r from-stone-900 via-neutral-800 to-stone-950 overflow-hidden">
          <Image
            src="/images/banner-user-profile.webp"
            alt="Moodest Boutique Admin Banner"
            fill
            priority
            className="object-cover opacity-75"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent" />
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-md">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Admin Session
            </span>
          </div>
        </div>

        {/* Identity & Details Section */}
        <div className="px-5 sm:px-8 pb-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 -mt-14 sm:-mt-16 md:-mt-20">
            {/* Left: Avatar + Details */}
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-5">
              {/* Overlapping Avatar */}
              <div className="relative size-28 sm:size-32 md:size-36 rounded-2xl overflow-hidden border-4 border-white dark:border-[#141414] shadow-xl bg-white dark:bg-zinc-800 shrink-0">
                <AvatarWithFallback
                  src={userAvatar}
                  name={displayName}
                  size={144}
                  className="size-full rounded-2xl text-2xl font-bold"
                />
              </div>

              {/* Name & Meta Row */}
              <div className="pt-2 sm:pt-0 sm:pb-2">
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                    {displayName}
                  </h1>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/40">
                    {displayRole}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2 font-medium">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="size-4 text-emerald-500" />
                    Verified Authenticated Admin
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Building2 className="size-4 text-indigo-500" />
                    Moodest Luxury Boutique
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Mail className="size-4 text-gray-400" />
                    {userEmail}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Quick Admin Controls */}
            <div className="pt-2 md:pt-0 md:pb-2 flex items-center gap-2.5 shrink-0">
              <Link href="/settings">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 px-3.5 rounded-xl text-xs font-semibold border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5"
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
                className="h-9 px-3.5 rounded-xl text-xs font-semibold shadow-xs"
              >
                <LogOut className="size-3.5 mr-1.5" />
                Sign Out
              </Button>
            </div>
          </div>

          {/* Navigation Tabs (Profile & Teams) */}
          <nav className="mt-8 flex items-center gap-2 border-t border-gray-100 dark:border-white/5 pt-4 overflow-x-auto">
            <Link
              href="/profile"
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-150 whitespace-nowrap cursor-pointer",
                currentTab === "profile"
                  ? "bg-[#0070BA] text-white shadow-xs"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
              )}
            >
              <User className="size-4" />
              <span>Overview & Admin Details</span>
            </Link>

            <Link
              href="/profile/teams"
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-150 whitespace-nowrap cursor-pointer",
                currentTab === "teams"
                  ? "bg-[#0070BA] text-white shadow-xs"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
              )}
            >
              <Users className="size-4" />
              <span>Store Operations Teams</span>
            </Link>
          </nav>
        </div>
      </div>

      {/* Logout Modal */}
      <LogoutDialog open={logoutOpen} setOpen={setLogoutOpen} />
    </div>
  );
}
