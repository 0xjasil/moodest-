import { productAPI, mapBackendProductToProduct } from "@/lib/api";
import type { Product } from "@/lib/types";

export interface GetProductsFilter {
  category?: string;
  search?: string;
  sort?: string;
  limit?: number;
}

export async function getProducts(filter: GetProductsFilter = {}): Promise<Product[]> {
  try {
    const res = await productAPI.getAll({
      category: filter.category === "all" ? undefined : filter.category,
      search: filter.search || undefined,
      limit: filter.limit || 50,
    });

    if (res?.items && Array.isArray(res.items)) {
      return res.items.map(mapBackendProductToProduct);
    }
    return [];
  } catch (error) {
    console.error("[getProducts] Failed to fetch products from API:", error);
    return [];
  }
}

export async function getProductById(id: string): Promise<Product | null> {
  try {
    const raw = await productAPI.getById(id);
    if (raw) {
      return mapBackendProductToProduct(raw);
    }
    return null;
  } catch (error) {
    console.error(`[getProductById] Failed to fetch product ${id}:`, error);
    return null;
  }
}

export async function getProductByIdOrSlug(idOrSlug: string): Promise<Product | null> {
  if (!idOrSlug) return null;
  return getProductById(idOrSlug);
}

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  return getProducts({ limit });
}

export async function getRelatedProducts(
  productId: string,
  category: string,
  limit = 4
): Promise<Product[]> {
  const allInCat = await getProducts({ category, limit });
  return allInCat.filter((p) => p.id !== productId).slice(0, limit);
}
