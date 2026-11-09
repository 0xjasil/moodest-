import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { type Product } from "@/components/ProductCard";
import { wishlistAPI, mapBackendProductToProduct } from "@/lib/api";
import { useAuth } from "./AuthContext";

/* ── Types ────────────────────────────────────────────────────── */
interface WishlistState {
  ids: Set<string>;
  products: Product[];
  isLoading: boolean;
}

type WishlistAction =
  | { type: "SET_WISHLIST"; ids: Set<string>; products: Product[] }
  | { type: "TOGGLE"; product: Product }
  | { type: "SET_LOADING"; isLoading: boolean };

export interface WishlistContextValue {
  products: Product[];
  isWishlisted: (id: string) => boolean;
  toggleWishlist: (product: Product) => Promise<void>;
  wishlistCount: number;
  isLoading: boolean;
  refreshWishlist: () => Promise<void>;
}

const STORAGE_KEY = "moryelle_wishlist_v1";

/* ── Reducer ──────────────────────────────────────────────────── */
function reducer(state: WishlistState, action: WishlistAction): WishlistState {
  switch (action.type) {
    case "SET_WISHLIST":
      return {
        ...state,
        ids: action.ids,
        products: action.products,
        isLoading: false,
      };

    case "TOGGLE": {
      const newIds = new Set(state.ids);
      let newProducts = [...state.products];
      if (newIds.has(action.product.id)) {
        newIds.delete(action.product.id);
        newProducts = newProducts.filter((p) => p.id !== action.product.id);
      } else {
        newIds.add(action.product.id);
        newProducts.push(action.product);
      }
      return { ...state, ids: newIds, products: newProducts };
    }

    case "SET_LOADING":
      return { ...state, isLoading: action.isLoading };

    default:
      return state;
  }
}

/* ── Context ──────────────────────────────────────────────────── */
const WishlistContext = createContext<WishlistContextValue | null>(null);

/* ── Provider ─────────────────────────────────────────────────── */
export function WishlistProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    ids: new Set<string>(),
    products: [],
    isLoading: false,
  });
  const { isAuthenticated } = useAuth();

  /* Hydrate from localStorage on mount */
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const { ids, products } = JSON.parse(raw) as {
          ids: string[];
          products: Product[];
        };
        if (Array.isArray(ids) && Array.isArray(products)) {
          dispatch({
            type: "SET_WISHLIST",
            ids: new Set(ids),
            products,
          });
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  /* Fetch server wishlist when authenticated */
  const refreshWishlist = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      dispatch({ type: "SET_LOADING", isLoading: true });
      const serverProducts = await wishlistAPI.get();
      if (Array.isArray(serverProducts)) {
        const mapped = serverProducts.map(mapBackendProductToProduct);
        const ids = new Set(mapped.map((p) => p.id));
        dispatch({ type: "SET_WISHLIST", ids, products: mapped });
        if (typeof window !== "undefined") {
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ ids: Array.from(ids), products: mapped })
          );
        }
      }
    } catch {
      // Backend unavailable, retain local
    } finally {
      dispatch({ type: "SET_LOADING", isLoading: false });
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshWishlist();
    }
  }, [isAuthenticated, refreshWishlist]);

  /* Persist to localStorage on change */
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          ids: Array.from(state.ids),
          products: state.products,
        })
      );
    } catch {
      /* ignore */
    }
  }, [state.ids, state.products]);

  const toggleWishlist = useCallback(
    async (product: Product) => {
      const isCurrentlyWishlisted = state.ids.has(product.id);
      dispatch({ type: "TOGGLE", product });

      if (isAuthenticated) {
        const productId = product.backendId || Number(product.id);
        if (productId && !isNaN(Number(productId))) {
          try {
            if (isCurrentlyWishlisted) {
              await wishlistAPI.remove(Number(productId));
            } else {
              await wishlistAPI.add(Number(productId));
            }
          } catch {
            // Revert on error
            dispatch({ type: "TOGGLE", product });
          }
        }
      }
    },
    [isAuthenticated, state.ids]
  );

  const isWishlisted = useCallback(
    (id: string) => state.ids.has(id),
    [state.ids]
  );

  return (
    <WishlistContext.Provider
      value={{
        products: state.products,
        isWishlisted,
        toggleWishlist,
        wishlistCount: state.ids.size,
        isLoading: state.isLoading,
        refreshWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

/* ── Hook ─────────────────────────────────────────────────────── */
export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used inside <WishlistProvider>");
  return ctx;
}
