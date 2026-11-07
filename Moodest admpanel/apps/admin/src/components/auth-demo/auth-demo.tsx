"use client";

import Link from "next/link";
import { AuthDemoForm, type AuthDemoMode } from "./auth-demo-forms";

type Variant = "basic" | "cover";

const authTitles: Record<AuthDemoMode, { title: string; subtitle: string }> = {
  login: {
    title: "Welcome back",
    subtitle: "Sign in to your admin account",
  },
  register: {
    title: "Create account",
    subtitle: "Start your admin journey today",
  },
  "verify-email": {
    title: "Verify your email",
    subtitle: "Confirm your address to activate the account",
  },
  "reset-password": {
    title: "Set new password",
    subtitle: "Choose a strong password for your account",
  },
  "forgot-password": {
    title: "Forgot password?",
    subtitle: "Enter your email and we'll send a reset link",
  },
  "two-steps": {
    title: "Two-step verification",
    subtitle: "Enter the 6-digit code from your authenticator app",
  },
};

interface AuthDemoProps {
  mode: AuthDemoMode;
  variant: Variant;
  /** The other variant's route segment for cross-linking (e.g. "/auth-cover") */
  altBasePath?: string;
}

export function AuthDemo({ mode, variant, altBasePath }: AuthDemoProps) {
  const { title, subtitle } = authTitles[mode];

  const header = (
    <div className="mb-6 text-center lg:text-left">
      <div className="mb-4 flex items-center justify-center gap-2 lg:justify-start">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-700 text-xs font-extrabold text-white">
          AP
        </span>
        <span className="text-sm font-bold">Admin Panel</span>
      </div>
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );

  const altLink = (
    <>
      {altBasePath && (
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Try the{" "}
          <Link
            href={`${altBasePath}/${mode}`}
            className="text-amber-600 hover:underline"
          >
            {altBasePath.includes("cover") ? "basic" : "cover"} version
          </Link>
        </p>
      )}
      <p className="mt-2 text-center text-xs text-muted-foreground">
        <Link href="/" className="hover:underline">
          ← Back to dashboard
        </Link>
      </p>
    </>
  );

  if (variant === "cover") {
    return (
      <div className="flex h-full w-full">
        {/* Branding panel */}
        <div className="hidden w-1/2 flex-col justify-between bg-gradient-to-br from-indigo-600 via-indigo-700 to-black p-10 text-white lg:flex">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-xs font-extrabold">
              AP
            </span>
            <span className="text-sm font-bold">Admin Panel</span>
          </div>
          <div>
            <h2 className="text-4xl font-bold leading-tight">
              Run your whole store from one beautiful dashboard.
            </h2>
            <p className="mt-4 max-w-md text-indigo-100">
              Products, orders, customers, inventory, marketing and reports —
              everything you need to grow your e-commerce business.
            </p>
          </div>
          <p className="text-sm text-indigo-200">
            ©2026 Admin Panel · Crafted for modern commerce teams
          </p>
        </div>

        {/* Form panel */}
        <div className="flex w-full items-center justify-center p-6 lg:w-1/2">
          <div className="w-full max-w-sm">
            {header}
            <AuthDemoForm mode={mode} />
            {altLink}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-black">
      {header}
      <AuthDemoForm mode={mode} />
      {altLink}
    </div>
  );
}