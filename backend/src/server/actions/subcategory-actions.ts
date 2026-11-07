'use server';

import { actionClient } from "@/lib/safe-action";
import {prisma} from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { 
  createSubCategorySchema, 
  updateSubCategorySchema, 
  deleteSubCategorySchema 
} from "@/schema/subcategory-schema";
import { getAuthenticatedAdmin } from "./admin-user-action";

// ✅ CREATE SubCategory
export const createSubCategoryAction = actionClient
  .inputSchema(createSubCategorySchema)
  .action(async ({ parsedInput }) => {
    try {
      await getAuthenticatedAdmin();

      const existing = await prisma.subCategory.findFirst({ 
        where: { name: { equals: parsedInput.name, mode: "insensitive" } } 
      });
      
      if (existing) {
        return {
          success: false,
          error: "SubCategory with this name already exists"
        };
      }
      
      const subcategory = await prisma.subCategory.create({
        data: {
          name: parsedInput.name,
          categoryId: parsedInput.categoryId,
        },
      });
      
      revalidatePath('/subcategories');
      return { 
        success: true, 
        data: subcategory, 
        message: 'SubCategory added successfully' 
      };
    } catch (error) {
      console.error(error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to add SubCategory"
      };
    }
  });

export const getSubCategorylistForDropdown = async () => {
  return await prisma.subCategory.findMany({
    select: { id: true, name: true, categoryId: true },
  });
};

export const getSubCategorylistByCategory = async (categoryId: string) => {
  if (!categoryId) return [] as { id: string; name: string }[];
  const list = await prisma.subCategory.findMany({
    where: { categoryId },
    select: { id: true, name: true },
  });
  return list;
};

// ✅ UPDATE SubCategory
export const updateSubCategoryAction = actionClient
  .inputSchema(updateSubCategorySchema)
  .action(async ({ parsedInput }) => {
    const { id, ...data } = parsedInput;
    try {
      await getAuthenticatedAdmin();
      
      const existing = await prisma.subCategory.findFirst({ 
        where: { name: { equals: data.name, mode: "insensitive" } } 
      });
      
      if (existing && existing.id !== id) {
        return {
          success: false,
          error: "Another SubCategory with this name already exists"
        };
      }
      
      const updated = await prisma.subCategory.update({
        where: { id },
        data: {
          name: data.name,
          categoryId: data.categoryId,
        },
      });
      
      revalidatePath('/subcategories');
      return { 
        success: true, 
        data: updated, 
        message: 'SubCategory updated successfully' 
      };
    } catch (error) {
      console.error(error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update SubCategory"
      };
    }
  });

// ✅ DELETE SubCategory
export const deleteSubCategoryAction = actionClient
  .inputSchema(deleteSubCategorySchema)
  .action(async ({ parsedInput }) => {
    try {
      await getAuthenticatedAdmin();
      
      // Check if any product is using this subcategory
      const productUsingSubCategory = await prisma.product.findFirst({
        where: { subCategoryId: parsedInput.id },
      });

      if (productUsingSubCategory) {
        return {
          success: false,
          error: "Cannot delete: SubCategory is used in one or more products."
        };
      }

      await prisma.subCategory.delete({
        where: { id: parsedInput.id },
      });

      revalidatePath('/subcategories');
      return { 
        success: true, 
        message: 'SubCategory deleted successfully' 
      };
    } catch (error) {
      console.error("Delete SubCategory Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete SubCategory"
      };
    }
  });