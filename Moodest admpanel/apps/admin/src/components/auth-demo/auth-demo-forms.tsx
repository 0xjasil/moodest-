"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export type AuthDemoMode =
  | "login"
  | "register"
  | "verify-email"
  | "reset-password"
  | "forgot-password"
  | "two-steps";

function Field({
  id,
  label,
  type = "text",
  placeholder,
}: {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} placeholder={placeholder} required />
    </div>
  );
}

export function AuthDemoForm({ mode }: { mode: AuthDemoMode }) {
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);

  const handleDemo = (message: string) => (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success(message);
    }, 600);
  };

  const setOtpDigit = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    setOtp((prev) => prev.map((d, i) => (i === index ? digit : d)));
    if (digit && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const spinner = loading ? (
    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  ) : null;

  switch (mode) {
    case "login":
      return (
        <form onSubmit={handleDemo("Signed in (demo)")} className="space-y-4">
          <Field
            id="login-email"
            label="Email"
            type="email"
            placeholder="you@example.com"
          />
          <Field
            id="login-password"
            label="Password"
            type="password"
            placeholder="••••••••"
          />
          <div className="flex justify-end text-sm">
            <Link
              href="/auth/forgot-password"
              className="text-amber-600 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <Button className="w-full" disabled={loading}>
            {spinner}
            {loading ? "Signing in..." : "Sign In"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            No account?{" "}
            <Link
              href="/auth/register"
              className="text-amber-600 hover:underline"
            >
              Create one
            </Link>
          </p>
        </form>
      );

    case "register":
      return (
        <form onSubmit={handleDemo("Account created (demo)")} className="space-y-4">
          <Field id="reg-name" label="Full name" placeholder="Phil Ohme" />
          <Field
            id="reg-email"
            label="Email"
            type="email"
            placeholder="you@example.com"
          />
          <Field
            id="reg-password"
            label="Password"
            type="password"
            placeholder="••••••••"
          />
          <Button className="w-full" disabled={loading}>
            {spinner}
            {loading ? "Creating..." : "Create Account"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Already registered?{" "}
            <Link
              href="/auth/login"
              className="text-amber-600 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </form>
      );

    case "forgot-password":
      return (
        <form
          onSubmit={handleDemo("Reset link sent (demo)")}
          className="space-y-4"
        >
          <Field
            id="forgot-email"
            label="Email"
            type="email"
            placeholder="you@example.com"
          />
          <Button className="w-full" disabled={loading}>
            {spinner}
            {loading ? "Sending..." : "Send Reset Link"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Remembered it?{" "}
            <Link
              href="/auth/login"
              className="text-amber-600 hover:underline"
            >
              Back to login
            </Link>
          </p>
        </form>
      );

    case "reset-password":
      return (
        <form
          onSubmit={handleDemo("Password updated (demo)")}
          className="space-y-4"
        >
          <Field
            id="reset-password"
            label="New password"
            type="password"
            placeholder="••••••••"
          />
          <Field
            id="reset-confirm"
            label="Confirm password"
            type="password"
            placeholder="••••••••"
          />
          <Button className="w-full" disabled={loading}>
            {spinner}
            {loading ? "Updating..." : "Reset Password"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            <Link
              href="/auth/login"
              className="text-amber-600 hover:underline"
            >
              Back to login
            </Link>
          </p>
        </form>
      );

    case "verify-email":
      return (
        <div className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            We sent a 6-digit verification code to{" "}
            <span className="font-medium text-foreground">
              you@example.com
            </span>
            . The code expires in 10 minutes.
          </p>
          <Button
            className="w-full"
            disabled={loading}
            onClick={() => {
              setLoading(true);
              setTimeout(() => {
                setLoading(false);
                toast.success("Verification email resent (demo)");
              }, 600);
            }}
          >
            {spinner}
            {loading ? "Sending..." : "Resend Code"}
          </Button>
          <p className="text-sm text-muted-foreground">
            Got it?{" "}
            <Link
              href="/auth/two-steps"
              className="text-amber-600 hover:underline"
            >
              Enter the code
            </Link>
          </p>
        </div>
      );

    case "two-steps":
      return (
        <form
          onSubmit={handleDemo("Verification passed (demo)")}
          className="space-y-4"
        >
          <div className="flex justify-between gap-2">
            {otp.map((digit, index) => (
              <Input
                key={index}
                id={`otp-${index}`}
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => setOtpDigit(index, e.target.value)}
                className="h-12 w-12 p-0 text-center text-lg font-semibold"
                aria-label={`Digit ${index + 1}`}
              />
            ))}
          </div>
          <Button className="w-full" disabled={loading}>
            {spinner}
            {loading ? "Verifying..." : "Verify Code"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Didn&apos;t receive it?{" "}
            <button
              type="button"
              onClick={() => toast.success("Code resent (demo)")}
              className="text-amber-600 hover:underline"
            >
              Resend
            </button>
          </p>
        </form>
      );

    default:
      return null;
  }
}
