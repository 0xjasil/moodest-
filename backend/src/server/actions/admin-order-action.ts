"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { orderStatusSchema } from "@/schema/order-schema";
import { getAuthenticatedAdmin } from "./admin-user-action";
import { Prisma } from "@prisma/client";

import { updateOrderStatusAndAdjustStock } from "@/lib/order-utils";

// 🔹 Get all orders (admin)
export async function getAllOrders(page = 1, limit = 10, status?: string, search?: string) {
  try {
    await getAuthenticatedAdmin();

    const where: Prisma.OrderWhereInput = {};
    if (status) where.status = status.toUpperCase();
    if (search && search.trim()) {
      where.OR = [
        { id: { contains: search.trim(), mode: 'insensitive' } },
        { user: { name: { contains: search.trim(), mode: 'insensitive' } } },
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { email: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          items: {
            include: {
              variant: {
                include: {
                  product: true,
                  options: { include: { attribute: true, attributeValue: true } },
                }
              }
            }
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return {
      data: orders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    };
  } catch (error) {
    console.error("❌ Admin fetch orders error:", error);
    throw new Error("Failed to fetch orders");
  }
}

// 🔹 Update order status (admin)
export async function updateOrderStatus(orderId: string, status: string) {

  try {
    await getAuthenticatedAdmin();
    // ✅ validate status using schema
    orderStatusSchema.parse(status);

    const order = await updateOrderStatusAndAdjustStock(orderId, status);

    // Revalidate the admin orders page
    revalidatePath("/admin/orders");

    return order;
  } catch (error) {
    console.error("❌ Admin update order status error:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to update order status"
    );
  }
}


export async function getOrderByID(orderId: string) {
  try {
    await getAuthenticatedAdmin();
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        items: {
          include: {
            variant: {
              include: {
                product: { include: { brand: true, category: true, subCategory: true } },
                options: { include: { attribute: true, attributeValue: true } },
              },
            },
          },
        },
      },
    });

    return order;
  } catch (error) {
    console.error("❌ Admin fetch order error:", error);
    throw new Error("Failed to fetch order");
  }
}
