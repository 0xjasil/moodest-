//cart.ts
import { z } from "zod";

export const addToCartSchema = z.object({
  variantId: z.string().min(1, "Variant ID is required"),
  quantity: z.number().min(1, "Quantity must be at least 1").default(1),
});

export const updateCartItemSchema = z.object({
  variantId: z.string().min(1, "Variant ID is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
});

export const removeFromCartSchema = z.object({
  variantId: z.string().min(1, "Variant ID is required"),
});

export const addToCartBundleInput = z.array(
  z.object({
    variantId: z.string().min(1, "Variant ID is required"),
    quantity: z.number().min(1, "Quantity must be at least 1"),
  })
);
