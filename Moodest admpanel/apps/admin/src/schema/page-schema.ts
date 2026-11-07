import { z } from "zod";

export const createPageSchema = z.object({
  title: z.string().min(1, "Page title is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug can only contain lowercase letters, numbers and hyphens"
    ),
  content: z.string().optional(),
  status: z.enum(["draft", "published"]),
  isActive: z.boolean().optional(),
});

export const updatePageSchema = createPageSchema.extend({
  id: z.string().min(1, "ID is required"),
});

export type CreatePageSchema = z.infer<typeof createPageSchema>;
