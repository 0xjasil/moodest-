import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { updateOrderStatusAndAdjustStock } from "@/lib/order-utils";

// Get single order by ID
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: orderId } = await context.params;

    // Fetch the single order by ID
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            variant: {
              select: {
                id: true,
                images: true,
                product: { 
                  select: { 
                    id: true, 
                    name: true, 
                    image: true 
                  } 
                },
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Check if order belongs to user (by userId or matching email) or if user is admin
    const isOwner =
      order.userId === session.user.id ||
      (session.user.email && order.email === session.user.email) ||
      session.user.role === "admin";

    if (!isOwner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json(order);
  } catch (err) {
    console.error("Fetch order error:", err);
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}

// Cancel an order (before delivery)
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: orderId } = await context.params;

    // Check if order exists and belongs to user
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const isCancelAllowed =
      order.userId === session.user.id ||
      (session.user.email && order.email === session.user.email) ||
      session.user.role === "admin";

    if (!isCancelAllowed) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Allow cancellation only before shipping (PENDING or PROCESSING)
    if (["SHIPPED", "DELIVERED"].includes(order.status.toUpperCase())) {
      return NextResponse.json(
        { error: "Order has already been shipped or delivered. Cannot cancel." },
        { status: 400 }
      );
    }

    if (order.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Order is already cancelled." },
        { status: 400 }
      );
    }

    // Update status to CANCELLED and restore stock
    const cancelledOrder = await updateOrderStatusAndAdjustStock(orderId, "CANCELLED", {
      items: {
        include: {
          variant: {
            include: {
              product: { select: { id: true, name: true, image: true } },
            },
          },
        },
      },
    });

    return NextResponse.json({ success: true, order: cancelledOrder });
  } catch (err) {
    console.error("Cancel order error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to cancel order" },
      { status: 500 }
    );
  }
}