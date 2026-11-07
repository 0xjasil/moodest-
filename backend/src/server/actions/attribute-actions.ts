"use server";

import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdmin } from "./admin-user-action";

type ActionResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

export async function getAttributesWithValues() {
  const attrs = await prisma.attribute.findMany({
    include: {
      values: true,
    },
    orderBy: { name: "asc" },
  });
  return attrs.map((a) => ({
    id: a.id,
    name: a.name,
    values: a.values.map((v) => ({ id: v.id, value: v.value })),
  }));
}


export async function getAttributesList() {
 try {
    const attrs = await prisma.attribute.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
    return {
      success: true,
      data: attrs,
    };
  } catch (e) {
    console.log("Error fetching attributes list:", e);
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to fetch attributes list"
    };
  }
}

export async function getAttributeValues(attributeId: string) {
  try {
    const values = await prisma.attributeValue.findMany({
      where: { attributeId },
      select: { id: true, value: true },
      orderBy: { value: "asc" },
    });
    return {
      success: true,
      data: values,
    };
  } catch (e) {
    console.log("Error fetching attribute values:", e);
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to fetch attribute values"
    };
  }
}

// Create a new attribute
export async function createAttribute(name: string): Promise<ActionResult> {
  try {
    await getAuthenticatedAdmin();
    
    const existing = await prisma.attribute.findFirst({ 
      where: { name: { equals: name, mode: "insensitive" } } 
    });
    
    if (existing) {
      return {
        success: false,
        error: "Attribute with this name already exists"
      };
    }
    
    const attribute = await prisma.attribute.create({ data: { name } });
    
    return {
      success: true,
      data: attribute
    };
  } catch (e) {
    console.log("Error creating attribute:", e);
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to create attribute"
    };
  }
}

// Rename an attribute
export async function updateAttribute(id: string, name: string): Promise<ActionResult> {
  try {
    await getAuthenticatedAdmin();
    
    const existing = await prisma.attribute.findFirst({ 
      where: { name: { equals: name, mode: "insensitive" } } 
    });
    
    if (existing && existing.id !== id) {
      return {
        success: false,
        error: "Another attribute with this name already exists"
      };
    }
    
    const attribute = await prisma.attribute.update({ 
      where: { id }, 
      data: { name } 
    });
    
    return {
      success: true,
      data: attribute
    };
  } catch (e) {
    console.log("Error updating attribute:", e);
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to update attribute"
    };
  }
}

// Create a value under an attribute
export async function createAttributeValue(attributeId: string, value: string): Promise<ActionResult> {
  try {
    await getAuthenticatedAdmin();
    
    const attributeValue = await prisma.attributeValue.create({ 
      data: { attributeId, value } 
    });
    
    return {
      success: true,
      data: attributeValue
    };
  } catch (e) {
    console.log("Error creating attribute value:", e);
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to create attribute value"
    };
  }
}

// Update a value
export async function updateAttributeValue(id: string, value: string): Promise<ActionResult> {
  try {
    await getAuthenticatedAdmin();
    
    const attributeValue = await prisma.attributeValue.update({ 
      where: { id }, 
      data: { value } 
    });
    
    return {
      success: true,
      data: attributeValue
    };
  } catch (e) {
    console.log("Error updating attribute value:", e);
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to update attribute value"
    };
  }
}

// Delete an attribute and all its values
export async function deleteAttribute(id: string): Promise<ActionResult> {
  try {
    await getAuthenticatedAdmin();
    
    // Get all values for this attribute
    const attributeValues = await prisma.attributeValue.findMany({
      where: { attributeId: id },
      select: { id: true }
    });
    
    // Check if any of the attribute values are being used by product variants
    if (attributeValues.length > 0) {
      const usageCount = await prisma.variantOption.count({
        where: { 
          valueId: { 
            in: attributeValues.map(v => v.id) 
          } 
        }
      });
      
      if (usageCount > 0) {
        return {
          success: false,
          error: `Cannot delete this attribute. One or more of its values are currently being used by ${usageCount} product variant(s). Please remove them from all variants first.`
        };
      }
    }
    
    // Delete the attribute (this will cascade delete all its values due to the schema relationship)
    const deleted = await prisma.attribute.delete({ where: { id } });
    
    return {
      success: true,
      data: deleted
    };
  } catch (e) {
    console.log("Error deleting attribute:", e);
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to delete attribute"
    };
  }
}

// Delete a value
export async function deleteAttributeValue(id: string): Promise<ActionResult> {
  try {
    await getAuthenticatedAdmin();
    
    // Check if this attribute value is being used by any product variants
    const usageCount = await prisma.variantOption.count({
      where: { valueId: id }
    });
    
    if (usageCount > 0) {
      return {
        success: false,
        error: `Cannot delete this attribute value. It is currently being used by ${usageCount} product variant(s). Please remove it from all variants first.`
      };
    }
    
    const deleted = await prisma.attributeValue.delete({ where: { id } });
    
    return {
      success: true,
      data: deleted
    };
  } catch (e) {
    console.log("Error deleting attribute value:", e);
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to delete attribute value"
    };
  }
}