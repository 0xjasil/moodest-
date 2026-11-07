/**
 * Moryelle Beauté - TypeScript Domain Models
 * Strictly aligned with the NestJS backend Prisma entities & DTOs
 */

export type Role =
  | "USER"
  | "ADMIN"
  | "CS_AGENT"
  | "OPS"
  | "FINANCE"
  | "MERCH"
  | "SUPER_ADMIN";

export interface User {
  id: number;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  role: Role;
  tokenVersion?: number;
  failedLoginAttempts?: number;
  lockedUntil?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Brand {
  id: number;
  name: string;
  slug: string;
  logoUrl?: string | null;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  parentId?: number | null;
  children?: Category[];
}

export interface Variant {
  id: number;
  productId: number;
  size: string;
  color: string;
  stock: number;
  sku: string;
  product?: Product;
}

export interface BackendProduct {
  id: number;
  name: string;
  slug: string;
  description: string;
  brandId: number;
  categoryId: number;
  basePrice: number;
  discountPct?: number | null;
  images: string[];
  tags?: string[];
  brand?: Brand;
  category?: Category;
  variants?: Variant[];
  reviews?: Review[];
  avgRating?: number;
  reviewCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

/** Product shape expected by existing customer frontend components */
export interface Product {
  id: string;
  backendId?: number;
  name: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  rating: number;
  reviewCount: number;
  image: string;
  images?: string[];
  badge?: string;
  category: string;
  brand: string;
  description?: string;
  variants?: Variant[];
  variantId?: number;
}

export interface CartItem {
  id: number;
  cartId: number;
  variantId: number;
  quantity: number;
  variant?: Variant & {
    product?: BackendProduct;
  };
}

export interface Cart {
  id: number;
  userId: number;
  items: CartItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatedReservation {
  reservationId: number;
  expiresAt: string | Date;
  items: {
    variantId: number;
    quantity: number;
    lockedPrice: number;
    lockedMrp: number;
  }[];
  subtotal: number;
}

export interface Address {
  id: number;
  userId?: number;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
  // UI compatibility aliases
  name?: string;
  addressLine1?: string;
  addressLine2?: string;
  country?: string;
}

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export interface OrderItem {
  id: number;
  orderId: number;
  variantId: number;
  quantity: number;
  price: number;
  variant?: Variant & {
    product?: BackendProduct;
  };
}

export interface Order {
  id: number;
  userId: number;
  addressId: number;
  reservationId?: number | null;
  status: OrderStatus;
  subtotal: number;
  tax: number;
  shippingFee: number;
  discount: number;
  total: number;
  currency: string;
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  paymentId?: string | null;
  couponCode?: string | null;
  walletAmountUsed?: number | null;
  items: OrderItem[];
  address?: Address;
  createdAt: string;
  updatedAt: string;
  // UI compatibility aliases
  totalAmount?: number;
  shippingAddress?: string;
  notes?: string;
}

export interface Coupon {
  id: number;
  code: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  minOrderAmount: number;
  maxDiscount?: number | null;
  expiresAt?: string | null;
  isActive: boolean;
}

export interface CouponValidationResult {
  valid: boolean;
  discount: number;
  coupon?: Coupon;
}

export interface Review {
  id: number;
  productId: number;
  userId: number;
  rating: number;
  title?: string | null;
  body?: string | null;
  verified?: boolean;
  createdAt: string;
  updatedAt?: string;
  user?: {
    id: number;
    firstName?: string | null;
    lastName?: string | null;
  };
  // UI compatibility alias
  comment?: string;
}

export interface ProductReviewsResponse {
  reviews: Review[];
  total: number;
  page: number;
  limit: number;
  avgRating: number;
}

export interface Wallet {
  id: number;
  userId: number;
  balance: number;
  currency: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WalletTransaction {
  id: number;
  walletId: number;
  amount: number;
  type: "CREDIT" | "DEBIT";
  description?: string | null;
  referenceId?: string | null;
  createdAt: string;
}

export interface PaymentIntentResult {
  clientSecret: string;
  amount: number;
}

