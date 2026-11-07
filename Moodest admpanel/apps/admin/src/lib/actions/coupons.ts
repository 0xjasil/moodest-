"use server";

import { revalidatePath } from "next/cache";
import { serverFetch } from "@/lib/api";

export async function createCoupon(data: {
  code: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  minOrderAmount?: number;
  maxUses?: number;
  expiresAt?: string;
}) {
  const result = await serverFetch("/coupons", { method: "POST", body: data });
  revalidatePath("/coupons");
  return result;
}

export async function updateCoupon(
  id: number,
  data: Partial<{
    code: string;
    discountType: "PERCENTAGE" | "FIXED";
    discountValue: number;
    minOrderAmount: number;
    maxUses: number;
    expiresAt: string;
    isActive: boolean;
  }>
) {
  const result = await serverFetch(`/coupons/${id}`, { method: "PATCH", body: data });
  revalidatePath("/coupons");
  return result;
}

export async function deleteCoupon(id: number) {
  await serverFetch(`/coupons/${id}`, { method: "DELETE" });
  revalidatePath("/coupons");
}
