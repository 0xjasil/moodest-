"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  Gift,
  Star,
  Award,
  ShoppingBag,
  PackageCheck,
  TrendingUp,
  Heart,
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
    id: "#1024",
    rawId: "ORD-1024",
    date: "May 10, 2026",
    status: "Delivered",
    spent: 245.0,
  },
  {
    id: "#1018",
    rawId: "ORD-1018",
    date: "Apr 18, 2026",
    status: "Delivered",
    spent: 310.0,
  },
  {
    id: "#1011",
    rawId: "ORD-1011",
    date: "Mar 22, 2026",
    status: "Delivered",
    spent: 195.0,
  },
  {
    id: "#1005",
    rawId: "ORD-1005",
    date: "Feb 14, 2026",
    status: "Delivered",
    spent: 180.0,
  },
  {
    id: "#1002",
    rawId: "ORD-1002",
    date: "Jan 28, 2026",
    status: "Delivered",
    spent: 270.0,
  },
  {
    id: "#1001",
    rawId: "ORD-1001",
    date: "Jan 15, 2026",
    status: "Delivered",
    spent: 220.0,
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
        {/* The 4 Stat Cards in a 2x2 Grid (Shopify-style D2C Customer Metrics) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 1. Lifetime Spent */}
          <div className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#141414] shadow-xs p-5 space-y-3">
            <div className="size-10 rounded-xl bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex items-center justify-center text-stone-800 dark:text-stone-200 shadow-2xs">
              <ShoppingBag className="size-5" />
            </div>

            <div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                Lifetime Spent
              </h4>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-xl font-bold text-stone-900 dark:text-stone-100">
                  $1,420.00
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Total
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                All-time boutique revenue from customer
              </p>
            </div>
          </div>

          {/* 2. Total Orders */}
          <div className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#141414] shadow-xs p-5 space-y-3">
            <div className="size-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-2xs">
              <PackageCheck className="size-5" />
            </div>

            <div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                Orders Completed
              </h4>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  6
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Orders
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Fulfilled and delivered to customer
              </p>
            </div>
          </div>

          {/* 3. Average Order Value */}
          <div className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#141414] shadow-xs p-5 space-y-3">
            <div className="size-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-2xs">
              <TrendingUp className="size-5" />
            </div>

            <div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                Average Order Value (AOV)
              </h4>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  $236.67
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  / order
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Average abaya purchase per checkout
              </p>
            </div>
          </div>

          {/* 4. Wishlist Saved */}
          <div className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#141414] shadow-xs p-5 space-y-3">
            <div className="size-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-2xs">
              <Heart className="size-5" />
            </div>

            <div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                Saved to Wishlist
              </h4>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-xl font-bold text-rose-600 dark:text-rose-400">
                  4
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Items
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Saved styles from new collections
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
