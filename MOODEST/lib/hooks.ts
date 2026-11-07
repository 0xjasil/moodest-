import { useEffect, useState, useCallback } from "react";
import { type Product } from "@/components/ProductCard";
import {
  productAPI,
  categoryAPI,
  brandAPI,
  mapBackendProductToProduct,
} from "./api";
import type { Category, Brand } from "./types";
import localProductsData from "@/products.json";

export type { Category, Brand };

export interface Banner {
  id: number;
  title: string;
  image: string;
  link: string;
  callout?: string;
  alt?: string;
  status?: string;
}

const fallbackProducts: Product[] = (localProductsData as any[]).map((p: any, i: number) => ({
  id: String(p.id ?? i + 1),
  name: p.name,
  price: p.price ?? 2999,
  originalPrice: p.originalPrice ?? undefined,
  discount: p.discount ?? undefined,
  rating: p.rating ?? 4.8,
  reviewCount: p.reviewCount ?? 50,
  image: p.image || "/abaya/products/abaya-1.jpg",
  badge: p.badge ?? undefined,
  category: p.category ?? "front-open",
  brand: p.brand ?? "Modest Studio",
}));

/**
 * Fetch products with pagination and filtering using NestJS productAPI with local Abaya fallback
 */
export function useProducts(
  page: number = 1,
  limit: number = 20,
  category?: string
) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await productAPI.getAll({
        page,
        limit,
        category,
      });

      const items = response?.items || [];
      const transformed = items.map(mapBackendProductToProduct);

      if (transformed.length > 0) {
        setProducts(transformed);
        setHasMore(response ? response.page < response.totalPages : false);
      } else {
        // Fallback to local Abaya products
        const filtered = category
          ? fallbackProducts.filter((p) => p.category === category)
          : fallbackProducts;
        setProducts(filtered.slice((page - 1) * limit, page * limit));
        setHasMore(filtered.length > page * limit);
      }
    } catch (err) {
      // Fallback on network or server offline
      const filtered = category
        ? fallbackProducts.filter((p) => p.category === category)
        : fallbackProducts;
      setProducts(filtered.slice((page - 1) * limit, page * limit));
      setHasMore(filtered.length > page * limit);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, category]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, isLoading, error, hasMore, refetch: fetchProducts };
}

/**
 * Fetch categories using NestJS categoryAPI
 */
export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await categoryAPI.getAll();
      setCategories(Array.isArray(response) ? response : []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch categories";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return { categories, isLoading, error, refetch: fetchCategories };
}

/**
 * Fetch brands using NestJS brandAPI
 */
export function useBrands() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBrands = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await brandAPI.getAll();
      setBrands(Array.isArray(response) ? response : []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch brands";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  return { brands, isLoading, error, refetch: fetchBrands };
}

/**
 * Hook for managing media queries and responsive breakpoints
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = () => setMatches(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [matches, query]);

  return matches;
}

/**
 * Hook for handling click outside of an element
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
  ref: React.RefObject<T>,
  handler: (event: MouseEvent | TouchEvent) => void
) {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      const el = ref?.current;
      if (!el || el.contains((event?.target as Node) || null)) {
        return;
      }
      handler(event);
    };

    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);

    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
}

/**
 * Hook for debouncing values
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
