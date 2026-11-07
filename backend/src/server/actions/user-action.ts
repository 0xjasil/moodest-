import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import uploadPhoto from "@/lib/upload";
import { Prisma } from "@prisma/client";

// Update schema
export const updateUserProfileSchema = z.object({
    name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters").optional(),
    email: z.string().email("Invalid email format").optional(),
    phone: z.string().regex(/^[\+]?[1-9][\d]{0,15}$/, "Invalid phone number format").optional(),
    photoFile: z
        .any() // Accept a File object from client
        .refine((file) => file === null || file instanceof File, "Invalid file")
        .optional()
        .nullable(),
});

export type UpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>;

export async function updateUserProfile(headers: Headers, input: UpdateUserProfileInput) {
    try {
        const session = await auth.api.getSession({ headers });
        if (!session) return { error: "Unauthorized", status: 401 };

        const validation = updateUserProfileSchema.safeParse(input);
        if (!validation.success) {
            return { error: "Validation failed", details: validation.error.issues, status: 400 };
        }

        const { name, email, phone, photoFile } = validation.data;

        let imageUrl: string | undefined;

        // If file is provided, upload to Cloudinary
        if (photoFile) {
            imageUrl = await uploadPhoto(photoFile); // now matches File type
        }

        // Check if email is already taken
        if (email) {
            const existingUser = await prisma.user.findFirst({
                where: {
                    email,
                    NOT: { id: session.user.id },
                },
            });
            if (existingUser) return { error: "Email is already taken", status: 400 };
        }

        // Prepare update data
        const updateData: Prisma.UserUpdateInput = {
            updatedAt: new Date(),
        };

        if (name !== undefined) updateData.name = name;
        if (email !== undefined) updateData.email = email;
        if (phone !== undefined) updateData.phone = phone;
        if (imageUrl !== undefined) updateData.image = imageUrl;

        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                image: true,
                emailVerified: true,
                createdAt: true,
                updatedAt: true,
                role: true,

            },
        });

        return { success: true, message: "Profile updated successfully", data: updatedUser };
    } catch (error) {
        console.error("Error updating user profile:", error);
        return { error: "Internal server error", status: 500 };
    }
}
