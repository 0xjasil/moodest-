import { z } from "zod";

// ✅ Fetch user profile (GET) - usually no input
export const getUserProfileSchema = z.object({}).optional();

// ✅ Update user profile (PATCH)
export const updateUserProfileSchema = z.object({
  id: z.string().min(1, "User ID is required"),
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters")
    .optional(),
  email: z.string().email("Invalid email format").optional(),
  phone: z
    .string()
    .regex(/^[\+]?[1-9][\d]{0,15}$/, "Invalid phone number format")
    .optional()
    .nullable(),
   image: z.string().url('Invalid image URL').optional().nullable(),
  role: z.string().optional().nullable(),
  
});


// ✅ TypeScript inferred types
export type UpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>;
