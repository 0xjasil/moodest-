import { z } from "zod";
import { zfd } from "zod-form-data";


export const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  brandId: z.string().optional(),
  categoryId: z.string().optional(),
  subcategoryId: z.string().optional(),
  image: z.instanceof(File),
  isCustomerFavorite: z.boolean().default(false),
  isNewArrival: z.boolean().default(false),
});


export const createProductFormDataSchema = zfd.formData({
  name: zfd.text(z.string().min(1, "Product name is required")),
  description: zfd.text(z.string().optional()),
  brandId: zfd.text(z.string().optional()),
  categoryId: zfd.text(z.string().optional()),
  subcategoryId: zfd.text(z.string().optional()),
  image: zfd.file(z.instanceof(File)),
  isCustomerFavorite: zfd.checkbox(),
  isNewArrival: zfd.checkbox(),
});

export const updateProductSchema = zfd.formData({
  id: zfd.text(z.string().min(1, "ID is required")),
  name: zfd.text(z.string().min(1, "Product name is required")).optional(),
  description: zfd.text(z.string()).optional(),
  brandId: zfd.text(z.string()).optional(),
  categoryId: zfd.text(z.string()).optional(),
  subcategoryId: zfd.text(z.string()).optional(),
  image: zfd.file(z.instanceof(File)).optional(),
  isCustomerFavorite: zfd.checkbox().optional(),
  isNewArrival: zfd.checkbox().optional(),
});

export const deleteProductSchema = z.object({
  id: z.string().min(1, "ID is required"),
});



const VariantOptionSchema = z.object({
  attributeId: z.string().cuid().or(z.string().regex(/^[0-9a-fA-F]{24}$/)), 
  valueId: z.string().cuid().or(z.string().regex(/^[0-9a-fA-F]{24}$/)),       
});


const FinalizedVariantSchema = z.object({
  
  price: z.number().positive().min(0.01),
  offerPrice: z.number().optional(), 
  qty: z.number().int().min(0),
  
  
  images: z.string().url().array().default([]),

  
  attributes: z.array(VariantOptionSchema).min(1, "A variant must have at least one attribute."),
});


const BaseProductSchema = z.object({
  name: z.string().min(3, "Name is too short."),
  description: z.string().optional(),
  
  
  brandId: z.string().cuid().or(z.string().regex(/^[0-9a-fA-F]{24}$/)).nullable(), 
  categoryId: z.string().cuid().or(z.string().regex(/^[0-9a-fA-F]{24}$/)),
  subCategoryId: z.string().cuid().or(z.string().regex(/^[0-9a-fA-F]{24}$/)),
  
  
  mainImage: z.string().url(),
});



export const CreateProductInputSchema = z.object({
  productData: BaseProductSchema,
  variantsData: z.array(FinalizedVariantSchema).min(1, "A configurable product must have at least one variant."),
});

export type CreateProductInput = z.infer<typeof CreateProductInputSchema>;


export type CreateProductValues = z.infer<typeof createProductSchema>;
export type UpdateProductValues = z.infer<typeof updateProductSchema>;