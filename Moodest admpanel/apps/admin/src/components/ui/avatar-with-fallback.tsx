"use client";

import React, { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface AvatarWithFallbackProps {
  src?: string | null;
  name: string;
  className?: string;
  size?: number;
}

const COLOR_PALETTES = [
  "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/40",
  "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800/40",
  "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40",
  "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800/40",
  "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800/40",
  "bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200 dark:border-teal-800/40",
];

function getInitials(name: string): string {
  if (!name) return "CU";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function getPalette(name: string): string {
  let hash = 0;
  for (let i = 0; i < (name || "").length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % COLOR_PALETTES.length;
  return COLOR_PALETTES[index];
}

export function AvatarWithFallback({
  src,
  name,
  className = "size-10 text-xs",
  size = 40,
}: AvatarWithFallbackProps) {
  const [imageError, setImageError] = useState(false);
  const initials = getInitials(name);
  const palette = getPalette(name);

  // If valid image provided and hasn't failed to load
  if (src && !imageError && typeof src === "string" && src.trim() !== "") {
    return (
      <div
        className={cn(
          "relative rounded-full overflow-hidden shrink-0 border border-gray-200 dark:border-white/10 shadow-2xs",
          className
        )}
      >
        <Image
          src={src}
          alt={name}
          width={size}
          height={size}
          onError={() => setImageError(true)}
          className="size-full object-cover"
        />
      </div>
    );
  }

  // Graceful initials badge for any customer (male/female) without photo
  return (
    <div
      className={cn(
        "rounded-full shrink-0 border flex items-center justify-center font-bold select-none shadow-2xs",
        palette,
        className
      )}
      title={name}
    >
      <span>{initials}</span>
    </div>
  );
}

