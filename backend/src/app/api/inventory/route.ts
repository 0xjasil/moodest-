// src/app/api/products/route.ts
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    // Extract query parameters from URL
    const { searchParams } = new URL(req.url);
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "10";
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("categoryId");
    const brandId = searchParams.get("brandId");
    const sortBy = searchParams.get("sortBy") || "createdAt"; // default sort by creation date
    const sortOrder = searchParams.get("sortOrder") || "desc"; // default descending
    
    if (!page || !limit) {
      return NextResponse.json({ error: "Missing page or limit" }, { status: 400 });
    }

    const pageNum = parseInt(page, 10);
    const pageSize = parseInt(limit, 10);

    if (isNaN(pageNum) || isNaN(pageSize)) {
      return NextResponse.json({ error: "Invalid page or limit" }, { status: 400 });
    }

    // Validate sort parameters
    const validSortFields = ["name", "createdAt", "qty", "price", "updatedAt"];
    const validSortOrders = ["asc", "desc"];

    if (!validSortFields.includes(sortBy)) {
      return NextResponse.json({ 
        error: `Invalid sortBy field. Valid options: ${validSortFields.join(", ")}` 
      }, { status: 400 });
    }

    if (!validSortOrders.includes(sortOrder)) {
      return NextResponse.json({ 
        error: `Invalid sortOrder. Valid options: ${validSortOrders.join(", ")}` 
      }, { status: 400 });
    }

 const where: Prisma.ProductVariantWhereInput = {
  AND: [
    search
      ? {
          OR: [
            { product: { name: { contains: search, mode: "insensitive" } } },
            { product: { description: { contains: search, mode: "insensitive" } } },
          ],
        }
      : {},
    categoryId ? { product: { categoryId } } : {},
    brandId ? { product: { brandId } } : {},
  ],
};

    // Create orderBy object based on sort parameters,
    const orderBy: Prisma.ProductVariantOrderByWithRelationInput = { [sortBy]: sortOrder as "asc" | "desc" };


   const [variants, total] = await Promise.all([
  prisma.productVariant.findMany({
    where,
    skip: (pageNum - 1) * pageSize,
    take: pageSize,
    orderBy,
    include: {
      product: {
        include: {
          brand: { select: { id: true, name: true } },
          category: { select: { id: true, name: true } },
          subCategory: { select: { id: true, name: true } },
        },
      },
      options: { include: { attribute: true, attributeValue: true } },
    },
  }),
  prisma.productVariant.count({ where }),
]);

    // Flatten to variant rows for inventory management
   const results = variants.map((v) => ({
  id: v.id,
  productId: v.product.id,
  name: v.product.name,
  sku: v.sku,
  options: v.options.map(o => `${o.attribute.name}: ${o.attributeValue.value}`).join(", "),
  price: v.price,
  qty: v.qty,
  brand: v.product.brand,
  category: v.product.category,
  subCategory: v.product.subCategory,
  createdAt: v.createdAt,
  updatedAt: v.updatedAt,
  isLowStock: v.qty <= 10,
}));


    return NextResponse.json({
      data: results,
      meta: {
        total,
        page: pageNum,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        sortBy,
        sortOrder,
      }
    }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { variantIds, qty } = body;
    
    // Validate input
    if (!variantIds || !Array.isArray(variantIds) || variantIds.length === 0) {
      return NextResponse.json({ 
        error: "variantIds array is required and must not be empty." 
      }, { status: 400 });
    }
    
    if (qty === undefined || qty === null) {
      return NextResponse.json({ 
        error: "qty is required." 
      }, { status: 400 });
    }

    const quantity = parseInt(qty, 10);
    
    if (isNaN(quantity) || quantity < 0) {
      return NextResponse.json({ 
        error: "Invalid quantity. Must be a non-negative number." 
      }, { status: 400 });
    }

    const updatedVariants: Prisma.ProductVariantGetPayload<{ include: { product: true } }>[] = [];
    const notifications = [];
    const failedUpdates = [];

    // Process each product update
    for (const variantId of variantIds) {
      if (!variantId || typeof variantId !== 'string') {
        failedUpdates.push({
          variantId: variantId || 'undefined',
          error: 'Invalid variant ID'
        });
        continue;
      }

      try {
        const variant = await prisma.productVariant.update({
          where: { id: variantId },
          data: { qty: quantity },
          include: { product: true },
        });

        updatedVariants.push(variant);

        // Check if low stock notification needed for parent product
        if (variant.qty <= 10) {
          const exists = await prisma.notification.findFirst({
            where: { 
              productId: variant.productId, 
              seen: false,
              message: { contains: "low on stock" }
            },
          });

          if (!exists) {
            const notification = await prisma.notification.create({
              data: {
                productId: variant.productId,
                message: `${variant.product.name} (${variant.sku}) is low on stock (${variant.qty} left).`,
              },
            });
            notifications.push(notification);
          }
        }
      } catch (error) {
        console.error(`Error updating variant ${variantId}:`, error);
        failedUpdates.push({
          variantId,
          error: 'Variant not found or update failed'
        });
      }
    }

    // Prepare response
    const response = {
      message: `Updated ${updatedVariants.length} out of ${variantIds.length} variants with quantity ${quantity}.`,
      summary: {
        total: variantIds.length,
        successful: updatedVariants.length,
        failed: failedUpdates.length,
        notificationsCreated: notifications.length,
      },
      updatedVariants,
      ...(failedUpdates.length > 0 && { failedUpdates }),
    };

    return NextResponse.json(response, { status: 200 });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}