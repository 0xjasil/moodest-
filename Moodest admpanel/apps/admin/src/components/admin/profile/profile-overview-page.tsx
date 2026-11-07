"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  User,
  CheckCircle2,
  Crown,
  MapPin,
  Languages,
  Phone,
  MessageSquare,
  Mail,
  CheckSquare,
  Briefcase,
  Users,
  FileText,
  MoreVertical,
  UserPlus,
  UserCheck,
  Search,
  ExternalLink,
} from "lucide-react";
import { ProfileHeader } from "./profile-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ConnectionItem {
  id: string;
  name: string;
  connections: string;
  avatar: string;
  isConnected: boolean;
}

const initialConnections: ConnectionItem[] = [
  {
    id: "c1",
    name: "Cecilia Payne",
    connections: "45 Connections",
    avatar: "/images/avatars/6.webp",
    isConnected: false,
  },
  {
    id: "c2",
    name: "Curtis Fletcher",
    connections: "1.32k Connections",
    avatar: "/images/avatars/2.webp",
    isConnected: true,
  },
  {
    id: "c3",
    name: "Alice Stone",
    connections: "125 Connections",
    avatar: "/images/avatars/3.webp",
    isConnected: true,
  },
  {
    id: "c4",
    name: "Darrell Barnes",
    connections: "456 Connections",
    avatar: "/images/avatars/4.webp",
    isConnected: false,
  },
  {
    id: "c5",
    name: "Eugenia Moore",
    connections: "1.2k Connections",
    avatar: "/images/avatars/5.webp",
    isConnected: true,
  },
];

const profileTeams = [
  {
    name: "React Developers",
    members: "72 Members",
    badge: "Developer",
    badgeClass: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200 dark:border-sky-800",
  },
  {
    name: "Support Team",
    members: "122 Members",
    badge: "Support",
    badgeClass: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  },
  {
    name: "UI Designers",
    members: "7 Members",
    badge: "Designer",
    badgeClass: "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  },
  {
    name: "Vue.js Developers",
    members: "289 Members",
    badge: "Developer",
    badgeClass: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  },
  {
    name: "Digital Marketing",
    members: "24 Members",
    badge: "Marketing",
    badgeClass: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800",
  },
];

const projectsData = [
  {
    id: "p1",
    name: "Admin Template",
    date: "06 Oct 2021",
    leader: "Genevra",
    leaderAvatar: "/images/avatars/1.webp",
    teamAvatars: ["/images/avatars/2.webp", "/images/avatars/3.webp", "/images/avatars/4.webp"],
    extraMembers: "+9",
    progress: 100,
    progressColor: "bg-emerald-500",
  },
  {
    id: "p2",
    name: "Website SEO",
    date: "10 May 2021",
    leader: "Eileen",
    leaderAvatar: "/images/avatars/5.webp",
    teamAvatars: ["/images/avatars/6.webp", "/images/avatars/7.webp"],
    extraMembers: "+3",
    progress: 45,
    progressColor: "bg-[#0070BA]",
  },
  {
    id: "p3",
    name: "Angular APIs",
    date: "17 June 2021",
    leader: "Richardo",
    leaderAvatar: "/images/avatars/8.webp",
    teamAvatars: ["/images/avatars/9.webp", "/images/avatars/10.webp", "/images/avatars/11.webp"],
    extraMembers: "+5",
    progress: 65,
    progressColor: "bg-indigo-500",
  },
  {
    id: "p4",
    name: "Crypto Admin",
    date: "29 Sept 2021",
    leader: "Allyson",
    leaderAvatar: "/images/avatars/12.webp",
    teamAvatars: ["/images/avatars/13.webp", "/images/avatars/14.webp"],
    extraMembers: "+2",
    progress: 36,
    progressColor: "bg-amber-500",
  },
  {
    id: "p5",
    name: "IOS App Design",
    date: "19 Apr 2021",
    leader: "Merline",
    leaderAvatar: "/images/avatars/15.webp",
    teamAvatars: ["/images/avatars/16.webp", "/images/avatars/1.webp", "/images/avatars/2.webp"],
    extraMembers: "+4",
    progress: 56,
    progressColor: "bg-teal-500",
  },
  {
    id: "p6",
    name: "Figma Dashboard",
    date: "12 Jan 2022",
    leader: "Harmonia",
    leaderAvatar: "/images/avatars/3.webp",
    teamAvatars: ["/images/avatars/4.webp", "/images/avatars/5.webp"],
    extraMembers: "+6",
    progress: 87,
    progressColor: "bg-emerald-500",
  },
  {
    id: "p7",
    name: "Logo Design",
    date: "08 Mar 2021",
    leader: "Leon",
    leaderAvatar: "/images/avatars/6.webp",
    teamAvatars: ["/images/avatars/7.webp", "/images/avatars/8.webp"],
    extraMembers: "+1",
    progress: 34,
    progressColor: "bg-rose-500",
  },
];

export function ProfileOverviewPage() {
  const [connections, setConnections] = useState<ConnectionItem[]>(initialConnections);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const toggleConnection = (id: string) => {
    setConnections((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, isConnected: !c.isConnected } : c
      )
    );
    toast.success("Connection status updated");
  };

  const filteredProjects = projectsData.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.leader.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Standard Profile Header */}
      <ProfileHeader activeTab="profile" />

      {/* 2. 2-Column Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (4 cols): User Meta, Contacts, Teams, Overview */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#141414] p-5 sm:p-6 shadow-xs space-y-6">
            {/* ABOUT */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-4">
                About
              </h3>
              <div className="space-y-3.5 text-xs sm:text-sm">
                <div className="flex items-center gap-2.5 text-gray-700 dark:text-gray-300">
                  <User className="size-4 text-gray-400 shrink-0" />
                  <span className="font-medium text-gray-500 dark:text-gray-400">Full Name:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">John Doe</span>
                </div>
                <div className="flex items-center gap-2.5 text-gray-700 dark:text-gray-300">
                  <CheckCircle2 className="size-4 text-gray-400 shrink-0" />
                  <span className="font-medium text-gray-500 dark:text-gray-400">Status:</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    Active
                  </span>
                </div>
                <div className="flex items-center gap-2.5 text-gray-700 dark:text-gray-300">
                  <Crown className="size-4 text-gray-400 shrink-0" />
                  <span className="font-medium text-gray-500 dark:text-gray-400">Role:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">Developer</span>
                </div>
                <div className="flex items-center gap-2.5 text-gray-700 dark:text-gray-300">
                  <MapPin className="size-4 text-gray-400 shrink-0" />
                  <span className="font-medium text-gray-500 dark:text-gray-400">Country:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">USA</span>
                </div>
                <div className="flex items-center gap-2.5 text-gray-700 dark:text-gray-300">
                  <Languages className="size-4 text-gray-400 shrink-0" />
                  <span className="font-medium text-gray-500 dark:text-gray-400">Languages:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">English</span>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100 dark:border-white/5" />

            {/* CONTACTS */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-4">
                Contacts
              </h3>
              <div className="space-y-3.5 text-xs sm:text-sm">
                <div className="flex items-center gap-2.5 text-gray-700 dark:text-gray-300">
                  <Phone className="size-4 text-gray-400 shrink-0" />
                  <span className="font-medium text-gray-500 dark:text-gray-400">Contact:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">(123) 456-7890</span>
                </div>
                <div className="flex items-center gap-2.5 text-gray-700 dark:text-gray-300">
                  <MessageSquare className="size-4 text-gray-400 shrink-0" />
                  <span className="font-medium text-gray-500 dark:text-gray-400">Skype:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">john.doe</span>
                </div>
                <div className="flex items-center gap-2.5 text-gray-700 dark:text-gray-300">
                  <Mail className="size-4 text-gray-400 shrink-0" />
                  <span className="font-medium text-gray-500 dark:text-gray-400">Email:</span>
                  <span className="font-semibold text-gray-900 dark:text-white break-all">john.doe@example.com</span>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100 dark:border-white/5" />

            {/* TEAMS */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-4">
                Teams
              </h3>
              <div className="space-y-2.5 text-xs sm:text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900 dark:text-white">Backend Developer</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">(126 Members)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900 dark:text-white">React Developer</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">(98 Members)</span>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100 dark:border-white/5" />

            {/* OVERVIEW */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-4">
                Overview
              </h3>
              <div className="space-y-3.5 text-xs sm:text-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <CheckSquare className="size-4 text-gray-400 shrink-0" />
                    <span className="font-medium text-gray-500 dark:text-gray-400">Task Compiled:</span>
                  </div>
                  <span className="font-bold text-gray-900 dark:text-white">13.5k</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <Briefcase className="size-4 text-gray-400 shrink-0" />
                    <span className="font-medium text-gray-500 dark:text-gray-400">Projects Compiled:</span>
                  </div>
                  <span className="font-bold text-gray-900 dark:text-white">146</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <Users className="size-4 text-gray-400 shrink-0" />
                    <span className="font-medium text-gray-500 dark:text-gray-400">Connections:</span>
                  </div>
                  <span className="font-bold text-gray-900 dark:text-white">897</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (8 cols): Activity Timeline, Connections/Teams, Projects */}
        <div className="lg:col-span-8 space-y-6">
          {/* 1. Activity Timeline */}
          <div className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#141414] p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                Activity Timeline
              </h2>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                title="Options"
              >
                <MoreVertical className="size-4" />
              </button>
            </div>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100 dark:before:bg-white/10">
              {/* Event 1 */}
              <div className="relative">
                <span className="absolute -left-6 top-1.5 size-2.5 rounded-full bg-[#0070BA] ring-4 ring-sky-100 dark:ring-sky-950/40" />
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                    12 Invoices have been paid
                  </h4>
                  <span className="text-xs text-gray-400 font-medium shrink-0">12 mins ago</span>
                </div>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Invoices have been paid to the company
                </p>
                <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200/60 dark:border-red-900/30 text-xs font-medium cursor-pointer hover:bg-red-100 transition-colors">
                  <FileText className="size-3.5" />
                  <span>invoices.pdf</span>
                </div>
              </div>

              {/* Event 2 */}
              <div className="relative">
                <span className="absolute -left-6 top-1.5 size-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100 dark:ring-emerald-950/40" />
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Client meeting
                  </h4>
                  <span className="text-xs text-gray-400 font-medium shrink-0">45 mins ago</span>
                </div>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Project meeting with john @10:15am
                </p>
                <div className="mt-2.5 flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200/60 dark:border-white/5">
                  <div className="size-9 rounded-full overflow-hidden shrink-0 relative bg-gray-200 dark:bg-zinc-800">
                    <Image
                      src="/images/avatars/1.webp"
                      alt="Lester McCarthy"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900 dark:text-white">
                      Lester McCarthy (Client)
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      CEO of ThemeSelection
                    </p>
                  </div>
                </div>
              </div>

              {/* Event 3 */}
              <div className="relative">
                <span className="absolute -left-6 top-1.5 size-2.5 rounded-full bg-indigo-500 ring-4 ring-indigo-100 dark:ring-indigo-950/40" />
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Create a new project for client
                  </h4>
                  <span className="text-xs text-gray-400 font-medium shrink-0">2 days ago</span>
                </div>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                  6 team members in a project
                </p>
                <div className="mt-2.5 flex items-center -space-x-2">
                  {["/images/avatars/2.webp", "/images/avatars/3.webp", "/images/avatars/4.webp"].map((src, i) => (
                    <div
                      key={i}
                      className="size-7 rounded-full overflow-hidden border-2 border-white dark:border-[#141414] relative bg-gray-200 dark:bg-zinc-800"
                    >
                      <Image src={src} alt="Team member" fill className="object-cover" />
                    </div>
                  ))}
                  <div className="size-7 rounded-full bg-gray-100 dark:bg-zinc-800 border-2 border-white dark:border-[#141414] flex items-center justify-center text-[10px] font-bold text-gray-600 dark:text-gray-300">
                    +3
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Subgrid: Connections & Teams */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Connections */}
            <div className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#141414] p-5 sm:p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    Connections
                  </h3>
                  <button type="button" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <MoreVertical className="size-4" />
                  </button>
                </div>

                <div className="space-y-3.5">
                  {connections.map((c) => (
                    <div key={c.id} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="size-9 rounded-full overflow-hidden relative shrink-0 bg-gray-100 dark:bg-zinc-800">
                          <Image src={c.avatar} alt={c.name} fill className="object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {c.name}
                          </p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                            {c.connections}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant={c.isConnected ? "default" : "outline"}
                        onClick={() => toggleConnection(c.id)}
                        className={cn(
                          "size-8 p-0 rounded-lg shrink-0",
                          c.isConnected
                            ? "bg-[#0070BA] hover:bg-[#005ea6] text-white"
                            : "border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400"
                        )}
                        title={c.isConnected ? "Connected" : "Connect"}
                      >
                        {c.isConnected ? <UserCheck className="size-4" /> : <UserPlus className="size-4" />}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 mt-2 border-t border-gray-100 dark:border-white/5 text-center">
                <button
                  type="button"
                  onClick={() => toast.info("Displaying full connection directory")}
                  className="text-xs font-semibold text-[#0070BA] hover:underline"
                >
                  View all connections
                </button>
              </div>
            </div>

            {/* Teams Preview */}
            <div className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#141414] p-5 sm:p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    Teams
                  </h3>
                  <button type="button" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <MoreVertical className="size-4" />
                  </button>
                </div>

                <div className="space-y-3.5">
                  {profileTeams.map((t, i) => (
                    <div key={i} className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                          {t.name}
                        </p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">
                          {t.members}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0",
                          t.badgeClass
                        )}
                      >
                        {t.badge}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 mt-2 border-t border-gray-100 dark:border-white/5 text-center">
                <Link
                  href="/profile/teams"
                  className="text-xs font-semibold text-[#0070BA] hover:underline inline-flex items-center gap-1"
                >
                  <span>View all teams</span>
                  <ExternalLink className="size-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* 3. Projects List Table */}
          <div className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#141414] p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                Projects List
              </h2>
              <div className="relative w-full sm:w-64">
                <Search className="size-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="text"
                  placeholder="Search project..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 pl-9 rounded-xl border-gray-200 dark:border-white/10 text-xs"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-white/5 text-gray-400 dark:text-gray-500 uppercase text-[11px] font-semibold tracking-wider">
                    <th className="pb-3 pr-4">Project</th>
                    <th className="pb-3 px-4">Leader</th>
                    <th className="pb-3 px-4">Team</th>
                    <th className="pb-3 px-4">Progress</th>
                    <th className="pb-3 pl-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {filteredProjects.map((p) => (
                    <tr key={p.id} className="group hover:bg-gray-50/60 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 pr-4">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {p.name}
                        </div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400">
                          {p.date}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="size-6 rounded-full overflow-hidden relative bg-gray-100 dark:bg-zinc-800 shrink-0">
                            <Image src={p.leaderAvatar} alt={p.leader} fill className="object-cover" />
                          </div>
                          <span>{p.leader}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center -space-x-1.5">
                          {p.teamAvatars.map((src, idx) => (
                            <div
                              key={idx}
                              className="size-6 rounded-full overflow-hidden border border-white dark:border-[#141414] relative bg-gray-200 shrink-0"
                            >
                              <Image src={src} alt="Team" fill className="object-cover" />
                            </div>
                          ))}
                          <div className="size-6 rounded-full bg-gray-100 dark:bg-zinc-800 border border-white dark:border-[#141414] flex items-center justify-center text-[9px] font-bold text-gray-600 dark:text-gray-300 shrink-0">
                            {p.extraMembers}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 min-w-[130px]">
                        <div className="flex items-center gap-2.5">
                          <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
                            <div
                              className={cn("h-full rounded-full", p.progressColor)}
                              style={{ width: `${p.progress}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 shrink-0 w-8">
                            {p.progress}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 pl-4 text-right">
                        <button
                          type="button"
                          onClick={() => toast.info(`Options for ${p.name}`)}
                          className="size-8 rounded-lg inline-flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                        >
                          <MoreVertical className="size-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="flex items-center justify-between pt-4 mt-2 border-t border-gray-100 dark:border-white/5 text-xs text-gray-500 dark:text-gray-400">
              <span>Showing 1 to {filteredProjects.length} of {projectsData.length} projects</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentPage(1)}
                  className={cn(
                    "size-7 rounded-lg font-semibold transition-colors",
                    currentPage === 1
                      ? "bg-[#0070BA] text-white"
                      : "hover:bg-gray-100 dark:hover:bg-white/5 text-gray-600 dark:text-gray-400"
                  )}
                >
                  1
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage(2)}
                  className={cn(
                    "size-7 rounded-lg font-semibold transition-colors",
                    currentPage === 2
                      ? "bg-[#0070BA] text-white"
                      : "hover:bg-gray-100 dark:hover:bg-white/5 text-gray-600 dark:text-gray-400"
                  )}
                >
                  2
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
