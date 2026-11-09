"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Users,
  Package,
  UserPlus,
  UserCheck,
  Search,
  Upload,
  Plus,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  Home,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Download,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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

export interface CustomerItem {
  id: string;
  customerId: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  initials?: string;
  country: string;
  ordersCount: number;
  totalSpent: number;
  status: "Active" | "Inactive" | "Banned";
  addressLine1?: string;
  addressLine2?: string;
  town?: string;
  state?: string;
  postcode?: string;
  createdAt: string;
}

interface BackendRawUser {
  id: number | string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email: string;
  phone?: string;
  avatar?: string;
  country?: string;
  ordersCount?: number;
  totalSpent?: number;
  status?: string;
  addressLine1?: string;
  town?: string;
  state?: string;
  postcode?: string;
  createdAt?: string;
  _count?: { orders?: number };
}

export function CustomerListPage() {
  const router = useRouter();

  // State
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        // Use same-origin proxy to prevent CORS issues
        const res = await fetch(`/api/admin/users?limit=100`).catch(() =>
          fetch(`${API_URL}/admin/users?limit=100`)
        );
        if (res.ok) {
          const json = await res.json();
          const list: BackendRawUser[] = Array.isArray(json) ? json : (json.data || []);
          if (list.length > 0) {
            const mapped: CustomerItem[] = list.map((u: BackendRawUser, idx: number) => {
              const fullName = [u.firstName, u.lastName].filter(Boolean).join(" ") || u.name || u.email;
              return {
                id: String(u.id),
                customerId: `#${100000 + Number(u.id || idx + 1)}`,
                name: fullName,
                email: u.email,
                phone: u.phone || "+971 50 123 4567",
                avatar: u.avatar || undefined,
                country: u.country || "United Arab Emirates",
                ordersCount: u.ordersCount || u._count?.orders || 0,
                totalSpent: u.totalSpent || 0,
                status: "Active",
                addressLine1: u.addressLine1 || "",
                town: u.town || "",
                state: u.state || "",
                postcode: u.postcode || "",
                createdAt: u.createdAt ? u.createdAt.split("T")[0] : new Date().toISOString().split("T")[0],
              };
            });
            setCustomers(mapped);
            return;
          } else {
            setCustomers([]);
            return;
          }
        }
        setCustomers([]);
      } catch (err) {
        console.warn("Could not fetch customers from backend:", err);
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, []);
  const [searchQuery, setSearchQuery] = useState("");
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Slide-over Sheet (Add Customer)
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    email: "",
    mobile: "",
    addressLine1: "",
    addressLine2: "",
    town: "",
    state: "",
    country: "",
    postcode: "",
  });

  // Edit Dialog
  const [editCustomer, setEditCustomer] = useState<CustomerItem | null>(null);

  // Delete Alert
  const [deleteTarget, setDeleteTarget] = useState<CustomerItem | null>(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.customerId.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q)
      );
    });
  }, [customers, searchQuery]);

  // Pagination calculation
  const totalEntries = filteredCustomers.length;
  const totalPages = Math.ceil(totalEntries / pageSize) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedCustomers = useMemo(() => {
    const start = (validCurrentPage - 1) * pageSize;
    return filteredCustomers.slice(start, start + pageSize);
  }, [filteredCustomers, validCurrentPage, pageSize]);

  const startIndex = (validCurrentPage - 1) * pageSize + 1;
  const endIndex = Math.min(validCurrentPage * pageSize, totalEntries);

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(paginatedCustomers.map((c) => c.id));
      setSelectedIds(allIds);
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) {
      next.add(id);
    } else {
      next.delete(id);
    }
    setSelectedIds(next);
  };

  const isAllSelected =
    paginatedCustomers.length > 0 &&
    paginatedCustomers.every((c) => selectedIds.has(c.id));

  // Export to CSV
  const handleExport = () => {
    const listToExport =
      selectedIds.size > 0
        ? customers.filter((c) => selectedIds.has(c.id))
        : filteredCustomers;

    const headers = [
      "Customer ID",
      "Name",
      "Email",
      "Phone",
      "Country",
      "Orders",
      "Total Spent",
      "Status",
    ];
    const rows = listToExport.map((c) => [
      c.customerId,
      `"${c.name.replace(/"/g, '""')}"`,
      c.email,
      c.phone,
      c.country,
      c.ordersCount,
      c.totalSpent.toFixed(2),
      c.status,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `customers_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Exported ${listToExport.length} customers to CSV`);
  };

  // Add Customer submit
  const handleAddCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name.trim() || !addForm.email.trim()) {
      toast.error("Please provide both name and email");
      return;
    }

    const randomId = Math.floor(100000 + Math.random() * 900000);
    const newCustomer: CustomerItem = {
      id: `c-new-${Date.now()}`,
      customerId: `#${randomId}`,
      name: addForm.name.trim(),
      email: addForm.email.trim(),
      phone: addForm.mobile.trim() || "+1 (555) 000-0000",
      initials: addForm.name
        .split(" ")
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
      country: addForm.country.trim() || "United States",
      ordersCount: 0,
      totalSpent: 0.0,
      status: "Active",
      addressLine1: addForm.addressLine1,
      addressLine2: addForm.addressLine2,
      town: addForm.town,
      state: addForm.state,
      postcode: addForm.postcode,
      createdAt: new Date().toISOString().split("T")[0],
    };

    setCustomers((prev) => [newCustomer, ...prev]);
    toast.success(`Customer ${newCustomer.name} created successfully`);
    setIsAddSheetOpen(false);
    setAddForm({
      name: "",
      email: "",
      mobile: "",
      addressLine1: "",
      addressLine2: "",
      town: "",
      state: "",
      country: "",
      postcode: "",
    });
  };

  // Edit Customer submit
  const handleEditCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCustomer) return;

    setCustomers((prev) =>
      prev.map((c) => (c.id === editCustomer.id ? editCustomer : c))
    );
    toast.success(`Customer ${editCustomer.name} updated successfully`);
    setEditCustomer(null);
  };

  // Single Delete
  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    setCustomers((prev) => prev.filter((c) => c.id !== deleteTarget.id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(deleteTarget.id);
      return next;
    });
    toast.success(`Customer ${deleteTarget.name} deleted successfully`);
    setDeleteTarget(null);
  };

  // Bulk Delete
  const handleConfirmBulkDelete = () => {
    setCustomers((prev) => prev.filter((c) => !selectedIds.has(c.id)));
    toast.success(`Deleted ${selectedIds.size} customers`);
    setSelectedIds(new Set());
    setIsBulkDeleteOpen(false);
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
        <span className="text-gray-500 dark:text-gray-400">Customer</span>
        <span>/</span>
        <span className="text-gray-900 dark:text-white font-medium">
          All Customers
        </span>
      </nav>

      {/* 2. Top KPI Summary Quadrant Card */}
      <div className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#141414] shadow-xs p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6">
          {/* Top Left: Total Customers */}
          <div className="flex items-center justify-between pr-0 md:pr-6">
            <div>
              <p className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                15,678
              </p>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">
                Total Customers
              </p>
            </div>
            <div className="size-11 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 flex items-center justify-center text-gray-700 dark:text-gray-300 shadow-2xs">
              <Users className="size-5" />
            </div>
          </div>

          {/* Top Right: Average Order */}
          <div className="flex items-center justify-between md:border-l border-gray-200/70 dark:border-white/10 md:pl-6">
            <div>
              <p className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                $75
              </p>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">
                Average Order
              </p>
            </div>
            <div className="size-11 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 flex items-center justify-center text-gray-700 dark:text-gray-300 shadow-2xs">
              <Package className="size-5" />
            </div>
          </div>

          {/* Divider on MD: bottom rows */}
          {/* Bottom Left: New Customers */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200/70 dark:border-white/10 pr-0 md:pr-6">
            <div>
              <p className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                560
              </p>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">
                New Customers
              </p>
            </div>
            <div className="size-11 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 flex items-center justify-center text-gray-700 dark:text-gray-300 shadow-2xs">
              <UserPlus className="size-5" />
            </div>
          </div>

          {/* Bottom Right: Active Customers */}
          <div className="flex items-center justify-between pt-6 border-t md:border-l border-gray-200/70 dark:border-white/10 md:pl-6">
            <div>
              <p className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                3,432
              </p>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">
                Active Customers
              </p>
            </div>
            <div className="size-11 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 flex items-center justify-center text-gray-700 dark:text-gray-300 shadow-2xs">
              <UserCheck className="size-5" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Customers Datagrid Card */}
      <div className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#141414] shadow-xs overflow-hidden">
        {/* Datagrid Toolbar */}
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-gray-200/70 dark:border-white/10 bg-gray-50/40 dark:bg-white/[0.01]">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search User..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="h-10 pl-10 pr-4 rounded-xl border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#181818] text-xs sm:text-sm placeholder:text-gray-400 focus-visible:ring-indigo-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {/* Action buttons on the right */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            {/* Selected bulk delete trigger */}
            {selectedIds.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsBulkDeleteOpen(true)}
                className="h-10 px-3.5 rounded-xl text-xs font-semibold"
              >
                <Trash2 className="size-3.5 mr-1.5" />
                Delete ({selectedIds.size})
              </Button>
            )}

            {/* Page size select */}
            <Select
              value={String(pageSize)}
              onValueChange={(val) => {
                setPageSize(Number(val));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-10 w-[78px] rounded-xl border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#181818] text-xs sm:text-sm font-medium">
                <SelectValue placeholder="10" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-gray-200 dark:border-white/10">
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>

            {/* Export button */}
            <Button
              variant="outline"
              onClick={handleExport}
              className="h-10 px-4 rounded-xl border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#181818] text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 shadow-2xs gap-1.5"
            >
              <Upload className="size-3.5" />
              <span>Export</span>
            </Button>

            {/* + Add Customer button */}
            <Button
              onClick={() => setIsAddSheetOpen(true)}
              className="h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-xs transition-colors gap-1.5 cursor-pointer"
            >
              <Plus className="size-4" />
              <span>Add Customer</span>
            </Button>
          </div>
        </div>

        {/* Datagrid Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200/70 dark:border-white/10 text-gray-500 dark:text-gray-400 text-xs font-semibold bg-gray-50/50 dark:bg-white/[0.01]">
                <th className="w-10 px-3 py-3.5 text-center">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={(checked) =>
                      handleSelectAll(Boolean(checked))
                    }
                    aria-label="Select all customers"
                  />
                </th>
                <th className="px-3 sm:px-4 py-3.5 font-semibold">Customer</th>
                <th className="px-3 py-3.5 font-semibold whitespace-nowrap">
                  Customer ID
                </th>
                <th className="px-3 py-3.5 font-semibold">Country</th>
                <th className="px-3 py-3.5 font-semibold text-center">Order</th>
                <th className="px-3 py-3.5 font-semibold">Total Spent</th>
                <th className="w-16 px-3 py-3.5 text-right font-semibold pr-4 sm:pr-6">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={`skel-cust-${i}`} className="animate-pulse h-16">
                    <td className="w-10 px-3 py-3.5 text-center"><div className="size-4 mx-auto bg-gray-200 dark:bg-white/10 rounded" /></td>
                    <td className="px-3 sm:px-4 py-3.5"><div className="h-8 w-40 bg-gray-200 dark:bg-white/10 rounded" /></td>
                    <td className="px-3 py-3.5"><div className="h-4 w-20 bg-gray-200 dark:bg-white/10 rounded" /></td>
                    <td className="px-3 py-3.5"><div className="h-4 w-28 bg-gray-200 dark:bg-white/10 rounded" /></td>
                    <td className="px-3 py-3.5 text-center"><div className="h-4 w-12 mx-auto bg-gray-200 dark:bg-white/10 rounded" /></td>
                    <td className="px-3 py-3.5"><div className="h-4 w-16 bg-gray-200 dark:bg-white/10 rounded" /></td>
                    <td className="w-16 px-3 py-3.5 text-right pr-4 sm:pr-6"><div className="h-8 w-8 ml-auto bg-gray-200 dark:bg-white/10 rounded" /></td>
                  </tr>
                ))
              ) : paginatedCustomers.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    No customers found matching &quot;{searchQuery}&quot;.
                  </td>
                </tr>
              ) : (
                paginatedCustomers.map((customer) => {
                  const isChecked = selectedIds.has(customer.id);
                  return (
                    <tr
                      key={customer.id}
                      className={`hover:bg-gray-50/70 dark:hover:bg-white/[0.02] transition-colors ${
                        isChecked
                          ? "bg-indigo-50/40 dark:bg-indigo-950/20"
                          : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="w-10 px-3 py-3.5 text-center">
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={(checked) =>
                            handleSelectRow(customer.id, Boolean(checked))
                          }
                          aria-label={`Select ${customer.name}`}
                        />
                      </td>

                      {/* Customer: Avatar + Name + Email */}
                      <td className="px-3 sm:px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <AvatarWithFallback
                            src={customer.avatar}
                            name={customer.name}
                            size={36}
                            className="size-9 text-xs"
                          />

                          <div className="min-w-0">
                            <Link
                              href={`/customers/${customer.id}`}
                              className="font-semibold text-gray-900 dark:text-white text-sm hover:underline line-clamp-1 cursor-pointer"
                            >
                              {customer.name}
                            </Link>
                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                              {customer.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Customer ID */}
                      <td className="px-3 py-3.5 text-sm font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">
                        {customer.customerId}
                      </td>

                      {/* Country */}
                      <td className="px-3 py-3.5 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        {customer.country}
                      </td>

                      {/* Order Count */}
                      <td className="px-3 py-3.5 text-sm text-gray-700 dark:text-gray-300 font-medium text-center">
                        {customer.ordersCount}
                      </td>

                      {/* Total Spent */}
                      <td className="px-3 py-3.5 text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                        ${customer.totalSpent.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>

                      {/* Actions */}
                      <td className="w-16 px-3 py-3.5 text-right pr-4 sm:pr-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer"
                            >
                              <MoreVertical className="size-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-40 rounded-xl border-gray-200 dark:border-white/10"
                          >
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(`/customers/${customer.id}`)
                              }
                              className="cursor-pointer gap-2 text-xs"
                            >
                              <Eye className="size-3.5 text-gray-500" />
                              <span>View</span>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => setEditCustomer({ ...customer })}
                              className="cursor-pointer gap-2 text-xs"
                            >
                              <Pencil className="size-3.5 text-gray-500" />
                              <span>Edit</span>
                            </DropdownMenuItem>

                            <DropdownMenuSeparator className="dark:bg-white/10" />

                            <DropdownMenuItem
                              onClick={() => setDeleteTarget(customer)}
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

        {/* Datagrid Footer / Pagination */}
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-200/70 dark:border-white/10 bg-gray-50/30 dark:bg-white/[0.01]">
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

          {/* Pagination Navigation */}
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              disabled={validCurrentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="size-8 rounded-lg border-gray-200 dark:border-white/10 bg-white dark:bg-[#181818] text-gray-700 dark:text-gray-300 disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft className="size-4" />
            </Button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              // Show pages: first, last, current, current - 1, current + 1
              if (
                totalPages > 6 &&
                page !== 1 &&
                page !== totalPages &&
                Math.abs(page - validCurrentPage) > 1
              ) {
                if (
                  page === 2 &&
                  validCurrentPage > 3
                ) {
                  return (
                    <span
                      key={page}
                      className="px-1 text-xs text-gray-400 select-none"
                    >
                      ...
                    </span>
                  );
                }
                if (
                  page === totalPages - 1 &&
                  validCurrentPage < totalPages - 2
                ) {
                  return (
                    <span
                      key={page}
                      className="px-1 text-xs text-gray-400 select-none"
                    >
                      ...
                    </span>
                  );
                }
                return null;
              }

              const isActive = page === validCurrentPage;
              return (
                <Button
                  key={page}
                  variant={isActive ? "default" : "outline"}
                  onClick={() => setCurrentPage(page)}
                  className={`size-8 rounded-lg text-xs font-semibold transition-colors ${
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
              disabled={validCurrentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="size-8 rounded-lg border-gray-200 dark:border-white/10 bg-white dark:bg-[#181818] text-gray-700 dark:text-gray-300 disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* 4. Slide-Over Sheet ("Add New Customer") */}
      <Sheet open={isAddSheetOpen} onOpenChange={setIsAddSheetOpen}>
        <SheetContent
          side="right"
          className="sm:max-w-lg w-full p-0 flex flex-col justify-between bg-white dark:bg-[#141414] border-l border-gray-200 dark:border-white/10"
        >
          <div>
            <SheetHeader className="p-6 border-b border-gray-200/80 dark:border-white/10">
              <SheetTitle className="text-lg font-bold text-gray-900 dark:text-white">
                Add New Customer
              </SheetTitle>
              <SheetDescription className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Enter customer profile details and initial shipping address.
              </SheetDescription>
            </SheetHeader>

            {/* Scrollable form body */}
            <form
              id="add-customer-form"
              onSubmit={handleAddCustomerSubmit}
              className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-180px)]"
            >
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Basic Information
                </h3>

                <div className="space-y-1.5">
                  <Label htmlFor="cust-name" className="text-xs font-medium">
                    Name <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="cust-name"
                    required
                    placeholder="John Doe"
                    value={addForm.name}
                    onChange={(e) =>
                      setAddForm({ ...addForm, name: e.target.value })
                    }
                    className="rounded-xl h-10 text-xs sm:text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="cust-email" className="text-xs font-medium">
                    Email <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="cust-email"
                    type="email"
                    required
                    placeholder="john.doe@example.com"
                    value={addForm.email}
                    onChange={(e) =>
                      setAddForm({ ...addForm, email: e.target.value })
                    }
                    className="rounded-xl h-10 text-xs sm:text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="cust-mobile" className="text-xs font-medium">
                    Mobile
                  </Label>
                  <Input
                    id="cust-mobile"
                    placeholder="+(123) 456-7890"
                    value={addForm.mobile}
                    onChange={(e) =>
                      setAddForm({ ...addForm, mobile: e.target.value })
                    }
                    className="rounded-xl h-10 text-xs sm:text-sm"
                  />
                </div>
              </div>

              {/* Shipping Information */}
              <div className="space-y-4 pt-2 border-t border-gray-100 dark:border-white/5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Shipping Information
                </h3>

                <div className="space-y-1.5">
                  <Label htmlFor="cust-addr1" className="text-xs font-medium">
                    Address Line 1
                  </Label>
                  <Input
                    id="cust-addr1"
                    placeholder="45 Roker Terrace"
                    value={addForm.addressLine1}
                    onChange={(e) =>
                      setAddForm({ ...addForm, addressLine1: e.target.value })
                    }
                    className="rounded-xl h-10 text-xs sm:text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="cust-addr2" className="text-xs font-medium">
                    Address Line 2
                  </Label>
                  <Input
                    id="cust-addr2"
                    placeholder="Apartment, studio, or floor"
                    value={addForm.addressLine2}
                    onChange={(e) =>
                      setAddForm({ ...addForm, addressLine2: e.target.value })
                    }
                    className="rounded-xl h-10 text-xs sm:text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="cust-town" className="text-xs font-medium">
                      Town / City
                    </Label>
                    <Input
                      id="cust-town"
                      placeholder="New York"
                      value={addForm.town}
                      onChange={(e) =>
                        setAddForm({ ...addForm, town: e.target.value })
                      }
                      className="rounded-xl h-10 text-xs sm:text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="cust-state" className="text-xs font-medium">
                      State / Province
                    </Label>
                    <Input
                      id="cust-state"
                      placeholder="NY"
                      value={addForm.state}
                      onChange={(e) =>
                        setAddForm({ ...addForm, state: e.target.value })
                      }
                      className="rounded-xl h-10 text-xs sm:text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="cust-country"
                      className="text-xs font-medium"
                    >
                      Country
                    </Label>
                    <Input
                      id="cust-country"
                      placeholder="United States"
                      value={addForm.country}
                      onChange={(e) =>
                        setAddForm({ ...addForm, country: e.target.value })
                      }
                      className="rounded-xl h-10 text-xs sm:text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="cust-postcode"
                      className="text-xs font-medium"
                    >
                      Postcode
                    </Label>
                    <Input
                      id="cust-postcode"
                      placeholder="10001"
                      value={addForm.postcode}
                      onChange={(e) =>
                        setAddForm({ ...addForm, postcode: e.target.value })
                      }
                      className="rounded-xl h-10 text-xs sm:text-sm"
                    />
                  </div>
                </div>
              </div>
            </form>
          </div>

          <SheetFooter className="p-6 border-t border-gray-200/80 dark:border-white/10 flex sm:flex-row items-center justify-end gap-3 bg-gray-50/50 dark:bg-white/[0.02]">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddSheetOpen(false)}
              className="rounded-xl h-10 px-5 text-xs sm:text-sm font-medium"
            >
              Discard
            </Button>
            <Button
              type="submit"
              form="add-customer-form"
              className="rounded-xl h-10 px-5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold"
            >
              Add Customer
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* 5. Edit Customer Dialog */}
      <Dialog
        open={Boolean(editCustomer)}
        onOpenChange={(open) => !open && setEditCustomer(null)}
      >
        <DialogContent className="sm:max-w-md rounded-2xl border-gray-200 dark:border-white/10">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              Edit Customer
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500 dark:text-gray-400">
              Update customer profile details.
            </DialogDescription>
          </DialogHeader>

          {editCustomer && (
            <form
              onSubmit={handleEditCustomerSubmit}
              className="space-y-4 py-2"
            >
              <div className="space-y-1.5">
                <Label htmlFor="edit-name" className="text-xs font-medium">
                  Name
                </Label>
                <Input
                  id="edit-name"
                  value={editCustomer.name}
                  onChange={(e) =>
                    setEditCustomer({ ...editCustomer, name: e.target.value })
                  }
                  className="rounded-xl text-xs sm:text-sm h-10"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-email" className="text-xs font-medium">
                  Email
                </Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editCustomer.email}
                  onChange={(e) =>
                    setEditCustomer({ ...editCustomer, email: e.target.value })
                  }
                  className="rounded-xl text-xs sm:text-sm h-10"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-phone" className="text-xs font-medium">
                    Phone
                  </Label>
                  <Input
                    id="edit-phone"
                    value={editCustomer.phone}
                    onChange={(e) =>
                      setEditCustomer({
                        ...editCustomer,
                        phone: e.target.value,
                      })
                    }
                    className="rounded-xl text-xs sm:text-sm h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-country" className="text-xs font-medium">
                    Country
                  </Label>
                  <Input
                    id="edit-country"
                    value={editCustomer.country}
                    onChange={(e) =>
                      setEditCustomer({
                        ...editCustomer,
                        country: e.target.value,
                      })
                    }
                    className="rounded-xl text-xs sm:text-sm h-10"
                  />
                </div>
              </div>

              <DialogFooter className="pt-4 flex sm:flex-row items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditCustomer(null)}
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
          )}
        </DialogContent>
      </Dialog>

      {/* 6. Single Delete Alert Dialog */}
      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent className="rounded-2xl border-gray-200 dark:border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-gray-900 dark:text-white">
              Delete Customer
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                {deleteTarget?.name}
              </span>{" "}
              ({deleteTarget?.customerId})? This will permanently remove their
              record and order associations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl text-xs h-9 px-4">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="rounded-xl text-xs h-9 px-4 bg-rose-600 hover:bg-rose-700 text-white font-semibold"
            >
              Delete Customer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 7. Bulk Delete Alert Dialog */}
      <AlertDialog
        open={isBulkDeleteOpen}
        onOpenChange={setIsBulkDeleteOpen}
      >
        <AlertDialogContent className="rounded-2xl border-gray-200 dark:border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-gray-900 dark:text-white">
              Delete Selected Customers
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-rose-600 dark:text-rose-400">
                {selectedIds.size}
              </span>{" "}
              selected customers? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl text-xs h-9 px-4">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmBulkDelete}
              className="rounded-xl text-xs h-9 px-4 bg-rose-600 hover:bg-rose-700 text-white font-semibold"
            >
              Delete Selected
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
