import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  ReactNode,
} from "react";
import { productAPI, mapBackendProductToProduct } from "@/lib/api";

export interface Product {
  id: number;
  name: string;
  price: number;
  rating: number;
  category: string;
  image: string;
  discount?: number;
}

export interface RecommendationAlgorithm {
  collaborative: boolean;
  contentBased: boolean;
  popularity: boolean;
  seasonal: boolean;
  personalized: boolean;
}

export interface RecommendationContextValue {
  recommendations: Record<string, Product[]>;
  isLoading: boolean;
  error: string | null;

  fetchRecommendations(userId: number): Promise<void>;
  getSimilarProducts(productId: number): Promise<Product[]>;
  getTrendingProducts(): Promise<Product[]>;
  getPersonalizedFeed(): Promise<Product[]>;
  getWishlistBased(): Promise<Product[]>;
  getCategoryBased(categoryId: string): Promise<Product[]>;

  trackProductView(productId: number): void;
  trackProductLike(productId: number): void;
  trackProductPurchase(productId: number): void;

  clearRecommendations(): void;
}

const RecommendationContext = createContext<
  RecommendationContextValue | undefined
>(undefined);

interface RecommendationState {
  recommendations: Record<string, Product[]>;
  isLoading: boolean;
  error: string | null;
  viewedProducts: number[];
  likedProducts: number[];
  purchasedProducts: number[];
}

type RecommendationAction =
  | { type: "SET_RECOMMENDATIONS"; payload: Record<string, Product[]> }
  | { type: "SET_RECOMMENDATION"; payload: { key: string; products: Product[] } }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "TRACK_VIEW"; payload: number }
  | { type: "TRACK_LIKE"; payload: number }
  | { type: "TRACK_PURCHASE"; payload: number }
  | { type: "CLEAR_ALL" };

function recommendationReducer(
  state: RecommendationState,
  action: RecommendationAction
): RecommendationState {
  switch (action.type) {
    case "SET_RECOMMENDATIONS":
      return {
        ...state,
        recommendations: action.payload,
        isLoading: false,
      };

    case "SET_RECOMMENDATION":
      return {
        ...state,
        recommendations: {
          ...state.recommendations,
          [action.payload.key]: action.payload.products,
        },
      };

    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload,
      };

    case "SET_ERROR":
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    case "TRACK_VIEW":
      return {
        ...state,
        viewedProducts: state.viewedProducts.includes(action.payload)
          ? state.viewedProducts
          : [...state.viewedProducts, action.payload],
      };

    case "TRACK_LIKE":
      return {
        ...state,
        likedProducts: state.likedProducts.includes(action.payload)
          ? state.likedProducts
          : [...state.likedProducts, action.payload],
      };

    case "TRACK_PURCHASE":
      return {
        ...state,
        purchasedProducts: state.purchasedProducts.includes(action.payload)
          ? state.purchasedProducts
          : [...state.purchasedProducts, action.payload],
      };

    case "CLEAR_ALL":
      return {
        recommendations: {},
        isLoading: false,
        error: null,
        viewedProducts: [],
        likedProducts: [],
        purchasedProducts: [],
      };

    default:
      return state;
  }
}

function backendToRecProduct(p: any): Product {
  const mapped = mapBackendProductToProduct(p);
  return {
    id: typeof mapped.id === "number" ? mapped.id : (mapped.backendId || Number(mapped.id) || 1),
    name: mapped.name,
    price: mapped.price,
    rating: mapped.rating || 5,
    category: mapped.category || "Beauty & Care",
    image: mapped.image || "/product-1.jpg",
    discount:
      mapped.originalPrice && mapped.originalPrice > mapped.price
        ? Math.round(
            ((mapped.originalPrice - mapped.price) / mapped.originalPrice) * 100
          )
        : undefined,
  };
}

export function RecommendationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(recommendationReducer, {
    recommendations: {},
    isLoading: false,
    error: null,
    viewedProducts: [],
    likedProducts: [],
    purchasedProducts: [],
  });

  const fetchRecommendations = useCallback(async (_userId: number) => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const response = await productAPI.getAll({ limit: 20 });
      const items = (response?.items || []).map(backendToRecProduct);

      const recommendations: Record<string, Product[]> = {
        personalized: items.slice(0, 8),
        trending: items.slice(8, 14),
        similar: items.slice(4, 10),
        wishlistBased: items.slice(0, 6),
        categoryBased: items.slice(6, 14),
      };

      dispatch({
        type: "SET_RECOMMENDATIONS",
        payload: recommendations,
      });
    } catch {
      dispatch({
        type: "SET_ERROR",
        payload: "Failed to fetch recommendations",
      });
    }
  }, []);

  const getSimilarProducts = useCallback(async (productId: number) => {
    try {
      const response = await productAPI.getAll({ limit: 6 });
      const products = (response?.items || [])
        .filter((item: any) => item.id !== productId)
        .map(backendToRecProduct);
      dispatch({
        type: "SET_RECOMMENDATION",
        payload: { key: "similar", products },
      });
      return products;
    } catch (error) {
      console.error("Failed to get similar products:", error);
      return [];
    }
  }, []);

  const getTrendingProducts = useCallback(async () => {
    try {
      const response = await productAPI.getAll({ limit: 12 });
      const products = (response?.items || []).map(backendToRecProduct);
      dispatch({
        type: "SET_RECOMMENDATION",
        payload: { key: "trending", products },
      });
      return products;
    } catch (error) {
      console.error("Failed to get trending products:", error);
      return [];
    }
  }, []);

  const getPersonalizedFeed = useCallback(async () => {
    try {
      const response = await productAPI.getAll({ limit: 15 });
      const products = (response?.items || []).map(backendToRecProduct);
      dispatch({
        type: "SET_RECOMMENDATION",
        payload: { key: "personalized", products },
      });
      return products;
    } catch (error) {
      console.error("Failed to get personalized feed:", error);
      return [];
    }
  }, []);

  const getWishlistBased = useCallback(async () => {
    try {
      const response = await productAPI.getAll({ limit: 8 });
      const products = (response?.items || []).map(backendToRecProduct);
      dispatch({
        type: "SET_RECOMMENDATION",
        payload: { key: "wishlistBased", products },
      });
      return products;
    } catch (error) {
      console.error("Failed to get wishlist-based recommendations:", error);
      return [];
    }
  }, []);

  const getCategoryBased = useCallback(async (categoryId: string) => {
    try {
      const response = await productAPI.getAll({ category: categoryId, limit: 10 });
      const products = (response?.items || []).map(backendToRecProduct);
      dispatch({
        type: "SET_RECOMMENDATION",
        payload: { key: `category_${categoryId}`, products },
      });
      return products;
    } catch (error) {
      console.error("Failed to get category-based recommendations:", error);
      return [];
    }
  }, []);

  const trackProductView = useCallback((productId: number) => {
    dispatch({ type: "TRACK_VIEW", payload: productId });
  }, []);

  const trackProductLike = useCallback((productId: number) => {
    dispatch({ type: "TRACK_LIKE", payload: productId });
  }, []);

  const trackProductPurchase = useCallback((productId: number) => {
    dispatch({ type: "TRACK_PURCHASE", payload: productId });
  }, []);

  const clearRecommendations = useCallback(() => {
    dispatch({ type: "CLEAR_ALL" });
  }, []);

  const value: RecommendationContextValue = {
    recommendations: state.recommendations,
    isLoading: state.isLoading,
    error: state.error,
    fetchRecommendations,
    getSimilarProducts,
    getTrendingProducts,
    getPersonalizedFeed,
    getWishlistBased,
    getCategoryBased,
    trackProductView,
    trackProductLike,
    trackProductPurchase,
    clearRecommendations,
  };

  return (
    <RecommendationContext.Provider value={value}>
      {children}
    </RecommendationContext.Provider>
  );
}

export function useRecommendation(): RecommendationContextValue {
  const context = useContext(RecommendationContext);
  if (context === undefined) {
    throw new Error(
      "useRecommendation must be used within a RecommendationProvider"
    );
  }
  return context;
}
