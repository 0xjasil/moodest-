"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Home,
  User,
  Shield,
  MapPin,
  Bell,
  Trash2,
  ShoppingCart,
  DollarSign,
  Rocket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface CustomerLayoutFrameProps {
  currentTab: "overview" | "security" | "address-billing" | "notifications";
  pageTitle: string;
  children: React.ReactNode;
}

export function CustomerLayoutFrame({
  currentTab,
  pageTitle,
  children,
}: CustomerLayoutFrameProps) {
  const router = useRouter();

  // Shared Customer State
  const [customer, setCustomer] = useState({
    name: "Lorine Hischke",
    customerId: "#634759",
    dateJoined: "Aug 17, 2020, 5:48 (ET)",
    avatar: "/images/avatars/1.webp",
    ordersCount: 184,
    totalSpent: 12378,
    username: "lorine.hischke",
    email: "vafgot@vultukir.org",
    status: "Active",
    contact: "(123) 456-7890",
    country: "USA",
  });

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);

  const [editForm, setEditForm] = useState({
    name: customer.name,
    username: customer.username,
    email: customer.email,
    contact: customer.contact,
    country: customer.country,
    status: customer.status,
  });

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomer((prev) => ({
      ...prev,
      ...editForm,
    }));
    toast.success("Customer details updated successfully");
    setIsEditDialogOpen(false);
  };

  const handleDeleteCustomer = () => {
    toast.success(`Customer ${customer.name} deleted successfully`);
    setIsDeleteDialogOpen(false);
    router.push("/customers");
  };

  return (
    <div className="flex flex-1 flex-col space-y-6">
      {/* 1. Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        <Link
          href="/"
          className="hover:text-gray-900 dark:hover:text-gray-100 flex items-center gap-1 transition-colors"
          title="Home"
        >
          <Home className="size-3.5" />
        </Link>
        <span>/</span>
        <Link
          href="/customers"
          className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
        >
          Customer
        </Link>
        <span>/</span>
        <span className="text-gray-900 dark:text-white font-medium">
          {pageTitle}
        </span>
      </nav>

      {/* 2. Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Customer ID {customer.customerId}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">
            {customer.dateJoined}
          </p>
        </div>

        <Button
          onClick={() => setIsDeleteDialogOpen(true)}
          className="h-10 px-4 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 dark:hover:bg-rose-950/60 border border-rose-200/80 dark:border-rose-900/30 rounded-xl text-xs sm:text-sm font-semibold shadow-2xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          Delete Customer
        </Button>
      </div>

      {/* 3. Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 pt-1 pb-2 border-b border-gray-200/70 dark:border-white/10">
        <Link
          href="/customers/overview"
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
            currentTab === "overview"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5"
          }`}
        >
          <User className="size-4" />
          <span>Overview</span>
        </Link>

        <Link
          href="/customers/security"
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
            currentTab === "security"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5"
          }`}
        >
          <Shield className="size-4" />
          <span>Security</span>
        </Link>

        <Link
          href="/customers/address-billing"
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
            currentTab === "address-billing"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5"
          }`}
        >
          <MapPin className="size-4" />
          <span>Address & Billing</span>
        </Link>

        <Link
          href="/customers/notifications"
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
            currentTab === "notifications"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5"
          }`}
        >
          <Bell className="size-4" />
          <span>Notifications</span>
        </Link>
      </div>

      {/* 4. 2-Column Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: Customer Profile Card & Upgrade Banner */}
        <div className="space-y-6 lg:col-span-1">
          {/* Customer Profile Card */}
          <div className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#141414] shadow-xs p-6 space-y-6">
            {/* Avatar */}
            <div className="flex flex-col items-center text-center">
              <div className="size-28 sm:size-32 rounded-2xl overflow-hidden border border-gray-200/80 dark:border-white/10 bg-gray-100 dark:bg-white/5 shadow-2xs">
                <Image
                  src={customer.avatar}
                  alt={customer.name}
                  width={128}
                  height={128}
                  priority
                  className="size-full object-cover"
                />
              </div>

              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mt-4">
                {customer.name}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Customer ID {customer.customerId}
              </p>
            </div>

            {/* Orders & Spent KPI Pills */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-gray-50/70 dark:bg-white/[0.02] border border-gray-200/70 dark:border-white/10 flex items-center gap-3">
                <div className="size-9 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <ShoppingCart className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {customer.ordersCount}
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                    Orders
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-gray-50/70 dark:bg-white/[0.02] border border-gray-200/70 dark:border-white/10 flex items-center gap-3">
                <div className="size-9 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <DollarSign className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    ${customer.totalSpent.toLocaleString()}
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                    Spent
                  </p>
                </div>
              </div>
            </div>

            {/* Profile Details List */}
            <div className="space-y-3 pt-4 border-t border-gray-200/70 dark:border-white/10 text-xs sm:text-sm">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">
                Details
              </h3>

              <div className="space-y-2.5 text-gray-600 dark:text-gray-300">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900 dark:text-white">
                    Username:
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {customer.username}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900 dark:text-white">
                    Email:
                  </span>
                  <span className="text-gray-600 dark:text-gray-400 truncate max-w-[170px]">
                    {customer.email}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900 dark:text-white">
                    Status:
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                    {customer.status}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900 dark:text-white">
                    Contact:
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {customer.contact}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900 dark:text-white">
                    Country:
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {customer.country}
                  </span>
                </div>
              </div>
            </div>

            {/* Edit Details Action Button */}
            <Button
              onClick={() => {
                setEditForm({
                  name: customer.name,
                  username: customer.username,
                  email: customer.email,
                  contact: customer.contact,
                  country: customer.country,
                  status: customer.status,
                });
                setIsEditDialogOpen(true);
              }}
              className="w-full h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
            >
              Edit Details
            </Button>
          </div>

          {/* Upgrade to Premium Banner Card */}
          <div className="rounded-2xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-neutral-900 text-white p-6 shadow-sm relative overflow-hidden border border-indigo-800/40">
            <div className="absolute -right-8 -bottom-8 size-40 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col justify-between space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold tracking-tight text-white">
                    Upgrade to premium
                  </h3>
                  <p className="text-xs text-indigo-200/80 leading-relaxed max-w-[190px]">
                    Upgrade customer to premium membership to access pro features.
                  </p>
                </div>

                <div className="size-14 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0 shadow-lg text-indigo-300">
                  <Rocket className="size-7" />
                </div>
              </div>

              <Button
                onClick={() => setIsPlanDialogOpen(true)}
                className="w-full h-10 rounded-xl bg-white text-indigo-950 hover:bg-gray-100 font-bold text-xs sm:text-sm shadow-md transition-colors cursor-pointer"
              >
                Select Plan
              </Button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Tab specific contents */}
        <div className="space-y-6 lg:col-span-2">{children}</div>
      </div>

      {/* Edit Details Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl border-gray-200 dark:border-white/10">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              Edit Customer Details
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500 dark:text-gray-400">
              Update personal information and status for {customer.name}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveCustomer} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="frame-name" className="text-xs font-medium">
                Full Name
              </Label>
              <Input
                id="frame-name"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
                className="h-10 rounded-xl text-xs sm:text-sm"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="frame-username" className="text-xs font-medium">
                Username
              </Label>
              <Input
                id="frame-username"
                value={editForm.username}
                onChange={(e) =>
                  setEditForm({ ...editForm, username: e.target.value })
                }
                className="h-10 rounded-xl text-xs sm:text-sm"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="frame-email" className="text-xs font-medium">
                Email
              </Label>
              <Input
                id="frame-email"
                type="email"
                value={editForm.email}
                onChange={(e) =>
                  setEditForm({ ...editForm, email: e.target.value })
                }
                className="h-10 rounded-xl text-xs sm:text-sm"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="frame-phone" className="text-xs font-medium">
                  Contact
                </Label>
                <Input
                  id="frame-phone"
                  value={editForm.contact}
                  onChange={(e) =>
                    setEditForm({ ...editForm, contact: e.target.value })
                  }
                  className="h-10 rounded-xl text-xs sm:text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="frame-country" className="text-xs font-medium">
                  Country
                </Label>
                <Input
                  id="frame-country"
                  value={editForm.country}
                  onChange={(e) =>
                    setEditForm({ ...editForm, country: e.target.value })
                  }
                  className="h-10 rounded-xl text-xs sm:text-sm"
                />
              </div>
            </div>

            <DialogFooter className="pt-4 flex sm:flex-row items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                className="rounded-xl text-xs h-9 px-4"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="rounded-xl text-xs h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Customer Alert Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className="rounded-2xl border-gray-200 dark:border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-gray-900 dark:text-white">
              Delete Customer Account
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Are you sure you want to permanently delete{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                {customer.name}
              </span>{" "}
              ({customer.customerId})? All purchase records, rewards points, and
              account balances will be archived.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl text-xs h-9 px-4">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCustomer}
              className="rounded-xl text-xs h-9 px-4 bg-rose-600 hover:bg-rose-700 text-white font-semibold"
            >
              Delete Customer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Upgrade Plan Dialog */}
      <Dialog open={isPlanDialogOpen} onOpenChange={setIsPlanDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl border-gray-200 dark:border-white/10">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              Upgrade Membership Plan
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500 dark:text-gray-400">
              Select a premium tier for {customer.name}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-3">
            <div className="p-3.5 rounded-xl border-2 border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/20 flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  Gold VIP
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  5% cashback, free expedited shipping
                </p>
              </div>
              <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                $19/mo
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-gray-200 dark:border-white/10 hover:border-indigo-400 transition-colors flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  Platinum Elite
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  10% cashback, personal concierge, priority fulfillment
                </p>
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                $49/mo
              </span>
            </div>
          </div>

          <DialogFooter className="flex sm:flex-row items-center justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsPlanDialogOpen(false)}
              className="rounded-xl text-xs h-9 px-4"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                toast.success("Membership upgraded to Gold VIP");
                setIsPlanDialogOpen(false);
              }}
              className="rounded-xl text-xs h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
            >
              Confirm Upgrade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
