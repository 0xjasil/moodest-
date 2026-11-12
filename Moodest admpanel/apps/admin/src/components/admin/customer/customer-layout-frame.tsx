"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/apiFetch";

interface CustomerLayoutFrameProps {
  currentTab?: "overview" | "security" | "address-billing" | "notifications";
  pageTitle?: string;
  children: React.ReactNode;
}

interface CustomerProfileState {
  loading: boolean;
  found: boolean;
  name: string;
  customerId: string;
  dateJoined: string;
  ordersCount: number;
  totalSpent: number;
  email: string;
  status: "Active" | "Inactive";
  contact: string | null;
  location: string | null;
}

export function CustomerLayoutFrame({
  children,
}: CustomerLayoutFrameProps) {
  const params = useParams();
  const customerIdParam = params?.id as string | undefined;

  const [customer, setCustomer] = useState<CustomerProfileState>({
    loading: true,
    found: false,
    name: "Loading Customer...",
    customerId: customerIdParam ? `#${String(customerIdParam).slice(-6).toUpperCase()}` : "—",
    dateJoined: "—",
    ordersCount: 0,
    totalSpent: 0,
    email: "—",
    status: "Active",
    contact: null,
    location: null,
  });

  useEffect(() => {
    if (!customerIdParam) return;
    let active = true;

    const fetchCustomer = async () => {
      try {
        const [res, ordersRes] = await Promise.all([
          apiFetch(`/api/admin/users?limit=100`).catch(() => null),
          apiFetch(`/api/admin/orders?limit=100`).catch(() => null),
        ]);

        let computedOrdersCount = 0;
        let computedTotalSpent = 0;
        let latestLocation: string | null = null;
        let latestShippingPhone: string | null = null;

        if (ordersRes && ordersRes.ok) {
          const ordersJson = await ordersRes.json();
          const ordersList = Array.isArray(ordersJson)
            ? ordersJson
            : ordersJson.data || ordersJson.items || [];

          for (const ord of ordersList) {
            if (String(ord.userId) !== String(customerIdParam)) continue;
            computedOrdersCount += 1;

            const st = String(ord.status || ord.orderStatus || "").toUpperCase();
            const amt = Number(ord.totalAmount ?? ord.total ?? 0);
            if (st !== "CANCELLED" && !Number.isNaN(amt)) {
              computedTotalSpent += amt;
            }

            if (!latestLocation && ord.shippingAddress) {
              const parts = [
                ord.shippingAddress.city,
                ord.shippingAddress.state,
                ord.shippingAddress.country,
              ].filter(Boolean);
              if (parts.length > 0) {
                latestLocation = parts.join(", ");
              }
            }
            if (!latestShippingPhone && ord.shippingAddress?.phone) {
              latestShippingPhone = String(ord.shippingAddress.phone);
            }
          }
        }

        if (res && res.ok && active) {
          const json = await res.json();
          const list = Array.isArray(json) ? json : json.data || json.items || [];
          const match = list.find((u: any) => String(u.id) === String(customerIdParam));

          if (match) {
            const fullName =
              [match.firstName, match.lastName].filter(Boolean).join(" ") ||
              match.name ||
              match.email;
            const formattedId = `#${String(match.id).slice(-6).toUpperCase()}`;
            const statusLabel: "Active" | "Inactive" =
              match.isActive === false ? "Inactive" : "Active";

            setCustomer({
              loading: false,
              found: true,
              name: fullName,
              customerId: formattedId,
              dateJoined: match.createdAt
                ? new Date(match.createdAt).toLocaleDateString("en-IN", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "—",
              ordersCount: match._count?.orders ?? match.ordersCount ?? computedOrdersCount,
              totalSpent: match.totalSpent ?? computedTotalSpent,
              email: match.email || "—",
              status: statusLabel,
              contact: match.phone || latestShippingPhone || null,
              location: latestLocation,
            });
            return;
          }
        }

        if (active) {
          setCustomer((prev) => ({
            ...prev,
            loading: false,
            found: false,
            name: "Customer Not Found",
            ordersCount: computedOrdersCount,
            totalSpent: computedTotalSpent,
            location: latestLocation,
            contact: latestShippingPhone,
          }));
        }
      } catch (e) {
        console.error("Failed to fetch customer profile", e);
        if (active) {
          setCustomer((prev) => ({
            ...prev,
            loading: false,
            found: false,
            name: "Unable to load customer",
          }));
        }
      }
    };

    fetchCustomer();
    return () => {
      active = false;
    };
  }, [customerIdParam]);

  return (
    <div className="flex flex-1 flex-col space-y-6">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        <Link
          href="/"
          className="hover:text-gray-900 dark:hover:text-gray-100 flex items-center gap-1 transition-colors"
          title="Home"
        >
          <Icon icon="lucide:home" className="size-3.5" />
        </Link>
        <span>/</span>
        <Link
          href="/customers"
          className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
        >
          Customers
        </Link>
        <span>/</span>
        <span className="text-gray-900 dark:text-white font-medium">
          {customer.name}
        </span>
      </nav>

      {/* Clean Imageless Customer Summary Header */}
      <div className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#141414] shadow-xs p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Identity & Account Details */}
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                {customer.name}
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/40">
                {customer.customerId}
              </span>
              {!customer.loading && customer.found && (
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                    customer.status === "Active"
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                      : "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20"
                  }`}
                >
                  <span
                    className={`size-1.5 rounded-full ${
                      customer.status === "Active" ? "bg-emerald-500" : "bg-rose-500"
                    }`}
                  />
                  {customer.status}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-gray-600 dark:text-gray-400 font-medium">
              <span className="inline-flex items-center gap-1.5">
                <Icon icon="lucide:mail" className="size-3.5 text-gray-400" />
                {customer.email}
              </span>
              {customer.contact && (
                <span className="inline-flex items-center gap-1.5">
                  <Icon icon="lucide:phone" className="size-3.5 text-gray-400" />
                  {customer.contact}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Icon icon="lucide:calendar" className="size-3.5 text-gray-400" />
                Joined {customer.dateJoined}
              </span>
              {customer.location && (
                <span className="inline-flex items-center gap-1.5">
                  <Icon icon="lucide:map-pin" className="size-3.5 text-indigo-500" />
                  {customer.location}
                </span>
              )}
            </div>
          </div>

          {/* Back Navigation */}
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/customers">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 px-3.5 rounded-xl text-xs font-semibold border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer"
              >
                <Icon icon="lucide:arrow-left" className="size-3.5 mr-1.5" />
                Back to Customers
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">{children}</div>
    </div>
  );
}
