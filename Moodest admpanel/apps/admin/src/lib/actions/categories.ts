"use server";

import { revalidatePath } from "next/cache";
import { serverFetch } from "@/lib/api";

export async function createCategory(data: {
  name: string;
  slug: string;
  parentId?: number;
}) {
  const result = await serverFetch<{ id: number; name: string; slug: string }>("/categories", {
    method: "POST",
    body: data,
  });
  revalidatePath("/category");
  revalidatePath("/subcategory");
  return result;
}

export async function updateCategory(
  id: number,
  data: { name?: string; slug?: string; parentId?: number }
) {
  const result = await serverFetch<{ id: number; name: string }>(`/categories/${id}`, {
    method: "PATCH",
    body: data,
  });
  revalidatePath("/category");
  revalidatePath("/subcategory");
  return result;
}

export async function deleteCategory(id: number) {
  await serverFetch(`/categories/${id}`, { method: "DELETE" });
  revalidatePath("/category");
  revalidatePath("/subcategory");
}
