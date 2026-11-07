"use server";

import { revalidatePath } from "next/cache";
import { serverFetch } from "@/lib/api";

export async function createProduct(data: {
  name: string;
  slug: string;
  description: string;
  brandId: number;
  categoryId: number;
  basePrice: number;
  discountPct?: number;
  images: string[];
  tags?: string[];
  specifications?: Record<string, string>;
}) {
  const result = await serverFetch<{ id: number; name: string }>("/products", {
    method: "POST",
    body: data,
  });
  revalidatePath("/products");
  revalidatePath("/products/list");
  return result;
}

export async function updateProduct(
  id: number,
  data: Partial<{
    name: string;
    slug: string;
    description: string;
    brandId: number;
    categoryId: number;
    basePrice: number;
    discountPct: number;
    images: string[];
    tags: string[];
    isActive: boolean;
    specifications: Record<string, string>;
  }>
) {
  const result = await serverFetch<{ id: number; name: string }>(`/products/${id}`, {
    method: "PATCH",
    body: data,
  });
  revalidatePath("/products");
  revalidatePath("/products/list");
  revalidatePath(`/products/${id}`);
  return result;
}

export async function deleteProduct(id: number) {
  await serverFetch(`/products/${id}`, { method: "DELETE" });
  revalidatePath("/products");
  revalidatePath("/products/list");
}

export async function addProductVariant(
  productId: number,
  data: { size: string; color: string; stock: number; sku: string }
) {
  const result = await serverFetch<{ id: number }>(`/products/${productId}/variants`, {
    method: "POST",
    body: data,
  });
  revalidatePath(`/products/${productId}`);
  return result;
}

export async function updateProductVariant(
  productId: number,
  variantId: number,
  data: { size?: string; color?: string; stock?: number }
) {
  const result = await serverFetch<{ id: number }>(`/products/${productId}/variants/${variantId}`, {
    method: "PATCH",
    body: data,
  });
  revalidatePath(`/products/${productId}`);
  return result;
}

export async function deleteProductVariant(productId: number, variantId: number) {
  await serverFetch(`/products/${productId}/variants/${variantId}`, { method: "DELETE" });
  revalidatePath(`/products/${productId}`);
}
