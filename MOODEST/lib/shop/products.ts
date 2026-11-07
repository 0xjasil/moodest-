import productsData from "@/data/products.json";
import type { Product } from "@/lib/types";

export interface GetProductsFilter {
  category?: string;
  search?: string;
  sort?: string;
  limit?: number;
}

const ALL_PRODUCTS: Product[] = productsData as unknown as Product[];

export async function getProducts(filter: GetProductsFilter = {}): Promise<Product[]> {
  let list = [...ALL_PRODUCTS];

  if (filter.category && filter.category !== "all") {
    const cat = filter.category.toLowerCase().trim();
    list = list.filter((p) => {
      const pCat = (p.category || "").toLowerCase();
      return pCat === cat || pCat.includes(cat) || cat.includes(pCat);
    });
  }

  if (filter.search) {
    const q = filter.search.toLowerCase().trim();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.brand && p.brand.toLowerCase().includes(q))
    );
  }

  if (filter.sort) {
    switch (filter.sort) {
      case "price-asc":
        list.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        list.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case "discount":
        list.sort((a, b) => (b.discount || 0) - (a.discount || 0));
        break;
      case "newest":
        list.sort((a, b) => (b.id > a.id ? 1 : -1));
        break;
      default:
        // popularity: higher rating / reviews
        list.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
        break;
    }
  }

  if (filter.limit && filter.limit > 0) {
    list = list.slice(0, filter.limit);
  }

  return list;
}

export async function getProductByIdOrSlug(idOrSlug: string): Promise<Product | null> {
  if (!idOrSlug) return null;
  const decoded = decodeURIComponent(idOrSlug).toLowerCase();
  const match = ALL_PRODUCTS.find(
    (p) =>
      p.id.toLowerCase() === decoded ||
      p.name.toLowerCase().replace(/\s+/g, "-") === decoded ||
      p.id.replace(/^prod-/, "") === decoded
  );
  return match || null;
}

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  return getProducts({ limit });
}

export async function getRelatedProducts(
  productId: string,
  category: string,
  limit = 4
): Promise<Product[]> {
  const allInCat = await getProducts({ category });
  const filtered = allInCat.filter((p) => p.id !== productId);
  if (filtered.length >= limit) return filtered.slice(0, limit);
  // Fill remaining from general products
  const remaining = ALL_PRODUCTS.filter(
    (p) => p.id !== productId && !filtered.some((f) => f.id === p.id)
  );
  return [...filtered, ...remaining].slice(0, limit);
}

