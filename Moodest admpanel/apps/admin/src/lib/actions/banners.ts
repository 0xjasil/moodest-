"use server";

import { revalidatePath } from "next/cache";
import { serverFetch } from "@/lib/api";

export interface BannerActionData {
  title: string;
  tag?: string;
  offerPrice?: string;
  description?: string;
  buttonText?: string;
  buttonLink?: string;
  image?: string;
  order?: number;
  isActive?: boolean;
}

export interface BannerActionResult {
  id: string;
  title: string;
  image?: string;
  isActive?: boolean;
  order?: number;
}

export async function createBannerAction(data: BannerActionData) {
  const result = await serverFetch<BannerActionResult>("/banners", {
    method: "POST",
    body: data,
  });
  revalidatePath("/banners");
  return result;
}

export async function updateBannerAction(id: string, data: Partial<BannerActionData>) {
  const result = await serverFetch<BannerActionResult>(`/banners/${id}`, {
    method: "PATCH",
    body: data,
  });
  revalidatePath("/banners");
  return result;
}

export async function deleteBannerAction(id: string) {
  const result = await serverFetch<{ success: boolean; id: string }>(`/banners/${id}`, {
    method: "DELETE",
  });
  revalidatePath("/banners");
  return result;
}

export async function reorderBannersAction(bannerIds: string[]) {
  const result = await serverFetch<BannerActionResult[]>("/banners/reorder", {
    method: "PATCH",
    body: { bannerIds },
  });
  revalidatePath("/banners");
  return result;
}
