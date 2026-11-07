import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { type Product } from "@/components/ProductCard";
import { cartAPI, mapBackendProductToProduct } from "@/lib/api";
import { useAuth } from "./AuthContext";
import type { CreatedReservation } from "@/lib/types";

/* ── Types ────────────────────────────────────────────────────── */
export interface CartItem {
  product: Product;
  qty: number;
  serverItemId?: number;
}

interface CartState {
  items: CartItem[];
  isLoading: boolean;
}

type CartAction =
  | { type: "SET_ITEMS"; items: CartItem[] }
  | { type: "ADD"; product: Product }
  | { type: "REMOVE"; productId: string }
  | { type: "UPDATE"; productId: string; delta: number }
  | { type: "CLEAR" }
  | { type: "SET_LOADING"; isLoading: boolean };

export interface CartContextValue {
  items: CartItem[];
  addItem: (product: Product) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  updateQty: (productId: string, delta: number) => Promise<void>;
  clearCart: () => Promise<void>;
  reserveCart: () => Promise<CreatedReservation>;
  refreshCart: () => Promise<void>;
  itemCount: number;
  total: number;
  isLoading: boolean;
}

/* ── Storage key ──────────────────────────────────────────────── */
const STORAGE_KEY = "moryelle_cart_v1";

/* ── Reducer ──────────────────────────────────────────────────── */
function reducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "SET_ITEMS":
      return { ...state, items: action.items, isLoading: false };

    case "ADD": {
      const exists = state.items.find((i) => i.product.id === action.product.id);
      if (exists) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.product.id === action.product.id ? { ...i, qty: i.qty + 1 } : i
          ),
        };
      }
      return {
        ...state,
        items: [...state.items, { product: action.product, qty: 1 }],
      };
    }

    case "REMOVE":
      return {
        ...state,
        items: state.items.filter((i) => i.product.id !== action.productId),
      };

    case "UPDATE": {
      const next = state.items
        .map((i) => {
          if (i.product.id !== action.productId) return i;
          const newQty = i.qty + action.delta;
          return newQty > 0 ? { ...i, qty: newQty } : null;
        })
        .filter(Boolean) as CartItem[];
      return { ...state, items: next };
    }

    case "CLEAR":
      return { ...state, items: [] };

    case "SET_LOADING":
      return { ...state, isLoading: action.isLoading };

    default:
      return state;
  }
}

/* ── Derived helpers ──────────────────────────────────────────── */
function deriveCount(items: CartItem[]) {
  return items.reduce((s, i) => s + i.qty, 0);
}
function deriveTotal(items: CartItem[]) {
  return items.reduce((s, i) => s + i.product.price * i.qty, 0);
}

/* ── Context ──────────────────────────────────────────────────── */
const CartContext = createContext<CartContextValue | null>(null);

/* ── Provider ─────────────────────────────────────────────────── */
export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { items: [], isLoading: false });
  const { isAuthenticated } = useAuth();

  /* Hydrate from localStorage on initial mount */
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartItem[];
        if (Array.isArray(parsed)) {
          dispatch({ type: "SET_ITEMS", items: parsed });
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  /* Synchronize with backend when authenticated */
  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      dispatch({ type: "SET_LOADING", isLoading: true });
      const serverCart = await cartAPI.get();
      if (serverCart && Array.isArray(serverCart.items)) {
        const mappedItems: CartItem[] = serverCart.items.map((ci) => {
          const product = ci.variant?.product
            ? mapBackendProductToProduct(ci.variant.product)
            : {
                id: String(ci.variant?.productId || ci.variantId),
                name: "Product",
                price: 0,
                rating: 4.5,
                reviewCount: 0,
                image: "/placeholder.png",
                category: "makeup" as const,
                brand: "Moryelle",
                variantId: ci.variantId,
              };

          // Retain variantId
          if (ci.variantId) {
            product.variantId = ci.variantId;
          }

          return {
            product,
            qty: ci.quantity,
            serverItemId: ci.id,
          };
        });

        dispatch({ type: "SET_ITEMS", items: mappedItems });
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(mappedItems));
        }
      }
    } catch {
      // Backend cart fetch failed, fallback to local
    } finally {
      dispatch({ type: "SET_LOADING", isLoading: false });
    }
  }, [isAuthenticated]);

  /* Sync guest items on login */
  useEffect(() => {
    if (!isAuthenticated) return;

    (async () => {
      try {
        const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
        if (raw) {
          const localItems = JSON.parse(raw) as CartItem[];
          if (Array.isArray(localItems) && localItems.length > 0) {
            // Push guest items with variantId to server
            for (const item of localItems) {
              const variantId =
                item.product.variantId ||
                item.product.variants?.[0]?.id ||
                Number(item.product.id);
              if (variantId && !isNaN(variantId)) {
                await cartAPI.addItem(variantId, item.qty).catch(() => {});
              }
            }
          }
        }
      } catch {
        /* ignore */
      }
      await refreshCart();
    })();
  }, [isAuthenticated, refreshCart]);

  /* Persist to localStorage on every change */
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
    } catch {
      /* ignore */
    }
  }, [state.items]);

  const addItem = useCallback(
    async (product: Product) => {
      dispatch({ type: "ADD", product });
      if (isAuthenticated) {
        const variantId =
          product.variantId ||
          product.variants?.[0]?.id ||
          Number(product.id);
        if (variantId && !isNaN(variantId)) {
          await cartAPI.addItem(variantId, 1).catch(() => {});
          await refreshCart();
        }
      }
    },
    [isAuthenticated, refreshCart]
  );

  const removeItem = useCallback(
    async (productId: string) => {
      const item = state.items.find((i) => i.product.id === productId);
      dispatch({ type: "REMOVE", productId });
      if (isAuthenticated && item?.serverItemId) {
        await cartAPI.removeItem(item.serverItemId).catch(() => {});
        await refreshCart();
      }
    },
    [isAuthenticated, state.items, refreshCart]
  );

  const updateQty = useCallback(
    async (productId: string, delta: number) => {
      const item = state.items.find((i) => i.product.id === productId);
      dispatch({ type: "UPDATE", productId, delta });
      if (isAuthenticated && item?.serverItemId) {
        const newQty = item.qty + delta;
        if (newQty <= 0) {
          await cartAPI.removeItem(item.serverItemId).catch(() => {});
        } else {
          await cartAPI.updateItem(item.serverItemId, newQty).catch(() => {});
        }
        await refreshCart();
      }
    },
    [isAuthenticated, state.items, refreshCart]
  );

  const clearCart = useCallback(async () => {
    dispatch({ type: "CLEAR" });
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
    if (isAuthenticated) {
      await cartAPI.clear().catch(() => {});
    }
  }, [isAuthenticated]);

  const reserveCart = useCallback(async (): Promise<CreatedReservation> => {
    if (!isAuthenticated) {
      throw new Error("Authentication required to reserve cart items.");
    }
    // Call POST /api/cart/reserve to obtain lock
    const reservation = await cartAPI.reserve();
    return reservation;
  }, [isAuthenticated]);

  const value: CartContextValue = {
    items: state.items,
    addItem,
    removeItem,
    updateQty,
    clearCart,
    reserveCart,
    refreshCart,
    itemCount: deriveCount(state.items),
    total: deriveTotal(state.items),
    isLoading: state.isLoading,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

/* ── Hook ─────────────────────────────────────────────────────── */
export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
