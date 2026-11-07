import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdmin } from "@/server/actions/admin-user-action";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    await getAuthenticatedAdmin()
    const { searchParams } = new URL(request.url);
    
    // Extract all possible parameters
    const categoryId = searchParams.get("categoryId");
    const subCategoryId = searchParams.get("subCategoryId");
    const brandIds = searchParams.get("brandId");
    const sort = searchParams.get("sort") || "created_desc";
    const search = searchParams.get("search");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10")));

    // Build where clause dynamically - only add conditions if they exist
    const whereClause: Record<string, unknown> = {};
    
    // Category filter - only add if categoryId exists and is not empty
    if (categoryId && categoryId.trim().length > 0) {
      whereClause.categoryId = categoryId;
    }
    
    // SubCategory filter - only if both subCategoryId and categoryId exist
    if (subCategoryId && subCategoryId.trim().length > 0 && categoryId && categoryId.trim().length > 0) {
      whereClause.subCategoryId = subCategoryId;
    }
    
    // Brand filter - only add if brandIds exist and contain valid IDs
    if (brandIds && brandIds.trim().length > 0) {
      const brandIdArray = brandIds.split(",")
        .map(id => id.trim())
        .filter(id => id.length > 0);
      
      if (brandIdArray.length > 0) {
        whereClause.brandId = { in: brandIdArray };
      }
    }

    // Search filter - only add if search term exists
    if (search && search.trim().length > 0) {
      whereClause.OR = [
        {
          name: {
            contains: search.trim(),
            mode: 'insensitive' as const
          }
        },
        {
          description: {
            contains: search.trim(),
            mode: 'insensitive' as const
          }
        }
      ];
    }

    // Sorting logic (price/stock are now variant-derived; keep supported sorts only)
    let orderBy: Record<string, "asc" | "desc"> = { createdAt: "desc" };
    switch (sort) {
      case "name_asc":
        orderBy = { name: "asc" };
        break;
      case "name_desc":
        orderBy = { name: "desc" };
        break;
      case "created_asc":
        orderBy = { createdAt: "asc" };
        break;
      default:
        orderBy = { createdAt: "desc" };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get total count for pagination (with same filters applied)
    const totalCount = await prisma.product.count({
      where: whereClause,
    });

    // Fetch products with filters, search, sorting, and pagination
    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          }
        },
        brand: {
          select: {
            id: true,
            name: true,
          }
        },
        subCategory: {
          select: {
            id: true,
            name: true,
          }
        },
        variants: {
          select: {
            id: true,
            price: true,
            qty: true,
            createdAt: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy,
      skip,
      take: limit,
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    // Map to admin list shape with computed price and qty
    const mapped = products.map((p) => {
      const firstVariant = p.variants[0];
      const totalQty = p.variants.reduce((acc, v) => acc + (v.qty || 0), 0);
      return {
        id: p.id,
        name: p.name,
        description: p.description,
        image: p.image,
        brandId: p.brandId ?? null,
        categoryId: p.categoryId ?? null,
        subCategoryId: p.subCategoryId ?? null,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        price: firstVariant ? firstVariant.price : 0,
        qty: totalQty,
        brand: p.brand ?? null,
        category: p.category ?? null,
        subCategory: p.subCategory ?? null,
      };
    });

    return NextResponse.json({
      success: true,
      data: mapped,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage,
        hasPreviousPage,
      },
      filters: {
        categoryId: categoryId || null,
        subCategoryId: subCategoryId || null,
        brandIds: brandIds ? brandIds.split(",").map(id => id.trim()).filter(id => id.length > 0) : [],
        sort: sort,
        search: search || null,
      }
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to fetch products",
        data: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalCount: 0,
          limit: 10,
          hasNextPage: false,
          hasPreviousPage: false,
        }
      },
      { status: 500 }
    );
  }
}