import { z } from "zod";

export const addToWishlistSchema = z.object({
  variantId: z.string().min(1, "Variant is required"),
});

export const removeFromWishlistSchema = z.object({
  variantId: z.string().min(1, "Variant is required"),
});

export const getWishlistSchema = z.object({});

export type AddToWishlistInput = z.infer<typeof addToWishlistSchema>;
export type RemoveFromWishlistInput = z.infer<typeof removeFromWishlistSchema>;

