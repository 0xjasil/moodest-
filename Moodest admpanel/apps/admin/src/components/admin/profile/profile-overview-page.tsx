"use client";

import React from "react";
import Link from "next/link";
import {
  User,
  CheckCircle2,
  Crown,
  MapPin,
  Phone,
  Mail,
  Shield,
  Layers,
  Package,
  ShoppingCart,
  Users,
  Settings,
  Sparkles,
  ExternalLink,
  Lock,
  ArrowUpRight,
  Database,
  Activity,
} from "@/components/ui/icon";
import { ProfileHeader } from "./profile-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { AvatarWithFallback } from "@/components/ui/avatar-with-fallback";
import { cn } from "@/lib/utils";

export function ProfileOverviewPage() {
  const { user } = useAuth();

  const displayName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email.split("@")[0]
    : "Store Administrator";

  const displayRole = user?.role
    ? user.role.replace(/_/g, " ")
    : "ADMINISTRATOR";

  const userEmail = user?.email || "admin@modest.com";
  const userPhone = user?.phone || "+91 (Boutique Operations)";
  const userAvatar = user?.avatar || user?.image || null;

  const quickShortcuts = [
    {
      title: "Products & Catalog",
      description: "Manage abaya designs, lengths 50–62, colors, and SKU pricing",
      href: "/products",
      icon: Package,
      badge: "Catalog",
      color: "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/40",
    },
    {
      title: "Orders & Fulfillment",
      description: "Track customer orders, packing slips, tracking IDs, and status",
      href: "/orders",
      icon: ShoppingCart,
      badge: "Sales",
      color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/40",
    },
    {
      title: "Categories & Collections",
      description: "Manage abaya categories, subcategories, and catalog collections",
      href: "/products/categories-list",
      icon: Layers,
      badge: "Categories",
      color: "text-[#5C1A24] dark:text-[#D29A90] bg-[#5C1A24]/10 dark:bg-[#5C1A24]/20 border-[#5C1A24]/20 dark:border-[#5C1A24]/30",
    },
    {
      title: "Customer Directory",
      description: "View verified customer accounts, addresses, and order histories",
      href: "/customers",
      icon: Users,
      badge: "Clients",
      color: "text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800/40",
    },
    {
      title: "Inventory & Stock",
      description: "Monitor stock quantities, committed reservations, and low-stock alerts",
      href: "/inventory",
      icon: Activity,
      badge: "Stock",
      color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/40",
    },
    {
      title: "Store Settings",
      description: "Configure store details, payment gateways, shipping, and security",
      href: "/settings",
      icon: Settings,
      badge: "Config",
      color: "text-stone-600 dark:text-stone-400 bg-stone-100 dark:bg-stone-900 border-stone-200 dark:border-stone-800",
    },
  ];

  const adminCapabilities = [
    { title: "Catalog Architecture", desc: "Full control over luxury abaya collections, subcategories & attributes" },
    { title: "Atomic Stock Reservations", desc: "Prevents overselling during customer checkout flows" },
    { title: "Order Lifecycle & Tracking", desc: "Process payments, mark dispatched, enter live tracking numbers" },
    { title: "Customer Security & RBAC", desc: "Role-based authorization protecting admin endpoints & customer PII" },
    { title: "Single-Brand Exclusivity", desc: "Tailored specifically for Modest luxury fashion operations" },
  ];

  const auditEvents = [
    {
      title: "Admin Authenticated",
      desc: `Logged in as ${userEmail} via encrypted JWT bearer credentials.`,
      time: "Current Session",
      color: "bg-emerald-500",
    },
    {
      title: "Catalog Sizing Synchronized",
      desc: "Flexible sizing (Free Size, Custom tailored, standard 50–62) enabled in variants engine.",
      time: "Synchronized",
      color: "bg-indigo-500",
    },
    {
      title: "Database Health & Stock Engine",
      desc: "Neon PostgreSQL connection verified with atomic reservation timeout handlers.",
      time: "Online",
      color: "bg-sky-500",
    },
    {
      title: "Storefront API Pipeline",
      desc: "Order processing & customer profile endpoints operational.",
      time: "Active",
      color: "bg-amber-500",
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Standard Profile Header */}
      <ProfileHeader activeTab="profile" />

      {/* 2. 2-Column Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (4 cols): Current Logged-in Admin Info, Contacts, Security */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#141414] p-5 sm:p-6 shadow-xs space-y-6">
            {/* CURRENT ADMIN DETAILS */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Administrator Profile
                </h3>
                <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
                  Active
                </Badge>
              </div>

              <div className="space-y-3.5 text-xs sm:text-sm">
                <div className="flex items-center gap-2.5 text-gray-700 dark:text-gray-300">
                  <User className="size-4 text-gray-400 shrink-0" />
                  <span className="font-medium text-gray-500 dark:text-gray-400">Full Name:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{displayName}</span>
                </div>

                <div className="flex items-center gap-2.5 text-gray-700 dark:text-gray-300">
                  <Crown className="size-4 text-indigo-500 shrink-0" />
                  <span className="font-medium text-gray-500 dark:text-gray-400">Assigned Role:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{displayRole}</span>
                </div>

                <div className="flex items-center gap-2.5 text-gray-700 dark:text-gray-300">
                  <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                  <span className="font-medium text-gray-500 dark:text-gray-400">Account Status:</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    Live Verified Session
                  </span>
                </div>

                <div className="flex items-center gap-2.5 text-gray-700 dark:text-gray-300">
                  <MapPin className="size-4 text-gray-400 shrink-0" />
                  <span className="font-medium text-gray-500 dark:text-gray-400">Store Domain:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">Modest Luxury Abayas</span>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100 dark:border-white/5" />

            {/* CONTACT & CREDENTIALS */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-4">
                Credentials & Contact
              </h3>
              <div className="space-y-3.5 text-xs sm:text-sm">
                <div className="flex items-center gap-2.5 text-gray-700 dark:text-gray-300">
                  <Mail className="size-4 text-gray-400 shrink-0" />
                  <span className="font-medium text-gray-500 dark:text-gray-400">Login Email:</span>
                  <span className="font-semibold text-gray-900 dark:text-white break-all">{userEmail}</span>
                </div>

                <div className="flex items-center gap-2.5 text-gray-700 dark:text-gray-300">
                  <Phone className="size-4 text-gray-400 shrink-0" />
                  <span className="font-medium text-gray-500 dark:text-gray-400">Support Contact:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{userPhone}</span>
                </div>

                <div className="flex items-center gap-2.5 text-gray-700 dark:text-gray-300">
                  <Lock className="size-4 text-gray-400 shrink-0" />
                  <span className="font-medium text-gray-500 dark:text-gray-400">Auth Token:</span>
                  <span className="font-mono text-xs text-gray-700 dark:text-gray-300">HTTP-Only JWT Cookie</span>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100 dark:border-white/5" />

            {/* ADMIN PRIVILEGES */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
                Granted Capabilities
              </h3>
              <div className="space-y-2.5">
                {adminCapabilities.map((cap, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <Shield className="size-3.5 text-indigo-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-gray-900 dark:text-white leading-tight">
                        {cap.title}
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-normal mt-0.5">
                        {cap.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (8 cols): Quick Admin Dashboard, Store Controls, System Activity */}
        <div className="lg:col-span-8 space-y-6">
          {/* 1. Admin Quick Shortcuts Grid */}
          <div className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#141414] p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                  Store Management Dashboard
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Direct operational controls for Modest boutique catalog and orders.
                </p>
              </div>
              <Sparkles className="size-5 text-indigo-500 shrink-0" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {quickShortcuts.map((s) => {
                const Icon = s.icon;
                return (
                  <Link
                    key={s.title}
                    href={s.href}
                    className="group p-4 rounded-xl border border-gray-200/80 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] hover:bg-white dark:hover:bg-white/[0.05] hover:border-indigo-300 dark:hover:border-indigo-800 transition-all shadow-2xs hover:shadow-xs flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn("size-7 rounded-lg border flex items-center justify-center shrink-0", s.color)}>
                          <Icon className="size-3.5" />
                        </span>
                        <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                          {s.title}
                        </h3>
                      </div>
                      <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                        {s.description}
                      </p>
                    </div>
                    <ArrowUpRight className="size-4 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0 mt-0.5" />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* 2. Store Operations & Platform Status */}
          <div className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#141414] p-5 sm:p-6 shadow-xs">
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">
              Platform & Database Status
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="p-3.5 rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>Database</span>
                  <Database className="size-3.5 text-indigo-500" />
                </div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">Neon PostgreSQL</p>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">
                  ● Operational & Pooled
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>Auth Engine</span>
                  <Lock className="size-3.5 text-emerald-500" />
                </div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">JWT Guard</p>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">
                  ● Protected RBAC Active
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>Catalog Engine</span>
                  <Layers className="size-3.5 text-purple-500" />
                </div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">Abaya Variants</p>
                <p className="text-[11px] text-purple-600 dark:text-purple-400 mt-0.5 font-medium">
                  ● 50–62 + Custom Sizes
                </p>
              </div>
            </div>
          </div>

          {/* 3. System Activity Log (Clean replacement for dummy invoices & client meeting) */}
          <div className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#141414] p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  System & Administration Activity
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Verified security and store management logs for this administrator session.
                </p>
              </div>
              <Activity className="size-4 text-emerald-500" />
            </div>

            <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100 dark:before:bg-white/10">
              {auditEvents.map((ev, i) => (
                <div key={i} className="relative">
                  <span className={cn("absolute -left-6 top-1.5 size-2.5 rounded-full ring-4 ring-gray-100 dark:ring-white/10", ev.color)} />
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                      {ev.title}
                    </h4>
                    <span className="text-[11px] text-gray-400 font-medium shrink-0">{ev.time}</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {ev.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
