"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { updateOrderStatusAndAdjustStock } from "@/lib/order-utils";

/**
 * ✅ Cancel an order (only if still pending/paid)
 */
export async function cancelOrder(orderId: string) {
  try {
    const session = await auth.api.getSession({ headers: await getHeaders() });
    if (!session) throw new Error("Not logged in");

    const user = session.user;

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.userId !== user.id) {
      throw new Error("Unauthorized");
    }

    // 🚫 Block cancellation for shipped/delivered/cancelled
    if (["SHIPPED", "DELIVERED", "CANCELLED"].includes(order.status)) {
      throw new Error("Order cannot be cancelled");
    }

    // ✅ Update status and stock
    const cancelledOrder = await updateOrderStatusAndAdjustStock(orderId, "CANCELLED");

    return {
      success: true,
      order: cancelledOrder,
      message: "Order cancelled successfully",
    };
  } catch (error: unknown) {
    console.error("Cancel order error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to cancel order";
    return { success: false, message: errorMessage };
  }
}

/**
 * Helper: mimic headers() in server actions
 */
async function getHeaders() {
  const { headers } = await import("next/headers");
  return headers();
}