/**
 * Moryelle Beauté - Centralized API Service Layer
 * Typed service modules strictly aligned with NestJS backend controllers & DTOs
 */

import { apiFetchJson } from "./apiFetch";
import type {
  User,
  Brand,
  Category,
  BackendProduct,
  Product,
  Cart,
  CartItem,
  CreatedReservation,
  Address,
  Order,
  CouponValidationResult,
  Review,
  ProductReviewsResponse,
  Wallet,
  WalletTransaction,
  PaymentIntentResult,
  VerifyPaymentPayload,
  VerifyPaymentResult,
  Banner,
} from "./types";

/* ── Product Mapping Helper ──────────────────────────────────── */

export function mapBackendProductToProduct(item: BackendProduct): Product {
  const firstVariant = item.variants?.[0];
  const variantMrp = firstVariant?.price != null ? Number(firstVariant.price) : 0;
  const variantOffer =
    firstVariant?.offerPrice != null ? Number(firstVariant.offerPrice) : 0;
  const rawPrice = Number((item as any).price ?? 0);
  const rawBasePrice = Number(item.basePrice ?? 0);

  const defaultPrice = rawBasePrice || variantMrp || rawPrice || 0;
  const discountPct = item.discountPct ?? 0;

  const effectivePrice =
    rawPrice > 0
      ? rawPrice
      : variantOffer > 0
      ? variantOffer
      : discountPct > 0 && defaultPrice > 0
      ? Math.round(defaultPrice * (1 - discountPct / 100))
      : defaultPrice;

  const computedOriginal =
    (item as any).originalPrice && Number((item as any).originalPrice) > effectivePrice
      ? Number((item as any).originalPrice)
      : defaultPrice > effectivePrice
      ? defaultPrice
      : undefined;

  const computedDiscount =
    discountPct > 0
      ? discountPct
      : computedOriginal && effectivePrice > 0
      ? Math.round(((computedOriginal - effectivePrice) / computedOriginal) * 100)
      : undefined;

  return {
    id: String(item.id),
    backendId: item.id,
    name: item.name,
    price: effectivePrice,
    originalPrice: computedOriginal,
    discount: computedDiscount,
    rating: item.avgRating ?? 4.5,
    reviewCount: item.reviewCount ?? (item.reviews?.length ?? 0),
    image: item.images?.[0] || "/placeholder.png",
    images: item.images || [],
    category:
      item.category?.slug || item.category?.name?.toLowerCase() || "front-open",
    brand: item.brand?.name || "Modest Studio",
    description: item.description || "",
    fabric: item.fabric || undefined,
    isNewArrival: Boolean(item.isNewArrival),
    isTrending: Boolean(item.isTrending),
    isCustomerFavorite: Boolean(item.isCustomerFavorite),
    isFeatured: Boolean(item.isFeatured),
    isBestSeller: Boolean(item.isCustomerFavorite || item.isTrending || item.isBestSeller),
    badge: item.badge || (item.isCustomerFavorite || item.isTrending ? "BESTSELLER" : item.isNewArrival ? "NEW" : undefined),
    variants: item.variants || [],
    variantId: item.variants?.[0]?.id,
  };
}

/* ── Auth API ─────────────────────────────────────────────────── */

export interface AuthTokenResponse {
  access_token?: string;
  accessToken?: string;
  refresh_token?: string;
  refreshToken?: string;
  user?: User;
  data?: {
    access_token?: string;
    accessToken?: string;
    refresh_token?: string;
    refreshToken?: string;
    user?: User;
  };
}

export const authAPI = {
  login: async (email: string, password: string) => {
    return apiFetchJson<AuthTokenResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  sendVerificationOtp: async (email: string) => {
    return apiFetchJson<{
      message?: string;
      verificationToken?: string;
      expiresInSeconds?: number;
      data?: { verificationToken?: string; expiresInSeconds?: number };
    }>("/api/auth/send-verification-otp", {
      method: "POST",
      skipRefresh: true,
      body: JSON.stringify({ email }),
    });
  },

  register: async (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string,
    otp?: string,
    verificationToken?: string
  ) => {
    const fullName = [firstName, lastName]
      .map((part) => part?.trim())
      .filter(Boolean)
      .join(" ");
    return apiFetchJson<AuthTokenResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
        ...(fullName ? { name: fullName } : {}),
        ...(otp ? { otp } : {}),
        ...(verificationToken ? { verificationToken } : {}),
      }),
    });
  },

  refresh: async (refreshToken: string) => {
    return apiFetchJson<AuthTokenResponse>("/api/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });
  },

  logout: async (refreshToken?: string) => {
    return apiFetchJson<{ message?: string }>("/api/auth/logout", {
      method: "POST",
      skipRefresh: true,
      body: JSON.stringify(refreshToken ? { refreshToken } : {}),
    });
  },

  forgotPassword: async (email: string) => {
    return apiFetchJson<{ message?: string }>("/api/auth/forgot-password", {
      method: "POST",
      skipRefresh: true,
      body: JSON.stringify({ email }),
    });
  },

  me: async () => {
    return apiFetchJson<User>("/api/users/me", { method: "GET" });
  },

  updateProfile: async (dto: {
    firstName?: string;
    lastName?: string;
    phone?: string;
  }) => {
    return apiFetchJson<User>("/api/users/me", {
      method: "PATCH",
      body: JSON.stringify(dto),
    });
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    return apiFetchJson<{ message?: string }>("/api/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },
};

/* ── Product API ──────────────────────────────────────────────── */

export interface ProductQueryFilters {
  search?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  size?: string;
  color?: string;
  tags?: string;
  sort?: string;
  order?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface ProductListResponse {
  items: BackendProduct[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const productAPI = {
  getAll: async (filters: ProductQueryFilters = {}): Promise<ProductListResponse> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") {
        params.append(k, String(v));
      }
    });
    const qs = params.toString();
    return apiFetchJson<ProductListResponse>(`/api/products${qs ? `?${qs}` : ""}`);
  },

  getById: async (id: number | string): Promise<BackendProduct> => {
    return apiFetchJson<BackendProduct>(`/api/products/${id}`);
  },

  autocomplete: async (q: string): Promise<string[]> => {
    const params = new URLSearchParams({ q });
    return apiFetchJson<string[]>(`/api/products/autocomplete?${params.toString()}`);
  },

  getTrending: async (limit: number = 10): Promise<string[]> => {
    return apiFetchJson<string[]>(`/api/products/trending-searches?limit=${limit}`);
  },

  getFacets: async (filters: Partial<ProductQueryFilters> = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") {
        params.append(k, String(v));
      }
    });
    const qs = params.toString();
    return apiFetchJson<any>(`/api/products/facets${qs ? `?${qs}` : ""}`);
  },

  getRelated: async (id: number | string): Promise<BackendProduct[]> => {
    return apiFetchJson<BackendProduct[]>(`/api/products/${id}/related`);
  },
};

/* ── Categories & Brands API ──────────────────────────────────── */

export const categoryAPI = {
  getAll: async (): Promise<Category[]> => {
    return apiFetchJson<Category[]>("/api/categories");
  },
  getById: async (id: number | string): Promise<Category> => {
    return apiFetchJson<Category>(`/api/categories/${id}`);
  },
};

export const brandAPI = {
  getAll: async (): Promise<Brand[]> => {
    return apiFetchJson<Brand[]>("/api/brands");
  },
  getById: async (id: number | string): Promise<Brand> => {
    return apiFetchJson<Brand>(`/api/brands/${id}`);
  },
};

/* ── Cart API ─────────────────────────────────────────────────── */

export const cartAPI = {
  get: async (): Promise<Cart> => {
    return apiFetchJson<Cart>("/api/cart");
  },

  addItem: async (variantId: number | string, quantity: number = 1): Promise<CartItem> => {
    return apiFetchJson<CartItem>("/api/cart/items", {
      method: "POST",
      body: JSON.stringify({ variantId: String(variantId), quantity }),
    });
  },

  updateItem: async (id: number | string, quantity: number): Promise<CartItem> => {
    return apiFetchJson<CartItem>(`/api/cart/items/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ quantity }),
    });
  },

  removeItem: async (id: number | string): Promise<{ message?: string }> => {
    return apiFetchJson<{ message?: string }>(`/api/cart/items/${id}`, {
      method: "DELETE",
    });
  },

  clear: async (): Promise<{ message?: string }> => {
    return apiFetchJson<{ message?: string }>("/api/cart", {
      method: "DELETE",
    });
  },

  reserve: async (): Promise<CreatedReservation> => {
    return apiFetchJson<CreatedReservation>("/api/cart/reserve", {
      method: "POST",
    });
  },

  releaseReservation: async (id: number | string): Promise<{ message?: string }> => {
    return apiFetchJson<{ message?: string }>(`/api/cart/reserve/${id}`, {
      method: "DELETE",
    });
  },
};

/* ── Order API ────────────────────────────────────────────────── */

export interface PlaceOrderPayload {
  addressId: number | string;
  reservationId?: number | string;
  couponCode?: string;
  walletAmountUsed?: number;
  paymentMethod?: "COD" | "RAZORPAY";
}

export const orderAPI = {
  getUserOrders: async (): Promise<Order[]> => {
    return apiFetchJson<Order[]>("/api/orders");
  },

  getOrderById: async (id: number | string): Promise<Order> => {
    return apiFetchJson<Order>(`/api/orders/${id}`);
  },

  placeOrder: async (payload: PlaceOrderPayload): Promise<Order> => {
    return apiFetchJson<Order>("/api/orders", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  cancelOrder: async (id: number | string): Promise<Order> => {
    return apiFetchJson<Order>(`/api/orders/${id}/cancel`, {
      method: "PATCH",
    });
  },

  requestReturn: async (id: number | string): Promise<Order> => {
    return apiFetchJson<Order>(`/api/orders/${id}/return`, {
      method: "PATCH",
    });
  },
};

/* ── Payment API ──────────────────────────────────────────────── */

export const paymentAPI = {
  createIntent: async (
    orderId: number | string,
    currency?: string
  ): Promise<PaymentIntentResult> => {
    return apiFetchJson<PaymentIntentResult>("/api/payments/create-intent", {
      method: "POST",
      body: JSON.stringify({ orderId, currency }),
    });
  },

  retry: async (
    orderId: number | string,
    currency?: string
  ): Promise<PaymentIntentResult> => {
    return apiFetchJson<PaymentIntentResult>(`/api/payments/retry/${orderId}`, {
      method: "POST",
      body: JSON.stringify({ currency }),
    });
  },

  verify: async (payload: VerifyPaymentPayload): Promise<VerifyPaymentResult> => {
    return apiFetchJson<VerifyPaymentResult>("/api/payments/verify", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};

/* ── Address API ──────────────────────────────────────────────── */

export interface CreateAddressDto {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
}

export const addressAPI = {
  getAll: async (): Promise<Address[]> => {
    return apiFetchJson<Address[]>("/api/users/me/addresses");
  },

  create: async (dto: CreateAddressDto): Promise<Address> => {
    return apiFetchJson<Address>("/api/users/me/addresses", {
      method: "POST",
      body: JSON.stringify(dto),
    });
  },

  update: async (id: number | string, dto: Partial<CreateAddressDto>): Promise<Address> => {
    return apiFetchJson<Address>(`/api/users/me/addresses/${id}`, {
      method: "PATCH",
      body: JSON.stringify(dto),
    });
  },

  delete: async (id: number | string): Promise<{ message?: string }> => {
    return apiFetchJson<{ message?: string }>(`/api/users/me/addresses/${id}`, {
      method: "DELETE",
    });
  },

  setDefault: async (id: number | string): Promise<Address> => {
    return apiFetchJson<Address>(`/api/users/me/addresses/${id}/default`, {
      method: "PATCH",
    });
  },
};

/* ── Coupon API ───────────────────────────────────────────────── */

export const couponAPI = {
  validate: async (
    code: string,
    orderAmount: number
  ): Promise<CouponValidationResult> => {
    return apiFetchJson<CouponValidationResult>("/api/coupons/validate", {
      method: "POST",
      body: JSON.stringify({ code, orderAmount }),
    });
  },
};

/* ── Review API ───────────────────────────────────────────────── */

export const reviewAPI = {
  getByProduct: async (
    productId: number | string,
    page: number = 1,
    limit: number = 10
  ): Promise<ProductReviewsResponse> => {
    return apiFetchJson<ProductReviewsResponse>(
      `/api/reviews/product/${productId}?page=${page}&limit=${limit}`
    );
  },

  create: async (
    productId: number | string,
    dto: { rating: number; title?: string; body?: string }
  ): Promise<Review> => {
    return apiFetchJson<Review>(`/api/reviews/product/${productId}`, {
      method: "POST",
      body: JSON.stringify(dto),
    });
  },
};

/* ── Wishlist API ─────────────────────────────────────────────── */

export const wishlistAPI = {
  get: async (): Promise<BackendProduct[]> => {
    return apiFetchJson<BackendProduct[]>("/api/wishlist");
  },

  add: async (productId: number | string): Promise<{ message?: string }> => {
    return apiFetchJson<{ message?: string }>(`/api/wishlist/${productId}`, {
      method: "POST",
    });
  },

  remove: async (productId: number | string): Promise<{ message?: string }> => {
    return apiFetchJson<{ message?: string }>(`/api/wishlist/${productId}`, {
      method: "DELETE",
    });
  },
};

/* ── Wallet API ───────────────────────────────────────────────── */

export const walletAPI = {
  get: async (): Promise<Wallet> => {
    return apiFetchJson<Wallet>("/api/wallet/me");
  },

  getTransactions: async (): Promise<WalletTransaction[]> => {
    return apiFetchJson<WalletTransaction[]>("/api/wallet/me/transactions");
  },

  withdraw: async (amount: number): Promise<{ message?: string }> => {
    return apiFetchJson<{ message?: string }>("/api/wallet/withdraw", {
      method: "POST",
      body: JSON.stringify({ amount }),
    });
  },
};

/* ── Banners CMS API ─────────────────────────────────────────── */

export const bannerAPI = {
  getAll: async (all?: boolean): Promise<Banner[]> => {
    const query = all ? "?all=true" : "";
    return apiFetchJson<Banner[]>(`/api/banners${query}`);
  },
};

