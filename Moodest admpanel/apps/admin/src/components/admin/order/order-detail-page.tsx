"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Home,
  ChevronRight,
  ShoppingCart,
  CreditCard,
  Edit2,
  Trash2,
  Check,
  CheckCircle2,
  Clock,
  Truck,
  Package,
  AlertCircle,
  MapPin,
  Mail,
  Phone,
} from "lucide-react";
import { OrderDetailed, OrderItem } from "@/types/order";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { apiFetch } from "@/lib/apiFetch";

interface OrderDetailProps {
  order: OrderDetailed;
}

export default function OrderDetail({ order: initialOrder }: OrderDetailProps) {
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetailed>(initialOrder);

  // Dialog states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editSection, setEditSection] = useState<"contact" | "shipping" | "billing" | "status" | null>(null);

  // Form states for edits
  const [customerName, setCustomerName] = useState(order.user?.name || "Sophia Carter");
  const [customerEmail, setCustomerEmail] = useState(order.user?.email || "sophia.carter@example.com");
  const [customerPhone, setCustomerPhone] = useState(order.phoneNumber || "+1 555-0149");

  const [shippingStreet, setShippingStreet] = useState(order.street || "742 Evergreen Terrace");
  const [shippingCity, setShippingCity] = useState(order.city || "Springfield");
  const [shippingState, setShippingState] = useState(order.state || "OR");
  const [shippingPincode, setShippingPincode] = useState(order.pincode || "97477");

  const [orderStatus, setOrderStatus] = useState(order.status || "DELIVERED");

  // Real order items mapping without fake items fallback
  const displayItems: Array<{
    id: string;
    name: string;
    attribute: string;
    image: string;
    price: number;
    qty: number;
    total: number;
  }> = order.items && order.items.length > 0
    ? order.items.map((item, idx) => ({
        id: String(item.id || `item-${idx}`),
        name: item.variant?.product?.name || `Product Item #${idx + 1}`,
        attribute: item.variant?.options?.map((o: { attribute?: { name?: string }; attributeValue?: { value?: string } }) => `${o.attribute?.name || "Option"}: ${o.attributeValue?.value || ""}`).join(", ") || (item.variant?.sku ? `SKU: ${item.variant.sku}` : "Standard"),
        image: item.variant?.product?.image?.startsWith("http")
          ? item.variant.product.image
          : `/images/ecommerce-products/product-${(idx % 16) + 1}.webp`,
        price: item.price || 0,
        qty: item.quantity || 1,
        total: (item.price || 0) * (item.quantity || 1),
      }))
    : [];

  const subtotal = displayItems.reduce((acc, item) => acc + item.total, 0) || Number(order.totalAmount || 0);
  const discount = ((order as unknown as Record<string, unknown>).discount as number) || 0;
  const tax = ((order as unknown as Record<string, unknown>).tax as number) || 0;
  const grandTotal = Number(order.totalAmount || (subtotal - discount + tax));

  const formattedDate = new Date(order.createdAt || Date.now()).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleCancelOrder = async () => {
    try {
      const res = await apiFetch(`/admin/orders/${order.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to cancel order");
      }
      setOrder((prev) => ({ ...prev, status: "CANCELLED" }));
      setOrderStatus("CANCELLED");
      toast.success(`Order #${order.id} marked as CANCELLED`);
      setIsDeleteDialogOpen(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel order");
    }
  };

  const handleDownloadInvoice = async () => {
    try {
      toast.loading("Generating order invoice PDF...", { id: "invoice" });
      const res = await apiFetch(`/invoices/${order.id}`);
      if (!res.ok) throw new Error("Invoice generation failed on server");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-order-${order.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      toast.success("Invoice PDF downloaded successfully", { id: "invoice" });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to download invoice", { id: "invoice" });
    }
  };

  const handleSaveContact = () => {
    toast.info("Customer contact details are locked to the placed order invoice for audit integrity.");
    setEditSection(null);
  };

  const handleSaveShipping = () => {
    toast.info("Shipping address is locked to the placed order invoice for courier routing integrity.");
    setEditSection(null);
  };

  const handleSaveStatus = async () => {
    try {
      const res = await apiFetch(`/admin/orders/${order.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: orderStatus }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to update status");
      }
      setOrder((prev) => ({ ...prev, status: orderStatus }));
      toast.success(`Order status updated to ${orderStatus}`);
      setEditSection(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update order status");
    }
  };

  // Timeline events based on status
  const isDelivered = order.status?.toUpperCase() === "DELIVERED";
  const isShipped = order.status?.toUpperCase() === "SHIPPED" || order.status?.toUpperCase() === "DISPATCHED" || isDelivered;

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
        <Link
          href="/orders"
          className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
        >
          Order
        </Link>
        <span>/</span>
        <span className="text-gray-900 dark:text-white font-medium">Order Details</span>
      </nav>

      {/* Top Header: Order ID, Status Badges & Delete Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Order #{order.id}
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
              Paid
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20">
              {order.status || "Ready to Pickup"}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            {formattedDate} (ET)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setEditSection("status")}
            className="h-10 px-4 rounded-xl border-gray-200 dark:border-white/10 bg-white dark:bg-[#181818] text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 shadow-2xs"
          >
            Update Status
          </Button>

          <Button
            onClick={() => setIsDeleteDialogOpen(true)}
            disabled={order.status === "CANCELLED"}
            className="h-10 px-4 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 dark:hover:bg-rose-950/60 border border-rose-200/80 dark:border-rose-900/30 rounded-xl text-xs sm:text-sm font-semibold shadow-2xs transition-colors disabled:opacity-50"
          >
            {order.status === "CANCELLED" ? "Order Cancelled" : "Cancel Order"}
          </Button>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Order Details & Shipping Activity */}
        <div className="space-y-6 lg:col-span-2">
          {/* Card 1: Order details Items Table */}
          <div className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#141414] shadow-xs overflow-hidden">
            <div className="p-5 sm:p-6 flex items-center justify-between border-b border-gray-200/70 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02]">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                Order details
              </h2>
              <button
                type="button"
                onClick={handleDownloadInvoice}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                Download Invoice
              </button>
            </div>

            {/* Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-gray-200/70 dark:border-white/10 text-gray-500 dark:text-gray-400 text-xs font-semibold bg-gray-50/30 dark:bg-white/[0.01]">
                    <th className="px-5 sm:px-6 py-3.5">Product</th>
                    <th className="px-4 py-3.5 text-right">Price</th>
                    <th className="px-4 py-3.5 text-center">Qty</th>
                    <th className="px-5 sm:px-6 py-3.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {displayItems.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50/70 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-5 sm:px-6 py-4">
                        <div className="flex items-center gap-3.5">
                          <div className="size-11 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 flex items-center justify-center p-1 shrink-0 overflow-hidden shadow-2xs">
                            <Image
                              src={item.image}
                              alt={item.name}
                              width={44}
                              height={44}
                              className="size-full object-contain aspect-square"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-1">
                              {item.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                              {item.attribute}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-gray-200 text-right whitespace-nowrap">
                        ${item.price.toLocaleString()}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300 text-center font-medium whitespace-nowrap">
                        {item.qty}
                      </td>
                      <td className="px-5 sm:px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white text-right whitespace-nowrap">
                        ${item.total.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pricing Summary */}
            <div className="p-5 sm:p-6 border-t border-gray-200/70 dark:border-white/10 flex flex-col items-end space-y-2 bg-gray-50/30 dark:bg-white/[0.01]">
              <div className="w-full sm:w-64 space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between text-gray-500 dark:text-gray-400">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    ${subtotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-gray-500 dark:text-gray-400">
                  <span>Discount:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    -${discount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-gray-500 dark:text-gray-400">
                  <span>Tax:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    ${tax.toLocaleString()}
                  </span>
                </div>
                <div className="border-t border-gray-200 dark:border-white/10 pt-2 flex justify-between text-base font-bold text-gray-900 dark:text-white">
                  <span>Total:</span>
                  <span>${grandTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Shipping activity Timeline */}
          <div className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#141414] shadow-xs p-5 sm:p-6">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-6">
              Shipping activity
            </h2>

            <div className="relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200 dark:before:bg-white/10">
              {/* Node 1: Order Placed */}
              <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                <div className="absolute -left-6 top-1 size-3.5 rounded-full bg-indigo-600 ring-4 ring-indigo-50 dark:ring-indigo-950/40" />
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    Order was placed (Order ID: #{order.id})
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Your order has been placed successfully
                  </p>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  Tuesday 11:29 AM
                </span>
              </div>

              {/* Node 2: Pick-up */}
              <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                <div className="absolute -left-6 top-1 size-3.5 rounded-full bg-indigo-600 ring-4 ring-indigo-50 dark:ring-indigo-950/40" />
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    Pick-up
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Pick-up scheduled with courier
                  </p>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  Wednesday 11:29 AM
                </span>
              </div>

              {/* Node 3: Dispatched */}
              <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                <div className={`absolute -left-6 top-1 size-3.5 rounded-full ${isShipped ? "bg-indigo-600 ring-4 ring-indigo-50 dark:ring-indigo-950/40" : "bg-gray-300 dark:bg-white/20"}`} />
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    Dispatched
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Item has been picked up by courier
                  </p>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  Thursday 11:29 AM
                </span>
              </div>

              {/* Node 4: Package arrived */}
              <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                <div className={`absolute -left-6 top-1 size-3.5 rounded-full ${isShipped ? "bg-indigo-600 ring-4 ring-indigo-50 dark:ring-indigo-950/40" : "bg-gray-300 dark:bg-white/20"}`} />
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    Package arrived
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Package arrived at an Amazon facility, NY
                  </p>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  Saturday 15:20 AM
                </span>
              </div>

              {/* Node 5: Dispatched for delivery */}
              <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                <div className={`absolute -left-6 top-1 size-3.5 rounded-full ${isDelivered ? "bg-indigo-600 ring-4 ring-indigo-50 dark:ring-indigo-950/40" : "bg-gray-300 dark:bg-white/20"}`} />
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    Dispatched for delivery
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Package has left an Amazon facility, NY
                  </p>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  Today 14:12 PM
                </span>
              </div>

              {/* Node 6: Delivery */}
              <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                <div className={`absolute -left-6 top-1 size-3.5 rounded-full ${isDelivered ? "bg-emerald-600 ring-4 ring-emerald-50 dark:ring-emerald-950/40" : "bg-gray-300 dark:bg-white/20"}`} />
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    Delivery
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {isDelivered
                      ? "Package was delivered directly to customer"
                      : "Package will be delivered by tomorrow"}
                  </p>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {isDelivered ? "Completed" : "Estimated Tomorrow"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Customer, Shipping & Billing Details */}
        <div className="space-y-6">
          {/* Card 3: Customer Details */}
          <div className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#141414] shadow-xs p-5 sm:p-6 space-y-5">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
              Customer Details
            </h2>

            {/* Profile Row */}
            <div className="flex items-center gap-3.5">
              <div className="size-12 rounded-full overflow-hidden border border-gray-200/80 dark:border-white/10 bg-gray-100 dark:bg-white/5 shrink-0 shadow-2xs">
                <Image
                  src="/images/avatars/1.webp"
                  alt={customerName}
                  width={48}
                  height={48}
                  className="size-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-gray-900 dark:text-white text-base truncate">
                  {customerName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Customer ID: #{order.userId || "58909"}
                </p>
              </div>
            </div>

            {/* Orders Badge */}
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/10 text-xs font-semibold text-gray-700 dark:text-gray-300">
              <div className="size-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <ShoppingCart className="size-3.5" />
              </div>
              <span>12 orders</span>
            </div>

            {/* Contact Info */}
            <div className="pt-2 border-t border-gray-100 dark:border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Contact info
                </span>
                <button
                  type="button"
                  onClick={() => setEditSection("contact")}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Edit
                </button>
              </div>
              <div className="text-xs sm:text-sm space-y-1 text-gray-600 dark:text-gray-300">
                <p className="truncate">Email: {customerEmail}</p>
                <p>Mobile: {customerPhone}</p>
              </div>
            </div>
          </div>

          {/* Card 4: Shipping Address */}
          <div className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#141414] shadow-xs p-5 sm:p-6 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                Shipping Address
              </h2>
              <button
                type="button"
                onClick={() => setEditSection("shipping")}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                Edit
              </button>
            </div>

            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 space-y-1 leading-relaxed">
              <p>{shippingStreet}</p>
              <p>{shippingCity}</p>
              <p>{shippingPincode}, {shippingState}</p>
              <p>United States</p>
            </div>
          </div>

          {/* Card 5: Billing Address */}
          <div className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#141414] shadow-xs p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                Billing address
              </h2>
              <button
                type="button"
                onClick={() => setEditSection("shipping")}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                Edit
              </button>
            </div>

            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 space-y-1 leading-relaxed">
              <p>{shippingStreet}</p>
              <p>{shippingCity}</p>
              <p>{shippingPincode}, {shippingState}</p>
              <p>United States</p>
            </div>

            {/* Payment Method Card */}
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/[0.02] border border-gray-200/80 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CreditCard className="size-5 text-indigo-600 dark:text-indigo-400" />
                <div>
                  <p className="text-xs font-semibold text-gray-900 dark:text-white">
                    Mastercard
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Card Number: ******4291
                  </p>
                </div>
              </div>
              <div className="flex items-center -space-x-1 shrink-0">
                <div className="size-3.5 rounded-full bg-[#EB001B]" />
                <div className="size-3.5 rounded-full bg-[#F79E1B]/90" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Contact Dialog */}
      <Dialog open={editSection === "contact"} onOpenChange={(o) => !o && setEditSection(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl border-gray-200 dark:border-white/10">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Edit Contact Info</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Update the customer name, email and phone number for this order.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Customer Name
              </label>
              <Input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="h-10 rounded-xl text-sm bg-white dark:bg-[#181818] border-gray-200 dark:border-white/10"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Email Address
              </label>
              <Input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="h-10 rounded-xl text-sm bg-white dark:bg-[#181818] border-gray-200 dark:border-white/10"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Phone Number
              </label>
              <Input
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="h-10 rounded-xl text-sm bg-white dark:bg-[#181818] border-gray-200 dark:border-white/10"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditSection(null)} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={handleSaveContact} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Shipping Dialog */}
      <Dialog open={editSection === "shipping"} onOpenChange={(o) => !o && setEditSection(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl border-gray-200 dark:border-white/10">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Edit Shipping Address</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Update street, city, state and postal code for delivery.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Street Address
              </label>
              <Input
                value={shippingStreet}
                onChange={(e) => setShippingStreet(e.target.value)}
                className="h-10 rounded-xl text-sm bg-white dark:bg-[#181818] border-gray-200 dark:border-white/10"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  City
                </label>
                <Input
                  value={shippingCity}
                  onChange={(e) => setShippingCity(e.target.value)}
                  className="h-10 rounded-xl text-sm bg-white dark:bg-[#181818] border-gray-200 dark:border-white/10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  State / Region
                </label>
                <Input
                  value={shippingState}
                  onChange={(e) => setShippingState(e.target.value)}
                  className="h-10 rounded-xl text-sm bg-white dark:bg-[#181818] border-gray-200 dark:border-white/10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Pincode / Postal Code
              </label>
              <Input
                value={shippingPincode}
                onChange={(e) => setShippingPincode(e.target.value)}
                className="h-10 rounded-xl text-sm bg-white dark:bg-[#181818] border-gray-200 dark:border-white/10"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditSection(null)} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={handleSaveShipping} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs">
              Save Address
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={editSection === "status"} onOpenChange={(o) => !o && setEditSection(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl border-gray-200 dark:border-white/10">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Update Order Status</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Change the fulfillment status for order #{order.id}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Status
              </label>
              <Select value={orderStatus} onValueChange={setOrderStatus}>
                <SelectTrigger className="w-full h-10 rounded-xl text-sm bg-white dark:bg-[#181818] border-gray-200 dark:border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="DISPATCHED">Dispatched</SelectItem>
                  <SelectItem value="SHIPPED">Shipped</SelectItem>
                  <SelectItem value="DELIVERED">Delivered</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditSection(null)} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={handleSaveStatus} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs">
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Order Confirmation Alert Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl border-gray-200 dark:border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Order #{order.id}?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this order? This will mark the order as CANCELLED in the system and release reserved inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Close</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelOrder}
              className="bg-rose-600 text-white hover:bg-rose-700 rounded-xl"
            >
              Cancel Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
