import { getProducts } from "./products";
import type { Product } from "@/lib/types";

export interface SearchParams {
  q?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  sort?: string;
}

export async function searchProducts(params: SearchParams): Promise<Product[]> {
  const all = await getProducts({
    category: params.category,
    search: params.q,
    sort: params.sort,
  });

  return all.filter((p) => {
    if (params.minPrice !== undefined && p.price < params.minPrice) return false;
    if (params.maxPrice !== undefined && p.price > params.maxPrice) return false;
    if (params.minRating !== undefined && (p.rating || 0) < params.minRating) return false;
    return true;
  });
}

