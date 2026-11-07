import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  ReactNode,
} from "react";
import { productAPI, mapBackendProductToProduct } from "@/lib/api";
import { type Product } from "@/components/ProductCard";

/* ── Types ────────────────────────────────────────────────────── */
export interface SearchFilters {
  query: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  brand?: string;
  sortBy?: "relevance" | "price-asc" | "price-desc" | "rating" | "newest";
  page?: number;
  limit?: number;
}

export interface SearchResult {
  products: Product[];
  total: number;
  hasMore: boolean;
  facets: {
    brands: { name: string; count: number }[];
    priceRanges: { label: string; count: number }[];
    ratings: { rating: number; count: number }[];
  };
}

interface SearchState {
  results: Product[];
  total: number;
  hasMore: boolean;
  facets: SearchResult["facets"];
  filters: SearchFilters;
  suggestions: string[];
  isLoading: boolean;
  error: string | null;
}

type SearchAction =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; result: SearchResult }
  | { type: "FETCH_ERROR"; error: string }
  | { type: "SET_FILTER"; filter: Partial<SearchFilters> }
  | { type: "RESET_FILTERS" }
  | { type: "LOAD_SUGGESTIONS"; suggestions: string[] }
  | { type: "CLEAR_SUGGESTIONS" }
  | { type: "SET_ERROR"; error: string | null };

export interface SearchContextValue {
  results: Product[];
  total: number;
  hasMore: boolean;
  facets: SearchResult["facets"];
  filters: SearchFilters;
  suggestions: string[];
  isLoading: boolean;
  error: string | null;

  // Actions
  search(filters: SearchFilters): Promise<void>;
  setFilter(filter: Partial<SearchFilters>): void;
  resetFilters(): void;
  getSuggestions(query: string): Promise<string[]>;
  clearSuggestions(): void;
  clearError(): void;
}

/* ── Reducer ──────────────────────────────────────────────────── */
function reducer(state: SearchState, action: SearchAction): SearchState {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, isLoading: true, error: null };

    case "FETCH_SUCCESS":
      return {
        ...state,
        results: action.result.products,
        total: action.result.total,
        hasMore: action.result.hasMore,
        facets: action.result.facets,
        isLoading: false,
        error: null,
      };

    case "FETCH_ERROR":
      return { ...state, isLoading: false, error: action.error };

    case "SET_FILTER":
      return {
        ...state,
        filters: { ...state.filters, ...action.filter },
      };

    case "RESET_FILTERS":
      return {
        ...state,
        filters: { query: "", page: 1, limit: 20 },
      };

    case "LOAD_SUGGESTIONS":
      return { ...state, suggestions: action.suggestions };

    case "CLEAR_SUGGESTIONS":
      return { ...state, suggestions: [] };

    case "SET_ERROR":
      return { ...state, error: action.error };

    default:
      return state;
  }
}

/* ── Context ──────────────────────────────────────────────────── */
const SearchContext = createContext<SearchContextValue | null>(null);

/* ── Provider ─────────────────────────────────────────────────── */
export function SearchProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    results: [],
    total: 0,
    hasMore: false,
    facets: { brands: [], priceRanges: [], ratings: [] },
    filters: { query: "", page: 1, limit: 20 },
    suggestions: [],
    isLoading: false,
    error: null,
  });

  const search = useCallback(async (filters: SearchFilters) => {
    dispatch({ type: "FETCH_START" });
    try {
      const res = await productAPI.getAll({
        search: filters.query || undefined,
        category: filters.category || undefined,
        brand: filters.brand || undefined,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        sort: filters.sortBy === "newest" ? "createdAt" : filters.sortBy === "price-asc" ? "basePrice" : filters.sortBy === "price-desc" ? "basePrice" : undefined,
        order: filters.sortBy === "price-desc" ? "desc" : "asc",
        page: filters.page || 1,
        limit: filters.limit || 20,
      });

      const products = (res.items || []).map(mapBackendProductToProduct);
      const searchResult: SearchResult = {
        products,
        total: res.total || products.length,
        hasMore: res.page < res.totalPages,
        facets: {
          brands: [],
          priceRanges: [],
          ratings: [],
        },
      };

      dispatch({ type: "FETCH_SUCCESS", result: searchResult });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Search failed";
      dispatch({ type: "FETCH_ERROR", error: message });
    }
  }, []);

  const setFilter = useCallback((filter: Partial<SearchFilters>) => {
    dispatch({ type: "SET_FILTER", filter });
  }, []);

  const resetFilters = useCallback(() => {
    dispatch({ type: "RESET_FILTERS" });
  }, []);

  const getSuggestions = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      dispatch({ type: "CLEAR_SUGGESTIONS" });
      return [];
    }

    try {
      const suggestions = await productAPI.autocomplete(query);
      const safeSuggestions = Array.isArray(suggestions) ? suggestions : [];
      dispatch({ type: "LOAD_SUGGESTIONS", suggestions: safeSuggestions });
      return safeSuggestions;
    } catch {
      return [];
    }
  }, []);

  const clearSuggestions = useCallback(() => {
    dispatch({ type: "CLEAR_SUGGESTIONS" });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: "SET_ERROR", error: null });
  }, []);

  const value: SearchContextValue = {
    results: state.results,
    total: state.total,
    hasMore: state.hasMore,
    facets: state.facets,
    filters: state.filters,
    suggestions: state.suggestions,
    isLoading: state.isLoading,
    error: state.error,

    search,
    setFilter,
    resetFilters,
    getSuggestions,
    clearSuggestions,
    clearError,
  };

  return (
    <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
  );
}

/* ── Hook ─────────────────────────────────────────────────────── */
export function useSearch(): SearchContextValue {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error("useSearch must be used inside <SearchProvider>");
  return ctx;
}
