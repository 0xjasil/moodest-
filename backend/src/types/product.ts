import { Prisma } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";

// Admin product type shaped for UI with computed fields based on variants
export interface AdminProduct {
  id: string;
  name: string;
  description?: string | null;
  image: string;
  brandId?: string | null;
  categoryId?: string | null;
  subCategoryId?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  // Computed from variants
  price: number; // first variant's price
  qty: number; // sum of all variants qty
  // Relations
  brand?: { id: string; name: string } | null;
  category?: { id: string; name: string } | null;
  subCategory?: { id: string; name: string } | null;
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

export type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    brand: true;
    category: true;
    subCategory: true;
    variants: {
      include: {
        options: {
          include: {
            attribute: true;
            attributeValue: true;
          }
        }
      }
    }
  }
}>;

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
  price: number;
  offerPrice?: number | null;
  qty: number;
  images: string[];
  createdAt: Date;
  updatedAt: Date;
  options: VariantOptionDetail[];
};

export type AttributeWithValues = {
  id: string;
  name: string;
  values: {
    id: string;
    value: string;
  }[];
};

