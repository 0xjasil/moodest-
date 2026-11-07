"use server";

import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { Prisma } from "@prisma/client";

/**
 * Ensure the current session belongs to an admin
 */
export async function getAuthenticatedAdmin() {
  const nextHeaders = await headers();
  const standardHeaders = new Headers();
  nextHeaders.forEach((value, key) => {
    standardHeaders.set(key, value);
  });

  const session = await auth.api.getSession({ headers: standardHeaders });
  if (!session?.user) throw new Error("Unauthorized");

  const admin = await prisma.user.findFirst({
    where: { id: session.user.id, role: "admin" },
  });

  if (!admin) throw new Error("Not an admin");
  return admin;
}

/**
 * Get all users with search, filter, sort, joinedDate & pagination
 */
export const getAllUsers = async ({
  page = 1,
  limit = 10,
  search = "",
  status,
  sort = "desc",
  joinedDate, // 👈 NEW field
}: {
  page?: number;
  limit?: number;
  search?: string;
  status?: "active" | "banned";
  sort?: "asc" | "desc";
  joinedDate?: string; // "YYYY-MM-DD"
}) => {
  try {
    await getAuthenticatedAdmin();

    const skip = (page - 1) * limit;

    // ✅ Date filter for full day
    let dateFilter: Prisma.UserWhereInput | undefined = undefined;
    if (joinedDate) {
      const start = new Date(joinedDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(joinedDate);
      end.setHours(23, 59, 59, 999);

      dateFilter = { createdAt: { gte: start, lte: end } };
    }

const where: Prisma.UserWhereInput = {
  role: { not: "admin" },
  OR: search
    ? [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ]
    : undefined,
  ...(status === "banned"
    ? { banned: true }
    : status === "active"
    ? { banned: false }
    : {}),
  ...dateFilter, // ✅ apply date filter if selected
};


    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: sort },
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          banned: true,
          banReason: true,
          banExpires: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      success: true,
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (err) {
    console.error(err);
    throw new Error("Failed to fetch users");
  }
};

/**
 * Ban a user (with reason & optional expiry date)
 */
export const banUser = async ({
  userId,
  reason,
  expires,
}: {
  userId: string;
  reason?: string;
  expires?: Date;
}) => {
  try {
    await getAuthenticatedAdmin();

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        banned: true,
        banReason: reason ?? "No reason provided",
        banExpires: expires ?? null, // null = permanent ban
      },
    });

    return {
      success: true,
      user: updated,
      message: expires
        ? `User banned until ${expires.toDateString()}`
        : "User permanently banned",
    };
  } catch (err) {
    console.error(err);
    throw new Error("Failed to ban user");
  }
};

/**
 * Unban a user
 */
export const unbanUser = async (userId: string) => {
  try {
    await getAuthenticatedAdmin();

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        banned: false,
        banReason: null,
        banExpires: null,
      },
    });

    return {
      success: true,
      user: updated,
      message: "User unbanned successfully",
    };
  } catch (err) {
    console.error(err);
    throw new Error("Failed to unban user");
  }
};

export async function fetchUserDetails(userId: string) {
  if (!userId) {
    return {
      error: "User ID is required.",
    }
  }

  try {
    await getAuthenticatedAdmin();
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        orders: {
          include: {
            items: {
              include: {
                variant: {
                  include: {
                    product: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!user) {
      return {
        error: "User not found.",
      }
    }

    return {
      success: true,
      message: "User details fetched successfully.",
      user,
    }
  } catch (error) {
    console.error("Error fetching user details:", error)
    return {
      error: "An unexpected error occurred.",
    }
  }
}