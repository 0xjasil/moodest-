"use server";

import { revalidatePath } from "next/cache";
import { serverFetch } from "@/lib/api";

export async function createBrand(data: { name: string; slug: string; logoUrl?: string }) {
  const result = await serverFetch<{ id: number; name: string; slug: string }>("/brands", {
    method: "POST",
    body: data,
  });
  revalidatePath("/brand");
  return result;
}

export async function updateBrand(
  id: number,
  data: { name?: string; slug?: string; logoUrl?: string }
) {
  const result = await serverFetch<{ id: number; name: string }>(`/brands/${id}`, {
    method: "PATCH",
    body: data,
  });
  revalidatePath("/brand");
  return result;
}

export async function deleteBrand(id: number) {
  await serverFetch(`/brands/${id}`, { method: "DELETE" });
  revalidatePath("/brand");
}
