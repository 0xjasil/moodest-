"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Palette,
  MapPin,
  Calendar,
  UserCheck,
  UserPlus,
  User,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProfileHeaderProps {
  activeTab?: "profile" | "teams";
}

export function ProfileHeader({ activeTab = "profile" }: ProfileHeaderProps) {
  const pathname = usePathname();
  const [isConnected, setIsConnected] = useState(true);

  const currentTab = activeTab || (pathname.includes("/teams") ? "teams" : "profile");

  return (
    <div className="space-y-6">
      {/* Main Profile Card with Cover Photo & Identity */}
      <div className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#141414] shadow-xs overflow-hidden">
        {/* Cover Photo */}
        <div className="relative h-44 sm:h-56 md:h-64 w-full bg-linear-to-r from-indigo-200 via-purple-200 to-pink-200 dark:from-zinc-800 dark:to-zinc-900 overflow-hidden">
          <Image
            src="/images/banner-user-profile.webp"
            alt="Profile cover banner"
            fill
            priority
            className="object-cover"
          />
        </div>

        {/* Identity & Details Section */}
        <div className="px-5 sm:px-8 pb-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 -mt-14 sm:-mt-16 md:-mt-20">
            {/* Left: Avatar + Details */}
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-5">
              {/* Overlapping Avatar */}
              <div className="relative size-28 sm:size-32 md:size-36 rounded-2xl overflow-hidden border-4 border-white dark:border-[#141414] shadow-lg bg-gray-100 dark:bg-zinc-800 shrink-0">
                <Image
                  src="/images/avatars/19.webp"
                  alt="Phil Ohme"
                  fill
                  sizes="144px"
                  priority
                  className="object-cover"
                />
              </div>

              {/* Name & Meta Row */}
              <div className="pt-2 sm:pt-0 sm:pb-2">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                  Phil Ohme
                </h1>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1.5 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Palette className="size-4 text-gray-400" />
                    UX Designer
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="size-4 text-gray-400" />
                    Vatican City
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="size-4 text-gray-400" />
                    Joined April 2021
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Connected Action Button */}
            <div className="pt-2 md:pt-0 md:pb-2 shrink-0">
              <Button
                type="button"
                onClick={() => setIsConnected(!isConnected)}
                className={cn(
                  "h-10 px-5 rounded-xl text-sm font-semibold transition-all cursor-pointer shadow-xs",
                  isConnected
                    ? "bg-[#0070BA] hover:bg-[#005ea6] text-white"
                    : "bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-800 dark:text-gray-200"
                )}
              >
                {isConnected ? (
                  <>
                    <UserCheck className="size-4 mr-2" />
                    Connected
                  </>
                ) : (
                  <>
                    <UserPlus className="size-4 mr-2" />
                    Connect
                  </>
                )}
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
              <span>Profile</span>
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
              <span>Teams</span>
            </Link>
          </nav>
        </div>
      </div>
    </div>
  );
}
