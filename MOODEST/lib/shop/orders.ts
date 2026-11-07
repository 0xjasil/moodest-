import type { Order, OrderStatus } from "@/lib/types";

export interface CreateOrderInput {
  items: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
    size?: string;
    image?: string;
  }>;
  shippingAddress: {
    fullName: string;
    phone: string;
    line1: string;
    line2?: string | null;
    city: string;
    state: string;
    pincode: string;
  };
  paymentMethod: "RAZORPAY" | "COD" | "WALLET";
  totalAmount: number;
  subtotal: number;
  discount?: number;
  shippingFee?: number;
}

export function generateOrderNumber(): string {
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `MS-${dateStr}-${randomSuffix}`;
}

export function getOrderStatusLabel(status: OrderStatus): {
  label: string;
  colorClass: string;
} {
  switch (status) {
    case "PENDING":
      return { label: "Payment Pending", colorClass: "bg-amber-100 text-amber-800" };
    case "CONFIRMED":
      return { label: "Order Confirmed", colorClass: "bg-blue-100 text-blue-800" };
    case "SHIPPED":
      return { label: "Dispatched", colorClass: "bg-purple-100 text-purple-800" };
    case "DELIVERED":
      return { label: "Delivered", colorClass: "bg-emerald-100 text-emerald-800" };
    case "CANCELLED":
      return { label: "Cancelled", colorClass: "bg-rose-100 text-rose-800" };
    default:
      return { label: status, colorClass: "bg-gray-100 text-gray-800" };
  }
}

