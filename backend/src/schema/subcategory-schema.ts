import { z } from "zod";


// Create SubCategory
export const createSubCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  categoryId: z.string().min(1, "Category ID is required"),
});

// Update SubCategory
export const updateSubCategorySchema = z.object({
  id: z.string().min(1, "ID is required"),
  name: z.string().min(1, "Name is required").optional(),
  categoryId: z.string().optional(),
});

// Delete SubCategory
export const deleteSubCategorySchema = z.object({
  id: z.string().min(1, "ID is required"),
});
