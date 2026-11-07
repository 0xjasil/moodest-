"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  Gift,
  Star,
  Award,
  Search,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { CustomerLayoutFrame } from "./customer-layout-frame";

interface CustomerOrder {
  id: string; // e.g. "#5434"
  rawId: string;
  date: string;
  status: "Dispatched" | "Out for Delivery" | "Delivered" | "Cancelled" | "Ready to Pickup";
  spent: number;
}

const INITIAL_ORDERS: CustomerOrder[] = [
  {
    id: "#5434",
    rawId: "ORD-9421",
    date: "May 16, 2022",
    status: "Dispatched",
    spent: 73.98,
  },
  {
    id: "#6745",
    rawId: "ORD-8932",
    date: "May 3, 2023",
    status: "Dispatched",
    spent: 100.39,
  },
  {
    id: "#6087",
    rawId: "ORD-7811",
    date: "Dec 15, 2022",
    status: "Out for Delivery",
    spent: 809.26,
  },
  {
    id: "#7825",
    rawId: "ORD-6520",
    date: "Aug 5, 2022",
    status: "Out for Delivery",
    spent: 617.64,
  },
  {
    id: "#5604",
    rawId: "ORD-5491",
    date: "Jun 18, 2022",
    status: "Dispatched",
    spent: 384.41,
  },
  {
    id: "#9120",
    rawId: "ORD-4102",
    date: "Jan 12, 2024",
    status: "Delivered",
    spent: 450.0,
  },
  {
    id: "#8341",
    rawId: "ORD-3918",
    date: "Feb 28, 2024",
    status: "Delivered",
    spent: 125.5,
  },
  {
    id: "#7109",
    rawId: "ORD-2810",
    date: "Mar 15, 2024",
    status: "Delivered",
    spent: 890.0,
  },
  {
    id: "#6201",
    rawId: "ORD-1902",
    date: "Apr 22, 2024",
    status: "Cancelled",
    spent: 45.0,
  },
  {
    id: "#5190",
    rawId: "ORD-1109",
    date: "Jul 10, 2024",
    status: "Delivered",
    spent: 1240.0,
  },
];

export function CustomerOverviewPage() {
  const router = useRouter();

  // Orders Datagrid State
  const [orders, setOrders] = useState<CustomerOrder[]>(INITIAL_ORDERS);
  const [searchOrder, setSearchOrder] = useState("");
  const [pageSize, setPageSize] = useState<number>(5);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
  const [deleteOrderTarget, setDeleteOrderTarget] = useState<CustomerOrder | null>(null);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (!searchOrder.trim()) return true;
      const q = searchOrder.toLowerCase();
      return (
        o.id.toLowerCase().includes(q) ||
        o.date.toLowerCase().includes(q) ||
        o.status.toLowerCase().includes(q) ||
        String(o.spent).includes(q)
      );
    });
  }, [orders, searchOrder]);

  // Pagination
  const totalEntries = filteredOrders.length;
  const totalPages = Math.ceil(totalEntries / pageSize) || 1;
  const validPage = Math.min(currentPage, totalPages);
  const paginatedOrders = useMemo(() => {
    const start = (validPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, validPage, pageSize]);

  const startIndex = (validPage - 1) * pageSize + 1;
  const endIndex = Math.min(validPage * pageSize, totalEntries);

  // Selection
  const isAllOrdersSelected =
    paginatedOrders.length > 0 &&
    paginatedOrders.every((o) => selectedOrderIds.has(o.id));

  const handleSelectAllOrders = (checked: boolean) => {
    if (checked) {
      setSelectedOrderIds(new Set(paginatedOrders.map((o) => o.id)));
    } else {
      setSelectedOrderIds(new Set());
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    const next = new Set(selectedOrderIds);
    if (checked) next.add(id);
    else next.delete(id);
    setSelectedOrderIds(next);
  };

  // Status Badge Helper
  const renderStatusBadge = (status: CustomerOrder["status"]) => {
    switch (status) {
      case "Dispatched":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
            Dispatched
          </span>
        );
      case "Out for Delivery":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20">
            Out for Delivery
          </span>
        );
      case "Delivered":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
            Delivered
          </span>
        );
      case "Cancelled":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20">
            {status}
          </span>
        );
    }
  };

  const handleDeleteOrder = () => {
    if (!deleteOrderTarget) return;
    setOrders((prev) => prev.filter((o) => o.id !== deleteOrderTarget.id));
    toast.success(`Order ${deleteOrderTarget.id} deleted`);
    setDeleteOrderTarget(null);
  };

  return (
    <CustomerLayoutFrame currentTab="overview" pageTitle="Customer Overview">
      <div className="space-y-6">
        {/* The 4 Stat Cards in a 2x2 Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 1. Account Balance */}
          <div className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#141414] shadow-xs p-5 space-y-3">
            <div className="size-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-2xs">
              <CreditCard className="size-5" />
            </div>

            <div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                Account Balance
              </h4>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                  $2345
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Credit Left
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Account balance for next purchase
              </p>
            </div>
          </div>

          {/* 2. Loyalty Program */}
          <div className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#141414] shadow-xs p-5 space-y-3">
            <div className="size-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-2xs">
              <Gift className="size-5" />
            </div>

            <div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                Loyalty Program
              </h4>
              <div className="mt-1.5">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  Platinum member
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                3000 points to next tier
              </p>
            </div>
          </div>

          {/* 3. Wishlist */}
          <div className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#141414] shadow-xs p-5 space-y-3">
            <div className="size-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-2xs">
              <Star className="size-5" />
            </div>

            <div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                Wishlist
              </h4>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-xl font-bold text-amber-600 dark:text-amber-400">
                  15
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Items in Wishlist
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Receive notification when items go on sale
              </p>
            </div>
          </div>

          {/* 4. Coupons */}
          <div className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#141414] shadow-xs p-5 space-y-3">
            <div className="size-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-2xs">
              <Award className="size-5" />
            </div>

            <div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                Coupons
              </h4>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                  21
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Coupons you win
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Use coupon on next purchase
              </p>
            </div>
          </div>
        </div>

        {/* Orders placed Datagrid Card */}
        <div className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#141414] shadow-xs overflow-hidden">
          {/* Header / Toolbar */}
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200/70 dark:border-white/10 bg-gray-50/40 dark:bg-white/[0.01]">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
              Orders placed
            </h3>

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
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search order"
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

          {/* Orders Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200/70 dark:border-white/10 text-gray-500 dark:text-gray-400 text-xs font-semibold bg-gray-50/50 dark:bg-white/[0.01]">
                  <th className="w-10 px-3 py-3 text-center">
                    <Checkbox
                      checked={isAllOrdersSelected}
                      onCheckedChange={(c) => handleSelectAllOrders(Boolean(c))}
                      aria-label="Select all orders"
                    />
                  </th>
                  <th className="px-4 py-3 font-semibold">Order</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Spent</th>
                  <th className="w-16 px-4 py-3 text-right font-semibold pr-5">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {paginatedOrders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-10 text-center text-xs text-gray-500 dark:text-gray-400"
                    >
                      No orders matching &quot;{searchOrder}&quot;.
                    </td>
                  </tr>
                ) : (
                  paginatedOrders.map((order) => {
                    const isChecked = selectedOrderIds.has(order.id);
                    return (
                      <tr
                        key={order.id}
                        className={`hover:bg-gray-50/70 dark:hover:bg-white/[0.02] transition-colors ${
                          isChecked
                            ? "bg-indigo-50/40 dark:bg-indigo-950/20"
                            : ""
                        }`}
                      >
                        <td className="w-10 px-3 py-3.5 text-center">
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={(c) =>
                              handleSelectRow(order.id, Boolean(c))
                            }
                            aria-label={`Select order ${order.id}`}
                          />
                        </td>

                        <td className="px-4 py-3.5 font-semibold text-xs sm:text-sm">
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

                        <td className="px-4 py-3.5">
                          {renderStatusBadge(order.status)}
                        </td>

                        <td className="px-4 py-3.5 text-xs sm:text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                          ${order.spent.toFixed(2)}
                        </td>

                        <td className="w-16 px-4 py-3.5 text-right pr-5">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer"
                              >
                                <MoreVertical className="size-3.5" />
                                <span className="sr-only">Actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="w-36 rounded-xl border-gray-200 dark:border-white/10"
                            >
                              <DropdownMenuItem
                                onClick={() =>
                                  router.push(`/orders/${order.rawId}`)
                                }
                                className="cursor-pointer gap-2 text-xs"
                              >
                                <Eye className="size-3.5 text-gray-500" />
                                <span>View order</span>
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() =>
                                  toast.info(`Editing invoice for ${order.id}`)
                                }
                                className="cursor-pointer gap-2 text-xs"
                              >
                                <Pencil className="size-3.5 text-gray-500" />
                                <span>Edit</span>
                              </DropdownMenuItem>

                              <DropdownMenuSeparator className="dark:bg-white/10" />

                              <DropdownMenuItem
                                onClick={() => setDeleteOrderTarget(order)}
                                className="cursor-pointer gap-2 text-xs text-rose-600 dark:text-rose-400 focus:text-rose-600 dark:focus:text-rose-400"
                              >
                                <Trash2 className="size-3.5" />
                                <span>Delete</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer / Pagination */}
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
                <ChevronLeft className="size-3.5" />
              </Button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => {
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
                }
              )}

              <Button
                variant="outline"
                size="icon"
                disabled={validPage >= totalPages}
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                className="size-7 rounded-lg border-gray-200 dark:border-white/10 bg-white dark:bg-[#181818] text-gray-700 dark:text-gray-300 disabled:opacity-40"
                aria-label="Next page"
              >
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Order Alert Dialog */}
      <AlertDialog
        open={Boolean(deleteOrderTarget)}
        onOpenChange={(o) => !o && setDeleteOrderTarget(null)}
      >
        <AlertDialogContent className="rounded-2xl border-gray-200 dark:border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-gray-900 dark:text-white">
              Delete Order
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Are you sure you want to remove order{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                {deleteOrderTarget?.id}
              </span>{" "}
              from this customer&apos;s history?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl text-xs h-9 px-4">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteOrder}
              className="rounded-xl text-xs h-9 px-4 bg-rose-600 hover:bg-rose-700 text-white font-semibold"
            >
              Delete Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CustomerLayoutFrame>
  );
}
