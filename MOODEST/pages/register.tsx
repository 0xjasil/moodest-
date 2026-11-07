import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function RegisterPage() {
  const router = useRouter();
  const { register, error, isLoading, clearError } = useAuth();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [localError, setLocalError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    // Validation
    if (!formData.firstName.trim()) {
      setLocalError("First name is required");
      return;
    }
    if (!formData.email) {
      setLocalError("Email is required");
      return;
    }
    if (formData.password.length < 8) {
      setLocalError("Password must be at least 8 characters");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setLocalError("Passwords do not match");
      return;
    }

    try {
      await register(
        formData.email,
        formData.password,
        formData.firstName,
        formData.lastName || undefined
      );
      router.push("/");
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Registration failed");
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
                Create Account
              </li>
            </ol>
          </nav>

          {/* Register Container */}
          <div className="max-w-md mx-auto">
            <h1 className="text-2xl font-semibold text-[#000000] mb-2">Create Account</h1>
            <p className="text-sm text-[#595E63] mb-6">
              Already have an account?{" "}
              <Link href="/login" className="text-[#E80071] font-medium hover:underline">
                Sign in
              </Link>
            </p>

            {/* Error Message */}
            {displayError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{displayError}</p>
              </div>
            )}

            {/* Register Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* First Name */}
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-[#000000] mb-1.5">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="firstName"
                  type="text"
                  name="firstName"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="John"
                  className="w-full px-3 py-2 border border-[#CDD3D8] rounded-lg bg-white text-[#000000] placeholder-[#595E63] focus:border-[#E80071] focus:outline-none focus:ring-1 focus:ring-[#E80071] transition-colors"
                />
              </div>

              {/* Last Name */}
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-[#000000] mb-1.5">
                  Last Name
                </label>
                <input
                  id="lastName"
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Doe"
                  className="w-full px-3 py-2 border border-[#CDD3D8] rounded-lg bg-white text-[#000000] placeholder-[#595E63] focus:border-[#E80071] focus:outline-none focus:ring-1 focus:ring-[#E80071] transition-colors"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#000000] mb-1.5">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="w-full px-3 py-2 border border-[#CDD3D8] rounded-lg bg-white text-[#000000] placeholder-[#595E63] focus:border-[#E80071] focus:outline-none focus:ring-1 focus:ring-[#E80071] transition-colors"
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[#000000] mb-1.5">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  id="password"
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-[#CDD3D8] rounded-lg bg-white text-[#000000] placeholder-[#595E63] focus:border-[#E80071] focus:outline-none focus:ring-1 focus:ring-[#E80071] transition-colors"
                />
                <p className="text-xs text-[#595E63] mt-1">Minimum 8 characters</p>
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#000000] mb-1.5">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-[#CDD3D8] rounded-lg bg-white text-[#000000] placeholder-[#595E63] focus:border-[#E80071] focus:outline-none focus:ring-1 focus:ring-[#E80071] transition-colors"
                />
              </div>

              {/* Terms Agreement */}
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  required
                  className="w-4 h-4 border border-[#CDD3D8] rounded mt-1 cursor-pointer accent-[#E80071]"
                />
                <span className="text-xs text-[#595E63]">
                  I agree to the{" "}
                  <Link href="#" className="text-[#E80071] hover:underline">
                    Terms of Service
                  </Link>
                  {" "}and{" "}
                  <Link href="#" className="text-[#E80071] hover:underline">
                    Privacy Policy
                  </Link>
                </span>
              </label>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-[#E80071] text-white font-medium rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity mt-6"
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </button>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center gap-3">
              <div className="flex-1 h-px bg-[#CDD3D8]" />
              <span className="text-sm text-[#595E63]">or sign up with</span>
              <div className="flex-1 h-px bg-[#CDD3D8]" />
            </div>

            {/* Social Signup (Placeholder) */}
            <div className="grid grid-cols-2 gap-3">
              <button className="py-2.5 border border-[#CDD3D8] rounded-lg font-medium text-sm text-[#000000] hover:bg-[#F4F4F4] transition-colors">
                Google
              </button>
              <button className="py-2.5 border border-[#CDD3D8] rounded-lg font-medium text-sm text-[#000000] hover:bg-[#F4F4F4] transition-colors">
                Facebook
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
