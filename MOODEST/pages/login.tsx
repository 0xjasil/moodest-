import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Button from "@/components/Button";

export default function LoginPage() {
  const router = useRouter();
  const { login, error, isLoading, clearError } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    try {
      await login(email, password);
      router.push("/");
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Login failed");
    }
  };

  const displayError = localError || error;

  return (
    <>
      <Header />
      <main id="main-content" className="min-h-screen bg-white">
        <div className="mx-auto max-w-content px-4 md:px-6 py-12">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center gap-1.5 text-xs text-[#595E63]" role="list">
              <li role="listitem">
                <Link href="/" className="hover:text-[#E80071] hover:underline">
                  Home
                </Link>
              </li>
              <li role="listitem" aria-hidden="true">/</li>
              <li role="listitem" aria-current="page">
                Login
              </li>
            </ol>
          </nav>

          {/* Login Container */}
          <div className="max-w-md mx-auto">
            <h1 className="text-2xl font-semibold text-[#000000] mb-2">Sign In</h1>
            <p className="text-sm text-[#595E63] mb-6">
              Don't have an account?{" "}
              <Link href="/register" className="text-[#E80071] font-medium hover:underline">
                Create one
              </Link>
            </p>

            {/* Error Message */}
            {displayError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{displayError}</p>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#000000] mb-1.5">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3 py-2 border border-[#CDD3D8] rounded-lg bg-white text-[#000000] placeholder-[#595E63] focus:border-[#E80071] focus:outline-none focus:ring-1 focus:ring-[#E80071] transition-colors"
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[#000000] mb-1.5">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-[#CDD3D8] rounded-lg bg-white text-[#000000] placeholder-[#595E63] focus:border-[#E80071] focus:outline-none focus:ring-1 focus:ring-[#E80071] transition-colors"
                />
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="w-4 h-4 border border-[#CDD3D8] rounded cursor-pointer accent-[#E80071]"
                  />
                  <span className="text-sm text-[#595E63]">Remember me</span>
                </label>
                <Link href="#" className="text-sm text-[#E80071] hover:underline font-medium">
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-[#E80071] text-white font-medium rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity mt-6"
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center gap-3">
              <div className="flex-1 h-px bg-[#CDD3D8]" />
              <span className="text-sm text-[#595E63]">or continue with</span>
              <div className="flex-1 h-px bg-[#CDD3D8]" />
            </div>

            {/* Social Login (Placeholder) */}
            <div className="grid grid-cols-2 gap-3">
              <button className="py-2.5 border border-[#CDD3D8] rounded-lg font-medium text-sm text-[#000000] hover:bg-[#F4F4F4] transition-colors">
                Google
              </button>
              <button className="py-2.5 border border-[#CDD3D8] rounded-lg font-medium text-sm text-[#000000] hover:bg-[#F4F4F4] transition-colors">
                Facebook
              </button>
            </div>

            {/* Terms */}
            <p className="text-xs text-[#595E63] text-center mt-6">
              By signing in, you agree to our{" "}
              <Link href="#" className="text-[#E80071] hover:underline">
                Terms of Service
              </Link>
              {" "}and{" "}
              <Link href="#" className="text-[#E80071] hover:underline">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
