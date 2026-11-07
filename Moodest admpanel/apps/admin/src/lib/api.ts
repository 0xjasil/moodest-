/**
 * Admin API client — server-side only (Server Components + Server Actions).
 *
 * Reads the JWT from the cookie store (set by AuthContext on login).
 * Calls the NestJS backend directly — bypasses the Next.js /api proxy to
 * avoid the extra network hop on the server side.
 *
 * For client-side calls, use the /api/[...slug] proxy route or
 * apiFetch from lib/apiFetch.ts which reads localStorage.
 */

import { cookies } from "next/headers";

const BACKEND = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
const TOKEN_COOKIE = "admin_access_token_v1";

interface FetchOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

/**
 * Authenticated fetch to NestJS backend from the server side.
 */
export async function serverFetch<T>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE)?.value;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> ?? {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const { body, ...restOptions } = options;
  const init: RequestInit = {
    ...restOptions,
    headers,
    cache: "no-store",
  };

  if (body !== undefined) {
    init.body = JSON.stringify(body);
  }

  const response = await fetch(`${BACKEND}${path}`, init);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText })) as { message?: string };
    throw new Error(error.message ?? `API Error ${response.status} on ${path}`);
  }

  // Handle empty responses (204 No Content)
  const text = await response.text();
  return (text ? JSON.parse(text) : null) as T;
}

// ─── Typed helpers ─────────────────────────────────────────────────────────

/** GET /api/admin/dashboard */
export const getDashboardStats = () => serverFetch<DashboardStats>("/admin/dashboard");

/** GET /api/admin/revenue-report?days= */
export const getRevenueReport = (days = 30) =>
  serverFetch<RevenueReportItem[]>(`/admin/revenue-report?days=${days}`);

/** GET /api/admin/customer-analytics */
export const getCustomerAnalytics = () =>
  serverFetch<CustomerAnalytics>("/admin/customer-analytics");

/** GET /api/admin/orders?status=&page=&limit= */
export const getAdminOrders = (params?: { status?: string; page?: number; limit?: number }) => {
  const q = new URLSearchParams();
  if (params?.status) q.set("status", params.status);
  if (params?.page) q.set("page", String(params.page));
  if (params?.limit) q.set("limit", String(params.limit));
  return serverFetch<AdminOrdersResponse>(`/admin/orders?${q}`);
};

/** GET /api/admin/users?search=&page=&limit= */
export const getAdminUsers = (params?: { search?: string; page?: number; limit?: number }) => {
  const q = new URLSearchParams();
  if (params?.search) q.set("search", params.search);
  if (params?.page) q.set("page", String(params.page));
  if (params?.limit) q.set("limit", String(params.limit));
  return serverFetch<AdminUsersResponse>(`/admin/users?${q}`);
};

/** GET /api/admin/audit-logs?limit=&entity=&adminId= */
export const getAuditLogs = (params?: { limit?: number; entity?: string }) => {
  const q = new URLSearchParams();
  if (params?.limit) q.set("limit", String(params.limit));
  if (params?.entity) q.set("entity", params.entity);
  return serverFetch<AuditLog[]>(`/admin/audit-logs?${q}`);
};

/** GET /api/products?page=&limit=&search= */
export const getProducts = (params?: { page?: number; limit?: number; search?: string }) => {
  const q = new URLSearchParams();
  if (params?.page) q.set("page", String(params.page));
  if (params?.limit) q.set("limit", String(params.limit));
  if (params?.search) q.set("search", params.search);
  return serverFetch<ProductsResponse>(`/products?${q}`);
};

/** GET /api/categories */
export const getCategories = () => serverFetch<Category[]>("/categories");

/** GET /api/brands */
export const getBrands = () => serverFetch<Brand[]>("/brands");

/** GET /api/coupons */
export const getCoupons = () => serverFetch<Coupon[]>("/coupons");

/** GET /api/reviews/product/:id */
export const getReviews = (productId: number) =>
  serverFetch<ReviewsResponse>(`/reviews/product/${productId}`);

/** GET /api/flash-sales */
export const getFlashSales = () => serverFetch<FlashSale[]>("/flash-sales");

/** GET /api/wallet/ledger?from=&to= */
export const getWalletLedger = (from: string, to: string) =>
  serverFetch<LedgerEntry[]>(`/wallet/ledger?from=${from}&to=${to}`);

/** GET /api/admin/low-stock?threshold= */
export const getLowStockVariants = (threshold = 5) =>
  serverFetch<LowStockVariant[]>(`/admin/low-stock?threshold=${threshold}`);

// ─── Types ─────────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalUsers: number;
  pendingOrders: number;
  recentOrders: AdminOrder[];
  lowStockCount: number;
}

export interface AdminOrder {
  id: number;
  userId: number;
  status: string;
  total: number;
  totalAmount?: number;
  createdAt: string;
  user?: { email: string; firstName?: string; lastName?: string };
}

export interface AdminOrdersResponse {
  data: AdminOrder[];
  total: number;
  page: number;
  pages: number;
}

export interface AdminUsersResponse {
  data: AdminUserRecord[];
  total: number;
  page: number;
  pages: number;
}

export interface AdminUserRecord {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  createdAt: string;
}

export interface RevenueReportItem {
  date: string;
  revenue: number;
  orders: number;
}

export interface CustomerAnalytics {
  totalCustomers: number;
  newCustomersThisMonth: number;
  returningCustomerRate: number;
  topCustomers: Array<{ id: number; email: string; totalSpent: number; orderCount: number }>;
}

export interface AuditLog {
  id: number;
  entity: string;
  action: string;
  adminId: number;
  details: string;
  createdAt: string;
}

export interface ProductsResponse {
  data: Product[];
  total: number;
  page: number;
  pages: number;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  basePrice: number;
  discountPct?: number;
  images: string[];
  isActive: boolean;
  category?: { id: number; name: string };
  brand?: { id: number; name: string };
  variants?: ProductVariant[];
  createdAt: string;
}

export interface ProductVariant {
  id: number;
  size: string;
  color: string;
  stock: number;
  sku: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  parentId?: number;
  children?: Category[];
  image?: string;
}

export interface Brand {
  id: number;
  name: string;
  slug: string;
  logoUrl?: string;
}

export interface Coupon {
  id: number;
  code: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  minOrderAmount?: number;
  maxUses?: number;
  usedCount: number;
  isActive: boolean;
  expiresAt?: string;
  createdAt: string;
}

export interface ReviewsResponse {
  data: Review[];
  total: number;
}

export interface Review {
  id: number;
  userId: number;
  productId: number;
  rating: number;
  title?: string;
  body?: string;
  createdAt: string;
  user?: { email: string; firstName?: string };
}

export interface FlashSale {
  id: number;
  name: string;
  slug: string;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  products: Array<{ productId: number; salePrice: number }>;
}

export interface LedgerEntry {
  id: number;
  userId: number;
  type: string;
  amount: number;
  reference: string;
  createdAt: string;
}

export interface LowStockVariant {
  id: number;
  productId: number;
  productName: string;
  sku: string;
  size: string;
  color: string;
  stock: number;
}
