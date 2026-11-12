import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import { authAPI } from "@/lib/api";
import BrandLogo from "@/components/BrandLogo";

function getSafeRedirect(raw: string | string[] | undefined): string {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value === "string" && value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }
  return "/";
}

export default function LoginPage() {
  const router = useRouter();
  const { login, error, isLoading, isAuthenticated, clearError } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSending, setResetSending] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const redirectTarget = useMemo(
    () => getSafeRedirect(router.query.redirect),
    [router.query.redirect]
  );

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(redirectTarget);
    }
  }, [isAuthenticated, isLoading, redirectTarget, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    try {
      await login(email, password);
      router.push(redirectTarget);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Login failed");
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setResetMessage(null);
    if (!resetEmail.trim()) {
      setLocalError("Please enter your email address");
      return;
    }
    setResetSending(true);
    try {
      const res = await authAPI.forgotPassword(resetEmail.trim());
      setResetMessage(
        res?.message || "If that email is registered, a password reset link has been sent."
      );
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Failed to send reset link");
    } finally {
      setResetSending(false);
    }
  };

  const displayError = localError || error;
  const registerHref =
    redirectTarget !== "/"
      ? `/register?redirect=${encodeURIComponent(redirectTarget)}`
      : "/register";

  return (
    <main id="main-content" className="min-h-screen bg-mb-bg flex flex-col justify-center py-8 sm:py-12">
      <div className="mx-auto w-full max-w-content px-4 md:px-6">
        <div className="max-w-md mx-auto mb-6 flex justify-center">
          <Link
            href="/"
            aria-label="Modest Studio — homepage"
            className="inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mb-accent rounded"
          >
            <BrandLogo variant="secondary" className="h-10 sm:h-11 w-auto object-contain" />
          </Link>
        </div>
        {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-6 max-w-md mx-auto">
            <ol className="flex items-center gap-1.5 text-xs text-mb-muted" role="list">
              <li role="listitem">
                <Link href="/" className="hover:text-mb-primary transition-colors">
                  Home
                </Link>
              </li>
              <li role="listitem" aria-hidden="true" className="text-mb-border">/</li>
              <li role="listitem" aria-current="page" className="text-mb-text font-semibold">
                Sign In
              </li>
            </ol>
          </nav>

          {/* Login Container in Brand Theme */}
          <div className="max-w-md mx-auto bg-mb-surface border border-mb-border rounded-[2px] shadow-2xs p-6 sm:p-8">
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-mb-text mb-1.5">
              {forgotMode ? "Reset Password" : "Sign In"}
            </h1>
            <p className="text-xs sm:text-sm text-mb-body mb-6">
              {forgotMode ? (
                <>
                  Remembered your password?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setForgotMode(false);
                      setLocalError(null);
                      setResetMessage(null);
                      clearError();
                    }}
                    className="text-mb-primary font-semibold hover:underline"
                  >
                    Back to sign in
                  </button>
                </>
              ) : (
                <>
                  Don't have an account?{" "}
                  <Link href={registerHref} className="text-mb-primary font-semibold hover:underline">
                    Create one
                  </Link>
                </>
              )}
            </p>

            {/* Error Message */}
            {displayError && (
              <div className="mb-4 p-3 bg-mb-error/10 border border-mb-error/30 rounded-[2px]">
                <p className="text-xs sm:text-sm text-mb-error font-medium">{displayError}</p>
              </div>
            )}

            {resetMessage && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-[2px]">
                <p className="text-xs sm:text-sm text-green-800 font-medium">{resetMessage}</p>
              </div>
            )}

            {forgotMode ? (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div>
                  <label htmlFor="reset-email" className="block text-xs sm:text-sm font-semibold text-mb-text mb-1.5">
                    Email Address
                  </label>
                  <input
                    id="reset-email"
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-3.5 py-2.5 border border-mb-border rounded-[2px] bg-mb-surface text-mb-text placeholder-mb-placeholder text-sm focus:border-mb-primary focus:ring-1 focus:ring-mb-primary outline-none transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  disabled={resetSending}
                  className="w-full py-3 bg-mb-primary hover:bg-mb-primary-hover text-white font-bold text-sm rounded-[2px] shadow-xs disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-2"
                >
                  {resetSending ? "Sending..." : "Send Reset Link"}
                </button>
              </form>
            ) : (
              /* Login Form */
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-xs sm:text-sm font-semibold text-mb-text mb-1.5">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-3.5 py-2.5 border border-mb-border rounded-[2px] bg-mb-surface text-mb-text placeholder-mb-placeholder text-sm focus:border-mb-primary focus:ring-1 focus:ring-mb-primary outline-none transition-colors"
                  />
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-xs sm:text-sm font-semibold text-mb-text mb-1.5">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 border border-mb-border rounded-[2px] bg-mb-surface text-mb-text placeholder-mb-placeholder text-sm focus:border-mb-primary focus:ring-1 focus:ring-mb-primary outline-none transition-colors"
                  />
                </div>

                {/* Forgot Password */}
                <div className="flex items-center justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotMode(true);
                      setResetEmail(email);
                      setLocalError(null);
                      clearError();
                    }}
                    className="text-xs sm:text-sm text-mb-primary hover:underline font-semibold"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-mb-primary hover:bg-mb-primary-hover text-white font-bold text-sm rounded-[2px] shadow-xs disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-4"
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </button>
              </form>
            )}

            {/* Terms */}
            <p className="text-xs text-mb-muted text-center mt-6 leading-relaxed">
              By signing in, you agree to Modest Studio&apos;s customer account terms.
            </p>
          </div>
        </div>
    </main>
  );
}
