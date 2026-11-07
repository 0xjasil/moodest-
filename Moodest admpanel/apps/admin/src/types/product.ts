import { ColumnDef } from "@tanstack/react-table";

// Admin product type for the NestJS backend (integer IDs)
export interface AdminProduct {
  id: string | number;
  name: string;
  description?: string | null;
  // NestJS backend: images[] array; first image used as thumbnail
  image?: string;
  images?: string[];
  brandId?: string | number | null;
  categoryId?: string | number | null;
  basePrice?: number;
  discountPct?: number;
  isActive?: boolean;
  createdAt: string | Date;
  updatedAt?: string | Date;
  // Computed / relations
  price?: number;
  qty?: number;
  brand?: { id: string | number; name: string } | null;
  category?: { id: string | number; name: string } | null;
  variants?: VariantDetail[];
}

export type ProductDetail = {
  id: string;
  name: string;
  description: string | null;
  image: string;
  subimage?: string[];
  brandId: string | null;
  categoryId: string | null;
  subCategoryId: string | null;
  isCustomerFavorite?: boolean;
  isNewArrival?: boolean;
  createdAt: Date;
  updatedAt: Date;
  brand: {
    id: string;
    name: string;
  } | null;
  category: {
    id: string;
    name: string;
  } | null;
  subCategory: {
    id: string;
    name: string;
  } | null;
  variants: VariantDetail[];
};

// Props for product table component
export interface ProductTableProps<TValue> {
  columns: ColumnDef<AdminProduct, TValue>[];
  data: AdminProduct[];
}

// Dropdown / select option type for product usage (like in sales, purchase, etc.)
export interface ProductOption {
  id: string;
  name: string;
  tax: string;
  sellingPrice: number;
  stock: number;
  excTax: number;   // price excluding tax
  incTax: number;   // price including tax
  margin: number;   // profit margin percentage
  quantity: number; // quantity to order/sell
}

export type ProductWithRelations = {
  id: string | number;
  name: string;
  slug?: string;
  description?: string | null;
  basePrice?: number;
  brand?: { id: string | number; name: string } | null;
  category?: { id: string | number; name: string } | null;
  subCategory?: { id: string | number; name: string } | null;
  variants?: VariantDetail[];
  images?: string[];
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

export type VariantOptionDetail = {
  id: string;
  productVariantId: string;
  attributeId: string;
  valueId: string;
  attribute: {
    id: string;
    name: string;
  };
  attributeValue: {
    id: string;
    value: string;
  };
};

export type VariantDetail = {
  id: string;
  productId: string;
  sku: string;
  size?: string;
  color?: string;
  colorHex?: string | null;
  price: number;
  offerPrice?: number | null;
  qty: number;
  isActive?: boolean;
  images?: string[];
  createdAt?: Date | string;
  updatedAt?: Date | string;
  options?: VariantOptionDetail[];
  reservations?: Array<{
    id: string;
    quantity: number;
    status: string;
    expiresAt?: string | Date;
  }>;
};

export interface AbayaVariant {
  id?: string;
  productId?: string;
  size: string;
  color: string;
  colorHex?: string | null;
  sku: string;
  price: number | string;
  offerPrice?: number | string | null;
  qty: number;
  isActive: boolean;
  isNew?: boolean;
  isModified?: boolean;
  reservations?: Array<{
    id: string;
    quantity: number;
    status: string;
    expiresAt?: string | Date;
  }>;
}

export type AttributeWithValues = {
  id: string;
  name: string;
  values: {
    id: string;
    value: string;
  }[];
};

