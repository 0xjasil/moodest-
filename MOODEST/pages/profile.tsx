import React, { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { Icon } from "@iconify/react";
import { useAuth } from "@/context/AuthContext";
import { authAPI } from "@/lib/api";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const PASSWORD_POLICY_REGEX = /((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/;

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, me, logout } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login?redirect=/profile");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setPhone(user.phone || "");
    }
  }, [user]);

  if (authLoading || !isAuthenticated || !user) {
    return (
      <>
        <Header />
        <main id="main-content" className="min-h-screen bg-mb-bg flex items-center justify-center py-16">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-9 w-9 border-2 border-mb-border border-t-mb-primary" />
            <p className="mt-3 text-xs text-mb-muted">Loading your profile...</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const fullName =
    `${firstName} ${lastName}`.trim() ||
    `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
    user.email.split("@")[0] ||
    "Customer";

  const initials = (user.firstName || user.email || "U")[0].toUpperCase();

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);
    setProfileSaving(true);
    try {
      await authAPI.updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
      });
      await me();
      setProfileMessage({
        type: "success",
        text: "Your profile details have been updated.",
      });
    } catch (err) {
      setProfileMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to update profile.",
      });
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (!currentPassword) {
      setPasswordMessage({ type: "error", text: "Current password is required." });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMessage({
        type: "error",
        text: "New password must be at least 8 characters long.",
      });
      return;
    }
    if (!PASSWORD_POLICY_REGEX.test(newPassword)) {
      setPasswordMessage({
        type: "error",
        text: "Password must include uppercase, lowercase, and a number or symbol.",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "New passwords do not match." });
      return;
    }

    setPasswordSaving(true);
    try {
      await authAPI.changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMessage({
        type: "success",
        text: "Password updated. Redirecting you to sign in with your new password...",
      });
      setTimeout(() => {
        logout();
        router.push("/login?redirect=/profile");
      }, 1500);
    } catch (err) {
      setPasswordMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to change password.",
      });
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <>
      <Head>
        <title>My Profile | Modest Studio</title>
      </Head>
      <Header />
      <main id="main-content" className="min-h-screen bg-mb-bg py-8 sm:py-12">
        <div className="mx-auto max-w-content px-4 md:px-6">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center gap-1.5 text-xs text-mb-muted" role="list">
              <li role="listitem">
                <Link href="/" className="hover:text-mb-primary transition-colors">
                  Home
                </Link>
              </li>
              <li role="listitem" aria-hidden="true" className="text-mb-border">/</li>
              <li role="listitem" aria-current="page" className="text-mb-text font-semibold">
                My Profile
              </li>
            </ol>
          </nav>

          {/* Minimal Header Card */}
          <section className="bg-mb-surface border border-mb-border rounded-[2px] shadow-2xs p-6 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-mb-primary text-mb-bg text-xl font-bold flex items-center justify-center flex-shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <h1 className="font-serif text-xl sm:text-2xl font-semibold text-mb-text truncate">
                  {fullName}
                </h1>
                <p className="text-xs sm:text-sm text-mb-muted truncate">{user.email}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                logout();
                router.push("/");
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-[2px] transition-colors self-start sm:self-auto"
            >
              <Icon icon="lucide:log-out" className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Account Details */}
              <section className="bg-mb-surface border border-mb-border rounded-[2px] shadow-2xs p-6">
                <h2 className="font-serif text-lg font-semibold text-mb-text mb-1">
                  Account Details
                </h2>
                <p className="text-xs text-mb-muted mb-5">
                  Manage your personal information used across orders and delivery.
                </p>

                {profileMessage && (
                  <div
                    className={`mb-4 p-3 rounded-[2px] border text-xs sm:text-sm font-medium ${
                      profileMessage.type === "success"
                        ? "bg-green-50 border-green-200 text-green-800"
                        : "bg-mb-error/10 border-mb-error/30 text-mb-error"
                    }`}
                  >
                    {profileMessage.text}
                  </div>
                )}

                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="profile-firstName" className="block text-xs font-semibold text-mb-text mb-1.5">
                        First Name
                      </label>
                      <input
                        id="profile-firstName"
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="First name"
                        className="w-full px-3.5 py-2.5 border border-mb-border rounded-[2px] bg-mb-bg text-mb-text text-sm focus:border-mb-primary focus:ring-1 focus:ring-mb-primary outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label htmlFor="profile-lastName" className="block text-xs font-semibold text-mb-text mb-1.5">
                        Last Name
                      </label>
                      <input
                        id="profile-lastName"
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Last name"
                        className="w-full px-3.5 py-2.5 border border-mb-border rounded-[2px] bg-mb-bg text-mb-text text-sm focus:border-mb-primary focus:ring-1 focus:ring-mb-primary outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="profile-email" className="block text-xs font-semibold text-mb-text mb-1.5">
                        Email Address
                      </label>
                      <input
                        id="profile-email"
                        type="email"
                        value={user.email}
                        disabled
                        className="w-full px-3.5 py-2.5 border border-mb-border rounded-[2px] bg-mb-surface text-mb-muted text-sm cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label htmlFor="profile-phone" className="block text-xs font-semibold text-mb-text mb-1.5">
                        Phone Number
                      </label>
                      <input
                        id="profile-phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full px-3.5 py-2.5 border border-mb-border rounded-[2px] bg-mb-bg text-mb-text text-sm focus:border-mb-primary focus:ring-1 focus:ring-mb-primary outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={profileSaving}
                      className="px-6 py-2.5 bg-mb-primary hover:bg-mb-primary-hover text-white font-semibold text-xs sm:text-sm rounded-[2px] shadow-xs disabled:opacity-50 transition-colors"
                    >
                      {profileSaving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              </section>

              {/* Change Password */}
              <section className="bg-mb-surface border border-mb-border rounded-[2px] shadow-2xs p-6">
                <h2 className="font-serif text-lg font-semibold text-mb-text mb-1">
                  Password & Security
                </h2>
                <p className="text-xs text-mb-muted mb-5">
                  Changing your password signs you out of all active sessions.
                </p>

                {passwordMessage && (
                  <div
                    className={`mb-4 p-3 rounded-[2px] border text-xs sm:text-sm font-medium ${
                      passwordMessage.type === "success"
                        ? "bg-green-50 border-green-200 text-green-800"
                        : "bg-mb-error/10 border-mb-error/30 text-mb-error"
                    }`}
                  >
                    {passwordMessage.text}
                  </div>
                )}

                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="current-password" className="block text-xs font-semibold text-mb-text mb-1.5">
                      Current Password
                    </label>
                    <input
                      id="current-password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 border border-mb-border rounded-[2px] bg-mb-bg text-mb-text text-sm focus:border-mb-primary focus:ring-1 focus:ring-mb-primary outline-none transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="new-password" className="block text-xs font-semibold text-mb-text mb-1.5">
                        New Password
                      </label>
                      <input
                        id="new-password"
                        type="password"
                        autoComplete="new-password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2.5 border border-mb-border rounded-[2px] bg-mb-bg text-mb-text text-sm focus:border-mb-primary focus:ring-1 focus:ring-mb-primary outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label htmlFor="confirm-new-password" className="block text-xs font-semibold text-mb-text mb-1.5">
                        Confirm New Password
                      </label>
                      <input
                        id="confirm-new-password"
                        type="password"
                        autoComplete="new-password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2.5 border border-mb-border rounded-[2px] bg-mb-bg text-mb-text text-sm focus:border-mb-primary focus:ring-1 focus:ring-mb-primary outline-none transition-colors"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-mb-muted">
                    Minimum 8 characters with uppercase, lowercase, and a number or symbol.
                  </p>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={passwordSaving}
                      className="px-6 py-2.5 bg-mb-primary hover:bg-mb-primary-hover text-white font-semibold text-xs sm:text-sm rounded-[2px] shadow-xs disabled:opacity-50 transition-colors"
                    >
                      {passwordSaving ? "Updating..." : "Update Password"}
                    </button>
                  </div>
                </form>
              </section>
            </div>

            {/* Sidebar */}
            <aside>
              <div className="bg-mb-surface border border-mb-border rounded-[2px] shadow-2xs p-6 sticky top-24">
                <h2 className="font-serif text-base font-semibold text-mb-text mb-4">
                  Account Navigation
                </h2>
                <nav className="space-y-1.5" aria-label="Account sections">
                  <Link
                    href="/orders"
                    className="flex items-center gap-2.5 px-3 py-2.5 text-xs sm:text-sm font-medium text-mb-text hover:bg-mb-bg hover:text-mb-primary rounded-[2px] transition-colors"
                  >
                    <Icon icon="lucide:package" className="w-4 h-4 text-mb-muted" />
                    <span>My Orders</span>
                  </Link>
                  <Link
                    href="/addresses"
                    className="flex items-center gap-2.5 px-3 py-2.5 text-xs sm:text-sm font-medium text-mb-text hover:bg-mb-bg hover:text-mb-primary rounded-[2px] transition-colors"
                  >
                    <Icon icon="lucide:map-pin" className="w-4 h-4 text-mb-muted" />
                    <span>Saved Addresses</span>
                  </Link>
                  <Link
                    href="/wallet"
                    className="flex items-center gap-2.5 px-3 py-2.5 text-xs sm:text-sm font-medium text-mb-text hover:bg-mb-bg hover:text-mb-primary rounded-[2px] transition-colors"
                  >
                    <Icon icon="lucide:wallet" className="w-4 h-4 text-mb-muted" />
                    <span>My Wallet</span>
                  </Link>
                  <Link
                    href="/wishlist"
                    className="flex items-center gap-2.5 px-3 py-2.5 text-xs sm:text-sm font-medium text-mb-text hover:bg-mb-bg hover:text-mb-primary rounded-[2px] transition-colors"
                  >
                    <Icon icon="lucide:heart" className="w-4 h-4 text-mb-muted" />
                    <span>Wishlist</span>
                  </Link>
                </nav>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

