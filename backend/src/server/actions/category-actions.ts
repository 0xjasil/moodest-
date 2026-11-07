"use server";

import { revalidatePath } from "next/cache";
import { actionClient } from "@/lib/safe-action";
import {prisma} from "@/lib/prisma";
import uploadPhoto from "@/lib/upload";
import cloudinary from "@/lib/cloudinary";
import { zfd } from "zod-form-data";
import { z } from "zod";
import { getAuthenticatedAdmin } from "./admin-user-action";

// ✅ Schemas
const createCategorySchema = zfd.formData({
  name: zfd.text(),
  image: zfd.file(z.instanceof(File)), // must upload
});

const updateCategorySchema = zfd.formData({
  id: zfd.text(),
  name: zfd.text().optional(),
  image: zfd.file(z.instanceof(File)).optional(), // optional on update
});

const deleteCategorySchema = zfd.formData({
  id: zfd.text(),
});

// ✅ CREATE Category
export const createCategoryAction = actionClient
  .inputSchema(createCategorySchema)
  .action(async ({ parsedInput }) => {
    try {
      await getAuthenticatedAdmin();
      
      let photoUrl: string = "";
      console.log("started");
      
      if (parsedInput.image && parsedInput.image.size > 0) {
        photoUrl = await uploadPhoto(parsedInput.image);
      }
      if (!photoUrl) {
        return { 
          success: false, 
          error: "Image is required" 
        };
      }

      const existing = await prisma.category.findFirst({ 
        where: { name: parsedInput.name } 
      });
      
      if (existing) {
        console.log('Category already exist');
        return { 
          success: false, 
          error: "Category with this name already exists" 
        };
      }
      
      const category = await prisma.category.create({
        data: {
          name: parsedInput.name,
          image: photoUrl,
        },
      });

      revalidatePath("/category");
      return { 
        success: true, 
        data: category, 
        message: "Category created successfully" 
      };
    } catch (error) {
      console.error("Create category error:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to create category" 
      };
    }
  });

export const getCategorylistForDropdown = async () => {
  return await prisma.category.findMany({
    select: { id: true, name: true },
  });
};

// ✅ UPDATE Category
export const updateCategoryAction = actionClient
  .inputSchema(updateCategorySchema)
  .action(async ({ parsedInput }) => {
    try {
      await getAuthenticatedAdmin();

      let photoUrl: string | undefined;
      if (parsedInput.image && parsedInput.image.size > 0) {
        photoUrl = await uploadPhoto(parsedInput.image);
      }

      const existing = await prisma.category.findFirst({ 
        where: { 
          name: { equals: parsedInput.name, mode: "insensitive" } 
        } 
      });
      
      if (existing && existing.id !== parsedInput.id) {
        return { 
          success: false, 
          error: "Another category with this name already exists" 
        };
      }
      
      const updated = await prisma.category.update({
        where: { id: parsedInput.id },
        data: {
          ...(parsedInput.name && { name: parsedInput.name }),
          ...(photoUrl && { image: photoUrl }),
        },
      });

      revalidatePath("/category");
      return { 
        success: true, 
        data: updated, 
        message: "Category updated successfully" 
      };
    } catch (error) {
      console.error("Update category error:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to update category" 
      };
    }
  });

// ✅ DELETE Category
export const deleteCategoryAction = actionClient
  .inputSchema(deleteCategorySchema)
  .action(async ({ parsedInput }) => {
    try {
      await getAuthenticatedAdmin();

      const category = await prisma.category.findUnique({
        where: { id: parsedInput.id },
      });
      
      if (!category) {
        return { 
          success: false, 
          error: "Category not found" 
        };
      }

      // Optional: also delete from Cloudinary
      if (category.image) {
        const publicId = category.image.split("/").pop()?.split(".")[0];
        if (publicId) {
          await cloudinary.uploader.destroy(`Deco moja/${publicId}`);
        }
      }

      await prisma.category.delete({ where: { id: parsedInput.id } });

      revalidatePath("/category");
      return { 
        success: true, 
        message: "Category deleted successfully" 
      };
    } catch (error) {
      console.error("Delete category error:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to delete category" 
      };
    }
  });