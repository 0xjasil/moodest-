"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiFetch } from "@/lib/apiFetch";
import { CustomerLayoutFrame } from "./customer-layout-frame";

interface ShippingAddressInfo {
  name?: string;
  phone?: string;
  street?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
}

interface CustomerOrder {
  id: string;
  rawId: string;
  date: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  itemCount: number;
  itemsSummary: string;
  spent: number;
  shippingAddress?: ShippingAddressInfo;
}

export function CustomerOverviewPage() {
  const router = useRouter();
  const params = useParams();
  const customerIdParam = params?.id as string | undefined;

  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [searchOrder, setSearchOrder] = useState("");
  const [pageSize, setPageSize] = useState<number>(5);
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    if (!customerIdParam) {
      setLoadingOrders(false);
      return;
    }

    const loadOrders = async () => {
      try {
        setLoadingOrders(true);
        const res = await apiFetch(`/api/admin/orders?limit=100`);
        if (!res.ok) {
          setOrders([]);
          return;
        }
        const json = await res.json();
        const rawOrders: any[] = Array.isArray(json)
          ? json
          : json.data || json.items || [];

        const customerOrders: CustomerOrder[] = rawOrders
          .filter((o) => String(o.userId) === String(customerIdParam))
          .map((o) => {
            const rawStatus = String(o.status || o.orderStatus || "PENDING").toUpperCase();
            const orderItems = Array.isArray(o.items) ? o.items : [];
            const itemCount = orderItems.reduce(
              (sum: number, it: any) => sum + Number(it.quantity || 1),
              0
            );
            const firstProductName = orderItems[0]?.product?.name;
            const itemsSummary =
              orderItems.length === 0
                ? "0 items"
                : orderItems.length === 1
                ? `${firstProductName || "1 item"} (×${itemCount})`
                : `${firstProductName || "Order item"} +${orderItems.length - 1} more`;

            return {
              id: o.orderNumber
                ? `#${o.orderNumber}`
                : `#${String(o.id).slice(-6).toUpperCase()}`,
              rawId: String(o.id),
              date: o.createdAt
                ? new Date(o.createdAt).toLocaleDateString("en-IN", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "—",
              status: rawStatus,
              paymentMethod: String(o.paymentMethod || "RAZORPAY").toUpperCase(),
              paymentStatus: String(o.paymentStatus || "PENDING").toUpperCase(),
              itemCount,
              itemsSummary,
              spent: Number(o.totalAmount ?? o.total ?? 0),
              shippingAddress: o.shippingAddress,
            };
          });

        setOrders(customerOrders);
      } catch {
        setOrders([]);
      } finally {
        setLoadingOrders(false);
      }
    };

    loadOrders();
  }, [customerIdParam]);

  const activeOrders = useMemo(
    () => orders.filter((o) => o.status !== "CANCELLED"),
    [orders]
  );

  const cancelledOrReturnedCount = useMemo(
    () =>
      orders.filter((o) => o.status === "CANCELLED" || o.status === "RETURNED")
        .length,
    [orders]
  );

  const lifetimeSpent = useMemo(
    () => activeOrders.reduce((sum, o) => sum + (o.spent || 0), 0),
    [activeOrders]
  );

  const averageOrderValue =
    activeOrders.length > 0 ? lifetimeSpent / activeOrders.length : 0;

  const latestShippingAddress = useMemo(() => {
    const withAddress = orders.find((o) => o.shippingAddress);
    return withAddress?.shippingAddress || null;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (!searchOrder.trim()) return true;
      const q = searchOrder.toLowerCase();
      return (
        o.id.toLowerCase().includes(q) ||
        o.date.toLowerCase().includes(q) ||
        o.status.toLowerCase().includes(q) ||
        o.paymentMethod.toLowerCase().includes(q) ||
        o.itemsSummary.toLowerCase().includes(q) ||
        String(o.spent).includes(q)
      );
    });
  }, [orders, searchOrder]);

  const totalEntries = filteredOrders.length;
  const totalPages = Math.ceil(totalEntries / pageSize) || 1;
  const validPage = Math.min(currentPage, totalPages);
  const paginatedOrders = useMemo(() => {
    const start = (validPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, validPage, pageSize]);

  const startIndex = totalEntries === 0 ? 0 : (validPage - 1) * pageSize + 1;
  const endIndex = Math.min(validPage * pageSize, totalEntries);

  const renderStatusBadge = (status: string) => {
    const label = status.charAt(0) + status.slice(1).toLowerCase();
    switch (status) {
      case "PENDING":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
            {label}
          </span>
        );
      case "CONFIRMED":
      case "PROCESSING":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20">
            {label}
          </span>
        );
      case "SHIPPED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20">
            {label}
          </span>
        );
      case "DELIVERED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
            {label}
          </span>
        );
      case "CANCELLED":
      case "RETURNED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
            {label}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-gray-500/10 text-gray-700 dark:text-gray-300 border border-gray-500/20">
            {label}
          </span>
        );
    }
  };

  return (
    <CustomerLayoutFrame currentTab="overview" pageTitle="Customer Overview">
      <div className="space-y-6">
        {/* Accurate Order Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#141414] shadow-xs p-5 space-y-2.5">
            <div className="size-10 rounded-xl bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex items-center justify-center text-stone-800 dark:text-stone-200">
              <Icon icon="lucide:shopping-bag" className="size-5" />
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Lifetime Spent
              </h4>
              <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                ₹{lifetimeSpent.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Excluding cancelled orders
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#141414] shadow-xs p-5 space-y-2.5">
            <div className="size-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Icon icon="lucide:package-check" className="size-5" />
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Active Orders
              </h4>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {activeOrders.length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Pending, shipped &amp; delivered
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#141414] shadow-xs p-5 space-y-2.5">
            <div className="size-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Icon icon="lucide:trending-up" className="size-5" />
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Average Order Value
              </h4>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                ₹{averageOrderValue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Average per valid checkout
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#141414] shadow-xs p-5 space-y-2.5">
            <div className="size-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <Icon icon="lucide:rotate-ccw" className="size-5" />
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Cancelled / Returned
              </h4>
              <p className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">
                {cancelledOrReturnedCount}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Out of {orders.length} total order records
              </p>
            </div>
          </div>
        </div>

        {/* Latest Shipping Address from Actual Order History */}
        {latestShippingAddress && (
          <div className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#141414] shadow-xs p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="size-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
                <Icon icon="lucide:map-pin" className="size-4" />
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Latest Delivery Address
                </h3>
                <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">
                  {latestShippingAddress.name}
                  {latestShippingAddress.phone ? ` · ${latestShippingAddress.phone}` : ""}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                  {[
                    latestShippingAddress.street,
                    latestShippingAddress.city,
                    latestShippingAddress.state,
                    latestShippingAddress.pincode,
                    latestShippingAddress.country,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Real Orders History Table */}
        <div className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#141414] shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200/70 dark:border-white/10 bg-gray-50/40 dark:bg-white/[0.01]">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                Order History
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Real orders synced from storefront checkout
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Select
                value={String(pageSize)}
                onValueChange={(val) => {
                  setPageSize(Number(val));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-9 w-[70px] rounded-xl border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#181818] text-xs font-medium">
                  <SelectValue placeholder="5" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-gray-200 dark:border-white/10">
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                </SelectContent>
              </Select>

              <div className="relative w-48 sm:w-56">
                <Icon
                  icon="lucide:search"
                  className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-gray-400"
                />
                <Input
                  type="text"
                  placeholder="Search order..."
                  value={searchOrder}
                  onChange={(e) => {
                    setSearchOrder(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-9 pl-9 pr-3 rounded-xl border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#181818] text-xs placeholder:text-gray-400 focus-visible:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200/70 dark:border-white/10 text-gray-500 dark:text-gray-400 text-xs font-semibold bg-gray-50/50 dark:bg-white/[0.01]">
                  <th className="px-4 py-3 font-semibold">Order</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Items</th>
                  <th className="px-4 py-3 font-semibold">Payment</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Total</th>
                  <th className="px-4 py-3 text-right font-semibold pr-5">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {loadingOrders ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-10 text-center text-xs text-gray-500 dark:text-gray-400"
                    >
                      Loading customer orders...
                    </td>
                  </tr>
                ) : paginatedOrders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-10 text-center text-xs text-gray-500 dark:text-gray-400"
                    >
                      {searchOrder.trim()
                        ? `No orders matching "${searchOrder}".`
                        : "This customer has not placed any orders yet."}
                    </td>
                  </tr>
                ) : (
                  paginatedOrders.map((order) => (
                    <tr
                      key={order.rawId}
                      className="hover:bg-gray-50/70 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-4 py-3.5 font-semibold text-xs sm:text-sm whitespace-nowrap">
                        <Link
                          href={`/orders/${order.rawId}`}
                          className="text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          {order.id}
                        </Link>
                      </td>

                      <td className="px-4 py-3.5 text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">
                        {order.date}
                      </td>

                      <td className="px-4 py-3.5 text-xs text-gray-700 dark:text-gray-300 max-w-[220px] truncate">
                        {order.itemsSummary}
                      </td>

                      <td className="px-4 py-3.5 text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">
                        <span className="font-medium text-gray-800 dark:text-gray-200">
                          {order.paymentMethod}
                        </span>
                        <span className="text-gray-400 mx-1">·</span>
                        <span
                          className={
                            order.paymentStatus === "PAID"
                              ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                              : "text-amber-600 dark:text-amber-400 font-medium"
                          }
                        >
                          {order.paymentStatus}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {renderStatusBadge(order.status)}
                      </td>

                      <td className="px-4 py-3.5 text-xs sm:text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                        ₹{order.spent.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      <td className="px-4 py-3.5 text-right pr-5 whitespace-nowrap">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/orders/${order.rawId}`)}
                          className="h-7 px-2.5 rounded-lg text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 cursor-pointer"
                        >
                          <Icon icon="lucide:eye" className="size-3.5 mr-1" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="p-3.5 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-200/70 dark:border-white/10 bg-gray-50/30 dark:bg-white/[0.01]">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {totalEntries === 0 ? (
                "Showing 0 entries"
              ) : (
                <>
                  Showing{" "}
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {startIndex}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {endIndex}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {totalEntries}
                  </span>{" "}
                  entries
                </>
              )}
            </p>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="icon"
                disabled={validPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="size-7 rounded-lg border-gray-200 dark:border-white/10 bg-white dark:bg-[#181818] text-gray-700 dark:text-gray-300 disabled:opacity-40"
                aria-label="Previous page"
              >
                <Icon icon="lucide:chevron-left" className="size-3.5" />
              </Button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                const isActive = page === validPage;
                return (
                  <Button
                    key={page}
                    variant={isActive ? "default" : "outline"}
                    onClick={() => setCurrentPage(page)}
                    className={`size-7 rounded-lg text-xs font-semibold transition-colors ${
                      isActive
                        ? "bg-indigo-600 hover:bg-indigo-700 text-white border-transparent"
                        : "border-gray-200 dark:border-white/10 bg-white dark:bg-[#181818] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5"
                    }`}
                  >
                    {page}
                  </Button>
                );
              })}

              <Button
                variant="outline"
                size="icon"
                disabled={validPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="size-7 rounded-lg border-gray-200 dark:border-white/10 bg-white dark:bg-[#181818] text-gray-700 dark:text-gray-300 disabled:opacity-40"
                aria-label="Next page"
              >
                <Icon icon="lucide:chevron-right" className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </CustomerLayoutFrame>
  );
}
