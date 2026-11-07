import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/**
 * Updates order status and correctly adjusts stock inventory:
 * - If transitioning from a stock-reducing status (PENDING, PAID, SHIPPED, DELIVERED) to a stock-restoring status (CANCELLED, FAILED), we restore the stock.
 * - If transitioning from a stock-restoring status (CANCELLED, FAILED) back to a stock-reducing status, we verify sufficient stock exists, then reduce the stock.
 * - Otherwise (within same category of statuses), no stock adjustment is needed.
 */
export async function updateOrderStatusAndAdjustStock(
  orderId: string,
  newStatus: string,
  include?: Prisma.OrderInclude
) {
  return await prisma.$transaction(async (tx) => {
    // 1. Fetch current order with items and variants
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            variant: true,
          },
        },
      },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    const oldStatus = order.status.toUpperCase();
    const targetStatus = newStatus.toUpperCase();

    const reducingStatuses = ["PENDING", "PAID", "SHIPPED", "DELIVERED"];

    const wasReduced = reducingStatuses.includes(oldStatus);
    const shouldBeReduced = reducingStatuses.includes(targetStatus);

    if (wasReduced && !shouldBeReduced) {
      // Restore (increment) stock
      for (const item of order.items) {
        if (!item.variantId) continue;
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { qty: { increment: item.quantity } },
        });
      }
    } else if (!wasReduced && shouldBeReduced) {
      // Reduce (decrement) stock
      // First validation: check if all variants have enough quantity
      for (const item of order.items) {
        if (!item.variantId) continue;
        if (item.quantity > item.variant.qty) {
          throw new Error(
            `Insufficient stock for item "${item.variant.sku || item.variantId}". Only ${item.variant.qty} units available, but order requires ${item.quantity}.`
          );
        }
      }

      // Decrement stock
      for (const item of order.items) {
        if (!item.variantId) continue;
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { qty: { decrement: item.quantity } },
        });
      }
    }

    // 2. Update order status
    return await tx.order.update({
      where: { id: orderId },
      data: { status: targetStatus },
      include,
    });
  });
}
