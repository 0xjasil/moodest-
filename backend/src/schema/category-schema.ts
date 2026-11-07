import { z } from "zod";
import { zfd } from "zod-form-data";

export const createCategorySchema = zfd.formData({
  name: zfd.text(z.string().min(1, "Category name is required")),
  image: zfd.file(z.instanceof(File)), // Handle file upload for image
});

export const updateCategorySchema = zfd.formData({
  id: zfd.text(z.string().min(1, "ID is required")),
  name: zfd.text(z.string().min(1, "Category name is required")).optional(),
  image: zfd.file(z.instanceof(File)).optional(), // Handle optional file upload
  
});

export const deleteCategorySchema = zfd.formData({
  id: zfd.text(z.string().min(1, "ID is required")),
});