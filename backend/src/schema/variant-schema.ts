import { z } from "zod";
import { zfd } from "zod-form-data";

export const createVariantSchema = zfd.formData({
  productId: zfd.text(z.string().min(1, "Product is required")),
  sku: zfd.text(z.string().optional()).optional(),
  price: zfd.text(
    z.string()
      .transform((v) => parseFloat(v))
      .refine((v) => !isNaN(v) && v > 0, "Price must be positive")
  ),
  qty: zfd.text(
    z.string()
      .transform((v) => parseInt(v, 10))
      .refine((v) => !isNaN(v) && v >= 0, "Qty must be non-negative")
  ),
  images: zfd.repeatableOfType(zfd.file(z.instanceof(File)))
    .transform((files) => (files || []).filter(f => f && f.size > 0 && f.name !== ""))
    .refine((files) => files.length > 0, { message: "At least one image is required" }),
  // Optional JSON string of options: [{attributeId, valueId}]
  options: zfd.text(z.string().optional().transform((val) => {
    if (!val) return [] as { attributeId: string; valueId: string }[];
    try {
      const parsed = JSON.parse(val);
      return z.array(z.object({
        attributeId: z.string().min(1),
        valueId: z.string().min(1),
      })).parse(parsed);
    } catch {
      return [] as { attributeId: string; valueId: string }[];
    }
  })).optional(),
});


export const createVariantsSchema = zfd.formData({
  productId: zfd.text(z.string().min(1, "Product ID is required")),
  variants: zfd.text(z.string().transform((val) => {
      const parsed = JSON.parse(val);
      return z.array(z.object({
        price: z.number(),
        qty: z.number(),
        offerPrice: z.number().optional(),
        images: z.array(z.instanceof(File)),
        options: z.array(z.object({
          attributeId: z.string(),
          valueId: z.string(),
        })),
      })).parse(parsed);
  })),
});


export const updateVariantSchema = zfd.formData({
  id: zfd.text(z.string().min(1, "Variant id is required")),
  sku: zfd.text(z.string().min(1)).optional(),
  price: zfd.text(z.string().transform((v) => parseFloat(v))).optional(),
  qty: zfd.text(z.string().transform((v) => parseInt(v, 10))).optional(),
  images: zfd.repeatableOfType(zfd.file(z.instanceof(File))).optional(),
  options: zfd.text(z.string().optional()).optional(),
});

export const deleteVariantSchema = z.object({ id: z.string().min(1) });

export type CreateVariantValues = z.infer<typeof createVariantSchema>;
export type UpdateVariantValues = z.infer<typeof updateVariantSchema>;
export type CreateVariantsValues = z.infer<typeof createVariantsSchema>;
