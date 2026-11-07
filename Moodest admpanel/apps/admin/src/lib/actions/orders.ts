"use server";

import { revalidatePath } from "next/cache";
import { serverFetch } from "@/lib/api";

const VALID_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "RETURN_REQUESTED",
  "RETURNED",
  "REFUNDED",
] as const;

type OrderStatus = typeof VALID_STATUSES[number];

export async function updateOrderStatus(id: number, status: OrderStatus) {
  const result = await serverFetch<{ id: number; status: string }>(
    `/orders/admin/${id}/status`,
    {
      method: "PATCH",
      body: { status },
    }
  );
  revalidatePath("/orders");
  revalidatePath(`/orders/${id}`);
  return result;
}

export async function refundOrderItem(
  orderId: number,
  itemId: number,
  reason?: string
) {
  const result = await serverFetch(
    `/orders/admin/${orderId}/items/${itemId}/refund`,
    {
      method: "PATCH",
      body: reason ? { reason } : {},
    }
  );
  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
  return result;
}
