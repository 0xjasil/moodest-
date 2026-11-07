import { z } from "zod";

export const createBrandSchema = z.object({
  name: z.string().min(1, "Brand name is required"),
});

export const updateBrandSchema = z.object({
  id: z.string().min(1, "ID is required"),
  name: z.string().min(1, "Brand name is required").optional(),
});

export const deleteBrandSchema = z.object({
  id: z.string().min(1, "ID is required"),
});
