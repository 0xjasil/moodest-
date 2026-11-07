"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Search,
  ArrowUp,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Calendar,
  CheckCheck,
  RotateCcw,
  AlertCircle,
  Home,
  ChevronLeft,
  ChevronRight,
  Filter,
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
import { API_URL } from "@/lib/api-client";
import { AvatarWithFallback } from "@/components/ui/avatar-with-fallback";

export interface CommerceoOrderItem {
  id: string;
  orderNumber: string;
  date: string;
  timestamp: string;
  customer: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  totalAmount: number;
  payment: "Paid" | "Pending" | "Failed" | "Cancelled";
  status: "Delivered" | "Dispatched" | "Out for Delivery" | "Ready to Pickup" | "Cancelled";
  method: {
    type: "paypal" | "mastercard" | "visa" | "cod";
    last4?: string;
    label: string;
  };
}


function PaymentMethodBadge({ method }: { method: CommerceoOrderItem["method"] }) {
  if (method.type === "paypal") {
    return (
      <div className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300 font-medium">
        <div className="size-5 rounded-full bg-[#003087] text-white flex items-center justify-center font-bold text-[10px] shrink-0 shadow-2xs">
          P
        </div>
        <span>...{method.last4 || "6522"}</span>
      </div>
    );
  }
  if (method.type === "mastercard") {
    return (
      <div className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300 font-medium">
        <div className="flex items-center -space-x-1 shrink-0">
          <div className="size-3.5 rounded-full bg-[#EB001B]" />
          <div className="size-3.5 rounded-full bg-[#F79E1B]/90" />
        </div>
        <span>...{method.last4 || "5170"}</span>
      </div>
    );
  }
  if (method.type === "visa") {
    return (
      <div className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300 font-medium">
        <div className="size-5 rounded-md bg-[#1A1F71] text-white flex items-center justify-center font-bold text-[9px] shrink-0 shadow-2xs">
          VISA
        </div>
        <span>...{method.last4 || "7538"}</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300 font-medium">
      <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/10 text-[10px] font-bold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10">
        COD
      </span>
      <span>Cash</span>
    </div>
  );
}

function PaymentStatusBadge({ payment }: { payment: CommerceoOrderItem["payment"] }) {
  switch (payment) {
    case "Paid":
      return (
        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          Paid
        </span>
      );
    case "Pending":
      return (
        <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
          Pending
        </span>
      );
    case "Failed":
      return (
        <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
          Failed
        </span>
      );
    case "Cancelled":
      return (
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
          Cancelled
        </span>
      );
    default:
      return <span className="text-xs font-medium text-gray-500">{payment}</span>;
  }
}

function FulfillmentBadge({ status }: { status: CommerceoOrderItem["status"] }) {
  switch (status) {
    case "Delivered":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
          Delivered
        </span>
      );
    case "Dispatched":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
          Dispatched
        </span>
      );
    case "Out for Delivery":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20">
          Out for Delivery
        </span>
      );
    case "Ready to Pickup":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20">
          Ready to Pickup
        </span>
      );
    case "Cancelled":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-500/10 text-gray-700 dark:text-gray-400 border border-gray-500/20">
          Cancelled
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
          {status}
        </span>
      );
  }
}

// Default realistic sample orders for Moodest Abaya Store
const DEFAULT_ORDERS: CommerceoOrderItem[] = [
  {
    id: "1",
    orderNumber: "#1024",
    date: "May 10, 2026, 2:30 PM",
    timestamp: "2026-05-10T14:30:00.000Z",
    customer: {
      id: "1",
      name: "Fatima Al-Zahra",
      email: "fatima.alzahra@example.com",
    },
    totalAmount: 245.0,
    payment: "Paid",
    status: "Delivered",
    method: { type: "visa", label: "Visa", last4: "4242" },
  },
  {
    id: "2",
    orderNumber: "#1025",
    date: "May 11, 2026, 11:15 AM",
    timestamp: "2026-05-11T11:15:00.000Z",
    customer: {
      id: "2",
      name: "Mariam Noor",
      email: "mariam.noor@example.com",
    },
    totalAmount: 180.0,
    payment: "Paid",
    status: "Dispatched",
    method: { type: "mastercard", label: "MasterCard", last4: "8821" },
  },
  {
    id: "3",
    orderNumber: "#1026",
    date: "May 12, 2026, 4:45 PM",
    timestamp: "2026-05-12T16:45:00.000Z",
    customer: {
      id: "3",
      name: "Aisha Rahman",
      email: "aisha.rahman@example.com",
    },
    totalAmount: 320.0,
    payment: "Pending",
    status: "Out for Delivery",
    method: { type: "cod", label: "Cash on Delivery" },
  },
];

export function CommerceoOrderList() {
  const router = useRouter();
  const [orders, setOrders] = useState<CommerceoOrderItem[]>(DEFAULT_ORDERS);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        // Use same-origin proxy to prevent CORS issues
        const res = await fetch(`/api/admin/orders?limit=100`).catch(() =>
          fetch(`${API_URL}/admin/orders?limit=100`)
        );
        if (res.ok) {
          const json = await res.json();
          const list = Array.isArray(json) ? json : (json.data || []);
          if (list.length > 0) {
            const statusMap: Record<string, CommerceoOrderItem["status"]> = {
              DELIVERED: "Delivered",
              SHIPPED: "Dispatched",
              PROCESSING: "Out for Delivery",
              CONFIRMED: "Ready to Pickup",
              PENDING: "Ready to Pickup",
              CANCELLED: "Cancelled",
            };
            const paymentMap: Record<string, CommerceoOrderItem["payment"]> = {
              DELIVERED: "Paid",
              SHIPPED: "Paid",
              PROCESSING: "Paid",
              CONFIRMED: "Paid",
              PENDING: "Pending",
              CANCELLED: "Cancelled",
            };
            const mapped: CommerceoOrderItem[] = list.map((o: { id: number | string; userId?: number; totalAmount?: number; status: string; createdAt: string; user?: { firstName?: string; lastName?: string; email?: string } }) => {
              const customerName = o.user
                ? [o.user.firstName, o.user.lastName].filter(Boolean).join(" ") || o.user.email
                : `Customer #${o.userId}`;
              return {
                id: String(o.id),
                orderNumber: `#${o.id}`,
                date: new Date(o.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "numeric",
                }),
                timestamp: o.createdAt,
                customer: {
                  id: String(o.userId || o.id),
                  name: customerName,
                  email: o.user?.email || "customer@example.com",
                  avatar: "/images/avatars/1.webp",
                },
                totalAmount: Number(o.totalAmount || 0),
                payment: paymentMap[o.status] || "Pending",
                status: statusMap[o.status] || "Ready to Pickup",
                method: { type: "cod", label: "Razorpay / Online" },
              };
            });
            setOrders(mapped);
            return;
          }
        }
        setOrders(DEFAULT_ORDERS);
      } catch (err) {
        console.warn("Could not fetch orders from backend, using fallback:", err);
        setOrders(DEFAULT_ORDERS);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Dialog states
  const [editingOrder, setEditingOrder] = useState<CommerceoOrderItem | null>(null);
  const [newStatus, setNewStatus] = useState<CommerceoOrderItem["status"]>("Delivered");
  const [newPayment, setNewPayment] = useState<CommerceoOrderItem["payment"]>("Paid");
  const [deletingOrder, setDeletingOrder] = useState<CommerceoOrderItem | null>(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

  // Filtering
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Search
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        order.orderNumber.toLowerCase().includes(q) ||
        order.customer.name.toLowerCase().includes(q) ||
        order.customer.email.toLowerCase().includes(q) ||
        order.status.toLowerCase().includes(q) ||
        order.payment.toLowerCase().includes(q);

      // Status
      const matchStatus =
        statusFilter === "ALL" ||
        order.status.toUpperCase() === statusFilter.toUpperCase();

      // Payment
      const matchPayment =
        paymentFilter === "ALL" ||
        order.payment.toUpperCase() === paymentFilter.toUpperCase();

      return matchSearch && matchStatus && matchPayment;
    });
  }, [orders, searchQuery, statusFilter, paymentFilter]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedOrders = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, safeCurrentPage, pageSize]);

  const startEntry = filteredOrders.length === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endEntry = Math.min(safeCurrentPage * pageSize, filteredOrders.length);

  // Selection
  const isAllSelected =
    paginatedOrders.length > 0 &&
    paginatedOrders.every((order) => selectedIds.includes(order.id));
  const isSomeSelected =
    paginatedOrders.some((order) => selectedIds.includes(order.id)) && !isAllSelected;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      const pageIds = new Set(paginatedOrders.map((o) => o.id));
      setSelectedIds((prev) => prev.filter((id) => !pageIds.has(id)));
    } else {
      const pageIds = paginatedOrders.map((o) => o.id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ["Order", "Date", "Customer Name", "Customer Email", "Payment", "Status", "Amount", "Method"];
    const rows = filteredOrders.map((o) => [
      `"${o.orderNumber}"`,
      `"${o.date}"`,
      `"${o.customer.name.replace(/"/g, '""')}"`,
      `"${o.customer.email}"`,
      `"${o.payment}"`,
      `"${o.status}"`,
      o.totalAmount,
      `"${o.method.label} ${o.method.last4 ? "..." + o.method.last4 : ""}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `orders_export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${filteredOrders.length} orders to CSV`);
  };

  // Status Dialog
  const handleOpenEdit = (order: CommerceoOrderItem) => {
    setEditingOrder(order);
    setNewStatus(order.status);
    setNewPayment(order.payment);
  };

  const handleSaveStatus = async () => {
    if (!editingOrder) return;
    try {
      const backendStatus =
        newStatus === "Delivered" ? "DELIVERED"
        : newStatus === "Dispatched" ? "SHIPPED"
        : newStatus === "Out for Delivery" ? "PROCESSING"
        : newStatus === "Cancelled" ? "CANCELLED"
        : "CONFIRMED";
      const res = await fetch(`/api/orders/admin/${editingOrder.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: backendStatus }),
      }).catch(() =>
        fetch(`${API_URL}/orders/admin/${editingOrder.id}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: backendStatus }),
        })
      );
      if (res.ok) {
        toast.success(`Order ${editingOrder.orderNumber} status updated`);
      } else {
        toast.error("Failed to update status on server");
      }
    } catch {
      toast.error("Network error updating order status");
    }
    setOrders((prev) =>
      prev.map((o) =>
        o.id === editingOrder.id ? { ...o, status: newStatus, payment: newPayment } : o
      )
    );
    setEditingOrder(null);
  };

  // Delete
  const handleDeleteConfirm = () => {
    if (!deletingOrder) return;
    setOrders((prev) => prev.filter((o) => o.id !== deletingOrder.id));
    setSelectedIds((prev) => prev.filter((id) => id !== deletingOrder.id));
    toast.success(`Order ${deletingOrder.orderNumber} deleted`);
    setDeletingOrder(null);
  };

  const handleBulkDelete = () => {
    setOrders((prev) => prev.filter((o) => !selectedIds.includes(o.id)));
    toast.success(`${selectedIds.length} orders deleted`);
    setSelectedIds([]);
    setIsBulkDeleteOpen(false);
  };

  return (
    <div className="flex flex-1 flex-col space-y-6">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        <Link
          href="/"
          className="hover:text-gray-900 dark:hover:text-gray-100 flex items-center gap-1 transition-colors"
          title="Home"
        >
          <Home className="size-3.5" />
        </Link>
        <span>/</span>
        <span className="text-gray-500 dark:text-gray-400">Order</span>
        <span>/</span>
        <span className="text-gray-900 dark:text-white font-medium">Order List</span>
      </nav>

      {/* Page Title & Subtitle */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Order List
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          Manage customer orders, track payments, fulfillment status, and delivery logistics.
        </p>
      </div>

      {/* 1. Four Metric KPI Cards in our color theme */}
      <div className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#141414] p-5 sm:p-6 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-gray-200/70 dark:divide-white/10">
          {/* KPI 1: Pending Payment */}
          <div className="flex items-start justify-between sm:pr-6">
            <div className="space-y-1">
              <p className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                56
              </p>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                Pending Payment
              </p>
            </div>
            <div className="flex size-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-2xs">
              <Calendar className="size-5" />
            </div>
          </div>

          {/* KPI 2: Completed */}
          <div className="flex items-start justify-between pt-4 sm:pt-0 sm:px-6">
            <div className="space-y-1">
              <p className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                12,689
              </p>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                Completed
              </p>
            </div>
            <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-2xs">
              <CheckCheck className="size-5" />
            </div>
          </div>

          {/* KPI 3: Refunded */}
          <div className="flex items-start justify-between pt-4 sm:pt-0 sm:px-6">
            <div className="space-y-1">
              <p className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                124
              </p>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                Refunded
              </p>
            </div>
            <div className="flex size-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 shadow-2xs">
              <RotateCcw className="size-5" />
            </div>
          </div>

          {/* KPI 4: Failed */}
          <div className="flex items-start justify-between pt-4 sm:pt-0 sm:pl-6">
            <div className="space-y-1">
              <p className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                32
              </p>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                Failed
              </p>
            </div>
            <div className="flex size-11 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 shadow-2xs">
              <AlertCircle className="size-5" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Orders Table Card */}
      <div className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#141414] shadow-xs overflow-hidden">
        {/* Action Toolbar */}
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-gray-200/70 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02]">
          {/* Search Input */}
          <div className="flex items-center gap-3 flex-1">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search User or order..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 h-10 bg-white dark:bg-[#181818] border-gray-200 dark:border-white/10 rounded-xl text-sm shadow-2xs focus-visible:ring-indigo-500"
              />
            </div>

            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 px-3 py-1.5 rounded-xl text-xs font-medium text-indigo-700 dark:text-indigo-300 animate-in fade-in">
                <span>{selectedIds.length} selected</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsBulkDeleteOpen(true)}
                  className="h-6 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs"
                >
                  Delete Selected
                </Button>
              </div>
            )}
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            {/* Status Filter */}
            <Select
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-10 w-36 bg-white dark:bg-[#181818] border-gray-200 dark:border-white/10 rounded-xl text-xs font-medium">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="DELIVERED">Delivered</SelectItem>
                <SelectItem value="DISPATCHED">Dispatched</SelectItem>
                <SelectItem value="OUT FOR DELIVERY">Out for Delivery</SelectItem>
                <SelectItem value="READY TO PICKUP">Ready to Pickup</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            {/* Page Size */}
            <Select
              value={pageSize.toString()}
              onValueChange={(val) => {
                setPageSize(Number(val));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-10 w-20 bg-white dark:bg-[#181818] border-gray-200 dark:border-white/10 rounded-xl text-xs font-medium">
                <SelectValue placeholder="10" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>

            {/* Export Button matching reference: "↑ Export" */}
            <Button
              variant="outline"
              onClick={handleExportCSV}
              className="h-10 gap-1.5 px-4 rounded-xl border-gray-200 dark:border-white/10 bg-white dark:bg-[#181818] text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 font-medium text-xs shadow-2xs"
            >
              <ArrowUp className="size-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Table Container */}
        <div className="relative w-full overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-gray-200/70 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] h-12 text-gray-500 dark:text-gray-400 text-xs font-semibold">
                <th className="w-12 px-4 sm:px-6 align-middle">
                  <Checkbox
                    checked={Boolean(isAllSelected || isSomeSelected)}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all"
                  />
                </th>
                <th className="px-4 py-3 align-middle font-semibold min-w-[100px]">
                  Order
                </th>
                <th className="px-4 py-3 align-middle font-semibold min-w-[170px]">
                  Date
                </th>
                <th className="px-4 py-3 align-middle font-semibold min-w-[240px]">
                  Customers
                </th>
                <th className="px-4 py-3 align-middle font-semibold min-w-[110px]">
                  Payment
                </th>
                <th className="px-4 py-3 align-middle font-semibold min-w-[140px]">
                  Status
                </th>
                <th className="px-4 py-3 align-middle font-semibold min-w-[130px]">
                  Method
                </th>
                <th className="px-4 sm:px-6 py-3 align-middle font-semibold text-right w-20">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    No orders found matching your search or filters.
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => {
                  const isSelected = selectedIds.includes(order.id);
                  return (
                    <tr
                      key={order.id}
                      className={`hover:bg-gray-50/70 dark:hover:bg-white/[0.02] transition-colors h-16 ${
                        isSelected ? "bg-indigo-50/30 dark:bg-indigo-500/[0.05]" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="px-4 sm:px-6 align-middle">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelectOne(order.id)}
                          aria-label={`Select ${order.orderNumber}`}
                        />
                      </td>

                      {/* Order Number Link */}
                      <td className="px-4 py-3 align-middle">
                        <Link
                          href={`/orders/${order.id}`}
                          className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline text-sm"
                        >
                          {order.orderNumber}
                        </Link>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3 align-middle text-sm text-gray-700 dark:text-gray-300">
                        {order.date}
                      </td>

                      {/* Customer info */}
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center gap-3">
                          <AvatarWithFallback
                            src={order.customer.avatar}
                            name={order.customer.name}
                            size={36}
                            className="size-9 text-xs"
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm leading-tight truncate">
                              {order.customer.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight mt-0.5 truncate max-w-[180px]">
                              {order.customer.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Payment */}
                      <td className="px-4 py-3 align-middle">
                        <PaymentStatusBadge payment={order.payment} />
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 align-middle">
                        <FulfillmentBadge status={order.status} />
                      </td>

                      {/* Method */}
                      <td className="px-4 py-3 align-middle">
                        <PaymentMethodBadge method={order.method} />
                      </td>

                      {/* Actions */}
                      <td className="px-4 sm:px-6 py-3 align-middle text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 rounded-lg"
                              aria-label="Row actions"
                            >
                              <MoreVertical className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40 rounded-xl shadow-md border-gray-200/80 dark:border-white/10">
                            <DropdownMenuItem
                              onClick={() => router.push(`/orders/${order.id}`)}
                              className="cursor-pointer gap-2"
                            >
                              <Eye className="size-4 text-gray-500" />
                              <span>View Details</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleOpenEdit(order)}
                              className="cursor-pointer gap-2"
                            >
                              <Edit className="size-4 text-indigo-600 dark:text-indigo-400" />
                              <span>Update Status</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeletingOrder(order)}
                              className="cursor-pointer gap-2 text-rose-600 focus:text-rose-600"
                            >
                              <Trash2 className="size-4" />
                              <span>Delete Order</span>
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

        {/* Pagination Footer */}
        <div className="p-4 sm:p-5 border-t border-gray-200/70 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400 bg-gray-50/30 dark:bg-white/[0.01]">
          <div>
            Showing <span className="font-medium text-gray-900 dark:text-white">{startEntry}</span> to{" "}
            <span className="font-medium text-gray-900 dark:text-white">{endEntry}</span> of{" "}
            <span className="font-medium text-gray-900 dark:text-white">{filteredOrders.length}</span> entries
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              disabled={safeCurrentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="size-8 rounded-lg p-0 border-gray-200 dark:border-white/10"
              aria-label="Previous page"
            >
              <ChevronLeft className="size-4" />
            </Button>

            {Array.from({ length: totalPages }).map((_, idx) => {
              const pageNum = idx + 1;
              const isActive = pageNum === safeCurrentPage;
              return (
                <Button
                  key={pageNum}
                  variant={isActive ? "default" : "outline"}
                  size="icon"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`size-8 rounded-lg text-xs font-semibold p-0 ${
                    isActive
                      ? "bg-indigo-600 text-white hover:bg-indigo-700 border-indigo-600 shadow-xs"
                      : "text-gray-700 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5"
                  }`}
                >
                  {pageNum}
                </Button>
              );
            })}

            <Button
              variant="outline"
              size="icon"
              disabled={safeCurrentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="size-8 rounded-lg p-0 border-gray-200 dark:border-white/10"
              aria-label="Next page"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Edit Status Dialog */}
      <Dialog open={Boolean(editingOrder)} onOpenChange={(open) => !open && setEditingOrder(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl border-gray-200 dark:border-white/10">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              Update Order {editingOrder?.orderNumber}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Modify the payment and fulfillment status for customer {editingOrder?.customer.name}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Fulfillment Status
              </label>
              <Select
                value={newStatus}
                onValueChange={(val) => setNewStatus(val as CommerceoOrderItem["status"])}
              >
                <SelectTrigger className="w-full h-10 rounded-xl text-sm bg-white dark:bg-[#181818] border-gray-200 dark:border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Delivered">Delivered</SelectItem>
                  <SelectItem value="Dispatched">Dispatched</SelectItem>
                  <SelectItem value="Out for Delivery">Out for Delivery</SelectItem>
                  <SelectItem value="Ready to Pickup">Ready to Pickup</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Payment Status
              </label>
              <Select
                value={newPayment}
                onValueChange={(val) => setNewPayment(val as CommerceoOrderItem["payment"])}
              >
                <SelectTrigger className="w-full h-10 rounded-xl text-sm bg-white dark:bg-[#181818] border-gray-200 dark:border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Failed">Failed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setEditingOrder(null)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveStatus}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Single Order Confirmation */}
      <AlertDialog
        open={Boolean(deletingOrder)}
        onOpenChange={(open) => !open && setDeletingOrder(null)}
      >
        <AlertDialogContent className="rounded-2xl border-gray-200 dark:border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Order {deletingOrder?.orderNumber}?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this order for customer {deletingOrder?.customer.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-rose-600 text-white hover:bg-rose-700 rounded-xl"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Alert Dialog */}
      <AlertDialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
        <AlertDialogContent className="rounded-2xl border-gray-200 dark:border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Orders</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedIds.length} orders? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-rose-600 text-white hover:bg-rose-700 rounded-xl"
            >
              Delete All Selected
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
