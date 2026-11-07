import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  headline?: string;
  code?: string;
  title: string;
  description: string;
  buttonText?: string;
  buttonHref?: string;
}

/**
 * Clean, centered error/status screen matching the reference CommerceO template UI
 * Used by 404, 403, 500, 401, Maintenance and /pages/misc/* routes.
 */
export function ErrorState({
  headline,
  code,
  title,
  description,
  buttonText = "Back to home page",
  buttonHref = "/",
}: ErrorStateProps) {
  const mainHeadline = headline || (code === "404" ? "Whoops!" : code === "403" ? "Restricted Area" : `Error ${code || ""}`);

  return (
    <div className="flex flex-1 items-center justify-center min-h-[68vh] px-4 py-12 text-center">
      <div className="mx-auto max-w-lg flex flex-col items-center">
        {/* Main Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-gray-950 dark:text-white">
          {mainHeadline}
        </h1>

        {/* Subtitle */}
        <h2 className="mt-4 sm:mt-5 text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          {title}
        </h2>

        {/* Description */}
        <p className="mt-3 text-sm sm:text-base text-gray-500 dark:text-gray-400 max-w-md leading-relaxed">
          {description}
        </p>

        {/* Primary Action Button */}
        <div className="mt-7 sm:mt-8">
          <Button
            asChild
            className="h-11 px-7 rounded-xl bg-[#0070BA] hover:bg-[#005ea6] text-white font-semibold text-sm shadow-sm transition-all duration-150 cursor-pointer active:scale-98"
          >
            <Link href={buttonHref}>{buttonText}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
