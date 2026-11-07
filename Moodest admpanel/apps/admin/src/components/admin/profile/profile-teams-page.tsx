"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Star, MoreVertical } from "lucide-react";
import { ProfileHeader } from "./profile-header";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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
    name: "React Developers",
    letter: "R",
    letterClass: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-300",
    description:
      "We don't make assumptions about the rest of your technology stack, so you can develop new features without worrying about compatibility.",
    avatars: [
      "/images/avatars/1.webp",
      "/images/avatars/2.webp",
      "/images/avatars/3.webp",
    ],
    extraMembers: "+9",
    tags: [
      {
        label: "React",
        className: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200 dark:border-sky-800",
      },
      {
        label: "MUI",
        className: "bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-gray-300 border-gray-200 dark:border-white/10",
      },
    ],
    isStarred: true,
  },
  {
    id: "tm2",
    name: "Vue.js Dev Team",
    letter: "V",
    letterClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
    description:
      "The development of Vue and its ecosystem is guided by an international team, some of whom have chosen to work remotely.",
    avatars: [
      "/images/avatars/4.webp",
      "/images/avatars/5.webp",
      "/images/avatars/6.webp",
    ],
    extraMembers: "+4",
    tags: [
      {
        label: "Vuejs",
        className: "bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border-teal-200 dark:border-teal-800",
      },
      {
        label: "Developer",
        className: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800",
      },
    ],
    isStarred: false,
  },
  {
    id: "tm3",
    name: "Creative Designers",
    letter: "C",
    letterClass: "bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300",
    description:
      "A design or product team is more than just the people on it. A team includes the people, the roles they play.",
    avatars: [
      "/images/avatars/7.webp",
      "/images/avatars/8.webp",
      "/images/avatars/9.webp",
    ],
    extraMembers: "+2",
    tags: [
      {
        label: "Sketch",
        className: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800",
      },
      {
        label: "XD",
        className: "bg-pink-50 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300 border-pink-200 dark:border-pink-800",
      },
    ],
    isStarred: false,
  },
  {
    id: "tm4",
    name: "Support Team",
    letter: "S",
    letterClass: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
    description:
      "Support your team. Your customer support team is fielding the good, the bad, and the ugly day in out.",
    avatars: [
      "/images/avatars/10.webp",
      "/images/avatars/11.webp",
      "/images/avatars/12.webp",
    ],
    extraMembers: "+7",
    tags: [
      {
        label: "Zendesk",
        className: "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800",
      },
    ],
    isStarred: true,
  },
  {
    id: "tm5",
    name: "Digital Marketing",
    letter: "D",
    letterClass: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
    description:
      "Digital marketing refers to advertising delivered through digital channels such as search engines, websites, social media, email, and mobile apps.",
    avatars: [
      "/images/avatars/13.webp",
      "/images/avatars/14.webp",
      "/images/avatars/15.webp",
    ],
    extraMembers: "+3",
    tags: [
      {
        label: "Twitter",
        className: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200 dark:border-sky-800",
      },
      {
        label: "Email",
        className: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
      },
    ],
    isStarred: false,
  },
  {
    id: "tm6",
    name: "Event",
    letter: "E",
    letterClass: "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300",
    description:
      "Event is defined as a particular contest which is part of a program of contests. An example of an event is a hackathon.",
    avatars: [
      "/images/avatars/16.webp",
      "/images/avatars/1.webp",
      "/images/avatars/2.webp",
    ],
    extraMembers: "+2",
    tags: [
      {
        label: "Hubilo",
        className: "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800",
      },
    ],
    isStarred: false,
  },
  {
    id: "tm7",
    name: "Figma Resources",
    letter: "F",
    letterClass: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300",
    description:
      "Explore, install, use, and remix thousands of plugins and files published to the Figma Community by designers.",
    avatars: [
      "/images/avatars/3.webp",
      "/images/avatars/4.webp",
      "/images/avatars/5.webp",
    ],
    extraMembers: "+5",
    tags: [
      {
        label: "UI/UX",
        className: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800",
      },
      {
        label: "Figma",
        className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
      },
    ],
    isStarred: true,
  },
  {
    id: "tm8",
    name: "Native Mobile App",
    letter: "N",
    letterClass: "bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300",
    description:
      "React Native lets you create truly native apps and doesn't compromise your users' experiences.",
    avatars: [
      "/images/avatars/6.webp",
      "/images/avatars/7.webp",
      "/images/avatars/8.webp",
    ],
    extraMembers: "+6",
    tags: [
      {
        label: "React",
        className: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200 dark:border-sky-800",
      },
      {
        label: "Mobile",
        className: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800",
      },
    ],
    isStarred: false,
  },
  {
    id: "tm9",
    name: "Only Beginners",
    letter: "O",
    letterClass: "bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300",
    description:
      "Learn the basics of how websites work, front-end vs back-end, and using a code editor.",
    avatars: [
      "/images/avatars/9.webp",
      "/images/avatars/10.webp",
      "/images/avatars/11.webp",
    ],
    extraMembers: "+8",
    tags: [
      {
        label: "CSS",
        className: "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800",
      },
      {
        label: "HTML",
        className: "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border-orange-200 dark:border-orange-800",
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
    toast.success("Team updated");
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Profile Header with Teams Tab Active */}
      <ProfileHeader activeTab="teams" />

      {/* 2. Grid of Team Cards matching Reference UI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => (
          <div
            key={team.id}
            className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#141414] p-5 sm:p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow group"
          >
            <div>
              {/* Card Header: Avatar Initial + Title + Star & Options */}
              <div className="flex items-center justify-between gap-3 pb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={cn(
                      "size-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0",
                      team.letterClass
                    )}
                  >
                    {team.letter}
                  </div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white truncate">
                    {team.name}
                  </h3>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleStar(team.id)}
                    className={cn(
                      "size-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer",
                      team.isStarred
                        ? "text-amber-500 hover:text-amber-600"
                        : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    )}
                    title={team.isStarred ? "Favorited" : "Favorite"}
                  >
                    <Star
                      className={cn(
                        "size-4",
                        team.isStarred && "fill-amber-400 text-amber-400"
                      )}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => toast.info(`Options for ${team.name}`)}
                    className="size-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer"
                    title="More options"
                  >
                    <MoreVertical className="size-4" />
                  </button>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed mt-2 min-h-[54px]">
                {team.description}
              </p>
            </div>

            {/* Bottom Row: Member Avatars on Left, Badges on Right */}
            <div className="flex items-center justify-between gap-2 pt-5 mt-4 border-t border-gray-100 dark:border-white/5">
              {/* Avatars Stack */}
              <div className="flex items-center -space-x-2 shrink-0">
                {team.avatars.map((src, i) => (
                  <div
                    key={i}
                    className="size-7 rounded-full overflow-hidden border-2 border-white dark:border-[#141414] relative bg-gray-200 dark:bg-zinc-800"
                  >
                    <Image src={src} alt="Team member" fill className="object-cover" />
                  </div>
                ))}
                <div className="size-7 rounded-full bg-gray-100 dark:bg-zinc-800 border-2 border-white dark:border-[#141414] flex items-center justify-center text-[10px] font-bold text-gray-600 dark:text-gray-300">
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
