'use server';

import { actionClient } from "@/lib/safe-action";
import {prisma} from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { 
  createBrandSchema, 
  updateBrandSchema, 
  deleteBrandSchema 
} from "@/schema/brand-schema";
import { getAuthenticatedAdmin } from "./admin-user-action";

// ✅ CREATE Brand
export const createBrandAction = actionClient
  .inputSchema(createBrandSchema)
  .action(async ({ parsedInput }) => {
    try {
      await getAuthenticatedAdmin();
      
      const existing = await prisma.brand.findFirst({ 
        where: { name: { equals: parsedInput.name, mode: "insensitive" } } 
      });
      
      if (existing) {
        return {
          success: false,
          error: "Brand with this name already exists"
        };
      }
      
      const brand = await prisma.brand.create({
        data: {
          name: parsedInput.name,
        },
      });
      
      revalidatePath('/brand');
      return { 
        success: true, 
        data: brand, 
        message: 'Brand added successfully' 
      };
    } catch (error) {
      console.error(error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to add brand"
      };
    }
  });

export const getBrandlistForDropdown = async () => {
  return await prisma.brand.findMany({
    select: { id: true, name: true },
  });
};

// ✅ UPDATE Brand
export const updateBrandAction = actionClient
  .inputSchema(updateBrandSchema)
  .action(async ({ parsedInput }) => {
    const { id, ...data } = parsedInput;
    try {
      await getAuthenticatedAdmin();

      const existing = await prisma.brand.findFirst({ 
        where: { name: { equals: data.name, mode: "insensitive" } } 
      });
      
      if (existing && existing.id !== id) {
        return {
          success: false,
          error: "Another brand with this name already exists"
        };
      }
      
      const updated = await prisma.brand.update({
        where: { id },
        data: {
          name: data.name,
        },
      });
      
      revalidatePath('/brand');
      return { 
        success: true, 
        data: updated, 
        message: 'Brand updated successfully' 
      };
    } catch (error) {
      console.error(error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update brand"
      };
    }
  });

// ✅ DELETE Brand
export const deleteBrandAction = actionClient
  .inputSchema(deleteBrandSchema)
  .action(async ({ parsedInput }) => {
    try {
      await getAuthenticatedAdmin();

      // Check if any product is using this brand
      const productUsingBrand = await prisma.product.findFirst({
        where: { brandId: parsedInput.id },
      });

      if (productUsingBrand) {
        return {
          success: false,
          error: "Cannot delete: Brand is used in one or more products."
        };
      }

      await prisma.brand.delete({
        where: { id: parsedInput.id },
      });

      revalidatePath('/brand');
      return { 
        success: true, 
        message: 'Brand deleted successfully' 
      };
    } catch (error) {
      console.error("Delete Brand Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete brand"
      };
    }
  });