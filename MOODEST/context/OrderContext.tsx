import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  ReactNode,
} from "react";
import { orderAPI, reviewAPI, type PlaceOrderPayload } from "@/lib/api";
import type { Order as BaseOrder, Review as BaseReview } from "@/lib/types";
import { type Product } from "@/components/ProductCard";

/* ── Types ────────────────────────────────────────────────────── */
export interface OrderItem {
  id: number;
  productId?: number;
  variantId?: number;
  quantity: number;
  price: number;
  product?: Product;
}

export interface Order extends BaseOrder {
  totalAmount?: number;
  shippingAddress?: string;
  paymentMethod?: "WALLET" | "CARD" | "RAZORPAY" | "UPI";
  notes?: string;
  estimatedDelivery?: string;
  trackingId?: string;
}

export interface Review extends BaseReview {
  orderId?: number;
  comment?: string;
  helpfulCount?: number;
}

interface OrderState {
  orders: Order[];
  selectedOrder: Order | null;
  reviews: Record<number, Review[]>;
  isLoading: boolean;
  error: string | null;
}

type OrderAction =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; orders: Order[] }
  | { type: "FETCH_ERROR"; error: string }
  | { type: "SELECT_ORDER"; order: Order }
  | { type: "ADD_ORDER"; order: Order }
  | { type: "LOAD_REVIEWS"; productId: number; reviews: Review[] }
  | { type: "ADD_REVIEW"; productId: number; review: Review }
  | { type: "UPDATE_ORDER"; order: Order }
  | { type: "SET_ERROR"; error: string | null }
  | { type: "SET_LOADING"; isLoading: boolean };

export interface OrderContextValue {
  orders: Order[];
  selectedOrder: Order | null;
  reviews: Record<number, Review[]>;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchOrders(): Promise<void>;
  getOrderById(id: number): Order | null;
  placeOrder(
    payloadOrItems:
      | PlaceOrderPayload
      | OrderItem[],
    shippingAddressOrUndefined?: string,
    paymentMethodOrUndefined?: "WALLET" | "CARD" | "RAZORPAY" | "UPI",
    notesOrUndefined?: string
  ): Promise<Order>;
  cancelOrder(orderId: number): Promise<void>;
  fetchReviews(productId: number): Promise<Review[]>;
  submitReview(
    productId: number,
    orderId: number,
    rating: number,
    title: string,
    comment: string
  ): Promise<Review>;
  clearError(): void;
}

function normalizeOrder(o: any): Order {
  const formattedAddress = o.address
    ? `${o.address.line1 || ""}${o.address.line2 ? `, ${o.address.line2}` : ""}, ${o.address.city || ""}, ${o.address.state || ""} ${o.address.pincode || ""}`
    : o.shippingAddress || "Store Delivery";

  return {
    ...o,
    totalAmount: o.total ?? o.totalAmount ?? 0,
    shippingAddress: formattedAddress,
    paymentMethod: o.paymentMethod || "RAZORPAY",
    items: (o.items || []).map((item: any) => ({
      ...item,
      productId: item.variant?.productId || item.productId || 0,
    })),
  };
}

/* ── Reducer ──────────────────────────────────────────────────── */
function reducer(state: OrderState, action: OrderAction): OrderState {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, isLoading: true, error: null };

    case "FETCH_SUCCESS":
      return {
        ...state,
        orders: action.orders,
        isLoading: false,
        error: null,
      };

    case "FETCH_ERROR":
      return { ...state, isLoading: false, error: action.error };

    case "SELECT_ORDER":
      return { ...state, selectedOrder: action.order };

    case "ADD_ORDER":
      return {
        ...state,
        orders: [action.order, ...state.orders],
        selectedOrder: action.order,
      };

    case "LOAD_REVIEWS":
      return {
        ...state,
        reviews: {
          ...state.reviews,
          [action.productId]: action.reviews,
        },
      };

    case "ADD_REVIEW": {
      const existing = state.reviews[action.productId] || [];
      return {
        ...state,
        reviews: {
          ...state.reviews,
          [action.productId]: [action.review, ...existing],
        },
      };
    }

    case "UPDATE_ORDER": {
      const updatedOrders = state.orders.map((o) =>
        o.id === action.order.id ? action.order : o
      );
      const selectedOrder =
        state.selectedOrder?.id === action.order.id
          ? action.order
          : state.selectedOrder;
      return {
        ...state,
        orders: updatedOrders,
        selectedOrder,
      };
    }

    case "SET_ERROR":
      return { ...state, error: action.error };

    case "SET_LOADING":
      return { ...state, isLoading: action.isLoading };

    default:
      return state;
  }
}

/* ── Context ──────────────────────────────────────────────────── */
const OrderContext = createContext<OrderContextValue | null>(null);

/* ── Provider ─────────────────────────────────────────────────── */
export function OrderProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    orders: [],
    selectedOrder: null,
    reviews: {},
    isLoading: false,
    error: null,
  });

  const fetchOrders = useCallback(async () => {
    dispatch({ type: "FETCH_START" });
    try {
      const rawOrders = await orderAPI.getUserOrders();
      const orders = (rawOrders || []).map(normalizeOrder);
      dispatch({ type: "FETCH_SUCCESS", orders });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch orders";
      dispatch({ type: "FETCH_ERROR", error: message });
    }
  }, []);

  const getOrderById = useCallback(
    (id: number): Order | null => {
      return state.orders.find((o) => o.id === id) || null;
    },
    [state.orders]
  );

  const placeOrder = useCallback(
    async (
      payloadOrItems: PlaceOrderPayload | OrderItem[],
      _shippingAddress?: string,
      _paymentMethod?: "WALLET" | "CARD" | "RAZORPAY" | "UPI",
      _notes?: string
    ): Promise<Order> => {
      try {
        dispatch({ type: "SET_LOADING", isLoading: true });

        let payload: PlaceOrderPayload;
        if ("addressId" in payloadOrItems && "reservationId" in payloadOrItems) {
          payload = payloadOrItems;
        } else {
          throw new Error(
            "reservationId and addressId are required to place an order. Please reserve cart first."
          );
        }

        const raw = await orderAPI.placeOrder(payload);
        const order = normalizeOrder(raw);
        dispatch({ type: "ADD_ORDER", order });
        return order;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to place order";
        dispatch({ type: "SET_ERROR", error: message });
        throw error;
      } finally {
        dispatch({ type: "SET_LOADING", isLoading: false });
      }
    },
    []
  );

  const cancelOrder = useCallback(async (orderId: number) => {
    try {
      dispatch({ type: "SET_LOADING", isLoading: true });
      const raw = await orderAPI.cancelOrder(orderId);
      const order = normalizeOrder(raw);
      dispatch({ type: "UPDATE_ORDER", order });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to cancel order";
      dispatch({ type: "SET_ERROR", error: message });
      throw error;
    } finally {
      dispatch({ type: "SET_LOADING", isLoading: false });
    }
  }, []);

  const fetchReviews = useCallback(
    async (productId: number): Promise<Review[]> => {
      try {
        const res = await reviewAPI.getByProduct(productId);
        const reviews: Review[] = (res.reviews || []).map((r) => ({
          ...r,
          comment: r.body || "",
        }));
        dispatch({ type: "LOAD_REVIEWS", productId, reviews });
        return reviews;
      } catch {
        return [];
      }
    },
    []
  );

  const submitReview = useCallback(
    async (
      productId: number,
      orderId: number,
      rating: number,
      title: string,
      comment: string
    ): Promise<Review> => {
      try {
        dispatch({ type: "SET_LOADING", isLoading: true });
        const raw = await reviewAPI.create(productId, {
          rating,
          title,
          body: comment,
        });
        const review: Review = {
          ...raw,
          orderId,
          comment: raw.body || comment,
        };
        dispatch({ type: "ADD_REVIEW", productId, review });
        return review;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to submit review";
        dispatch({ type: "SET_ERROR", error: message });
        throw error;
      } finally {
        dispatch({ type: "SET_LOADING", isLoading: false });
      }
    },
    []
  );

  const clearError = useCallback(() => {
    dispatch({ type: "SET_ERROR", error: null });
  }, []);

  const value: OrderContextValue = {
    orders: state.orders,
    selectedOrder: state.selectedOrder,
    reviews: state.reviews,
    isLoading: state.isLoading,
    error: state.error,

    fetchOrders,
    getOrderById,
    placeOrder,
    cancelOrder,
    fetchReviews,
    submitReview,
    clearError,
  };

  return (
    <OrderContext.Provider value={value}>{children}</OrderContext.Provider>
  );
}

/* ── Hook ─────────────────────────────────────────────────────── */
export function useOrder(): OrderContextValue {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error("useOrder must be used inside <OrderProvider>");
  return ctx;
}
