"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Star, MoreVertical, ShieldCheck, ExternalLink } from "@/components/ui/icon";
import { ProfileHeader } from "./profile-header";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";

interface TeamItem {
  id: string;
  name: string;
  letter: string;
  letterClass: string;
  description: string;
  avatars: string[];
  extraMembers: string;
  tags: { label: string; className: string }[];
  isStarred?: boolean;
}

const teamsData: TeamItem[] = [
  {
    id: "tm1",
    name: "Store Administration & Security",
    letter: "A",
    letterClass: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300",
    description:
      "Admin platform governance, role-based access control, security policies, and high-level boutique operations.",
    avatars: [
      "/images/avatars/1.webp",
      "/images/avatars/2.webp",
      "/images/avatars/3.webp",
    ],
    extraMembers: "+2",
    tags: [
      {
        label: "Super Admin",
        className: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
      },
      {
        label: "Security",
        className: "bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-gray-300 border-gray-200 dark:border-white/10",
      },
    ],
    isStarred: true,
  },
  {
    id: "tm2",
    name: "Catalog & Merchandising",
    letter: "C",
    letterClass: "bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300",
    description:
      "Manages luxury abaya collections, sizing (lengths 50–62, Free Size, Custom cuts), fabric details, and photography.",
    avatars: [
      "/images/avatars/4.webp",
      "/images/avatars/5.webp",
      "/images/avatars/6.webp",
    ],
    extraMembers: "+4",
    tags: [
      {
        label: "Abayas",
        className: "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800",
      },
      {
        label: "Variants",
        className: "bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border-teal-200 dark:border-teal-800",
      },
    ],
    isStarred: true,
  },
  {
    id: "tm3",
    name: "Fulfillment & Warehouse Logistics",
    letter: "F",
    letterClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
    description:
      "Oversees physical stock inventory, packing slips, atomic reservations, carrier handovers, and tracking IDs.",
    avatars: [
      "/images/avatars/7.webp",
      "/images/avatars/8.webp",
      "/images/avatars/9.webp",
    ],
    extraMembers: "+5",
    tags: [
      {
        label: "Shipping",
        className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
      },
      {
        label: "Inventory",
        className: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800",
      },
    ],
    isStarred: false,
  },
  {
    id: "tm4",
    name: "Customer Care & Styling Support",
    letter: "S",
    letterClass: "bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300",
    description:
      "Customer consultations on abaya lengths and fit, order inquiries, modifications, and return requests.",
    avatars: [
      "/images/avatars/10.webp",
      "/images/avatars/11.webp",
      "/images/avatars/12.webp",
    ],
    extraMembers: "+3",
    tags: [
      {
        label: "Client Care",
        className: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200 dark:border-sky-800",
      },
      {
        label: "Support",
        className: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800",
      },
    ],
    isStarred: false,
  },
  {
    id: "tm5",
    name: "Finance, Billing & Gateway Audit",
    letter: "B",
    letterClass: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
    description:
      "Handles Razorpay payment reconciliations, order invoices, refund processing, and financial reporting.",
    avatars: [
      "/images/avatars/13.webp",
      "/images/avatars/14.webp",
    ],
    extraMembers: "+2",
    tags: [
      {
        label: "Payments",
        className: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800",
      },
      {
        label: "Razorpay",
        className: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800",
      },
    ],
    isStarred: false,
  },
];

export function ProfileTeamsPage() {
  const [teams, setTeams] = useState<TeamItem[]>(teamsData);

  const toggleStar = (id: string) => {
    setTeams((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isStarred: !t.isStarred } : t))
    );
    toast.success("Team priority updated");
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Profile Header with Teams Tab active */}
      <ProfileHeader activeTab="teams" />

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => (
          <div
            key={team.id}
            className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#141414] p-5 sm:p-6 shadow-xs flex flex-col justify-between hover:border-indigo-300 dark:hover:border-indigo-900 transition-all"
          >
            <div>
              {/* Card Header: Letter Avatar + Title + Actions */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "size-10 rounded-xl flex items-center justify-center font-bold text-base shrink-0",
                      team.letterClass
                    )}
                  >
                    {team.letter}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                      {team.name}
                    </h3>
                    <p className="text-[11px] text-gray-400 font-medium">Modest Boutique Operations</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => toggleStar(team.id)}
                    className={cn(
                      "size-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer",
                      team.isStarred
                        ? "text-amber-500 hover:text-amber-600"
                        : "text-gray-300 dark:text-gray-600 hover:text-gray-400"
                    )}
                    title={team.isStarred ? "Priority team" : "Mark as priority"}
                  >
                    <Star
                      className={cn("size-4", team.isStarred && "fill-current")}
                    />
                  </button>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-3 mb-4 leading-relaxed">
                {team.description}
              </p>
            </div>

            {/* Bottom Row: Member Avatars + Tags */}
            <div className="pt-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between gap-3">
              {/* Member Avatars */}
              <div className="flex items-center -space-x-2">
                {team.avatars.map((avatar, idx) => (
                  <div
                    key={idx}
                    className="relative size-7 rounded-full overflow-hidden border-2 border-white dark:border-[#141414] bg-gray-100 dark:bg-zinc-800 shrink-0"
                  >
                    <Image
                      src={avatar}
                      alt="Team Member"
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
                <div className="size-7 rounded-full bg-gray-100 dark:bg-zinc-800 border-2 border-white dark:border-[#141414] flex items-center justify-center text-[10px] font-bold text-gray-600 dark:text-gray-300 shrink-0">
                  {team.extraMembers}
                </div>
              </div>

              {/* Tags */}
              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                {team.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className={cn(
                      "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                      tag.className
                    )}
                  >
                    {tag.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
