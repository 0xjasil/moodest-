import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createProductAction } from "@/server/actions/product-action";


export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers }); 
    const userId = session?.user.id; 

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");
    const subCategoryId = searchParams.get("subCategoryId");
    const brandIds = searchParams.get("brandId");
    const sort = searchParams.get("sort");
    const priceRange = searchParams.get("priceRange");
    const selectedColor = searchParams.get("color");
    const selectedSize = searchParams.get("size");
    const isCustomerFavorite = searchParams.get("isCustomerFavorite") === "true";
    const isNewArrival = searchParams.get("isNewArrival") === "true";

    // 1. Build Base WHERE Clause for Product model
    const productWhereClause: Record<string, unknown> = {};
    if (categoryId) productWhereClause.categoryId = categoryId;
    if (subCategoryId) productWhereClause.subCategoryId = subCategoryId;
    if (isCustomerFavorite) productWhereClause.isCustomerFavorite = true;
    if (isNewArrival) productWhereClause.isNewArrival = true;
    if (brandIds) {
      const brandIdArray = brandIds.split(",");
      productWhereClause.brandId = { in: brandIdArray };
    }

    // 2. Handle Color/Size Filtering (Existing Logic)
    let matchingProductIds: string[] | null = null;

    if (selectedColor || selectedSize) {
      // Build attribute filters
      const attributeFilters = [];

      if (selectedColor) {
        attributeFilters.push({
          options: {
            some: {
              attribute: { name: "Color" },
              attributeValue: { value: selectedColor },
            },
          },
        });
      }

      if (selectedSize) {
        attributeFilters.push({
          options: {
            some: {
              attribute: { name: "Size" },
              attributeValue: { value: selectedSize },
            },
          },
        });
      }

      // Find variants that match ALL selected attributes
      const variantIdsToFilter = await prisma.productVariant.findMany({
        where: {
          AND: attributeFilters,
        },
        select: { productId: true },
      });

      matchingProductIds = Array.from(
        new Set(variantIdsToFilter.map((v) => v.productId))
      );

      // If no variants matched, return empty array
      if (matchingProductIds.length === 0) {
        return NextResponse.json([]);
      }

      productWhereClause.id = { in: matchingProductIds };
    }

    // 3. Fetch products with variants (for price filtering)
    const products = await prisma.product.findMany({
      where: productWhereClause,
      include: {
        category: true,
        brand: true,
        subCategory: true,
        variants: {
          // IMPORTANT: Include SKU to help identify the default variant later, 
          // and images, for a more complete product card view.
          select: { id: true, price: true, offerPrice: true, sku: true, images: true }, 
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    
    // --- START: Cart/Wishlist Check Logic ---
    let cartVariantIds: Set<string> = new Set();
    let wishlistVariantIds: Set<string> = new Set();
    
    if (userId) {
      // Get the IDs of all variants in the result set
      const allVariantIds = products.flatMap(p => p.variants).map(v => v.id);

      // 3.1 Fetch Cart Items
      const cartItems = await prisma.cartItem.findMany({
        where: {
          cart: { userId: userId }, // Link to the user's cart
          variantId: { in: allVariantIds }, // Filter by the variants we are displaying
        },
        select: { variantId: true },
      });
      cartVariantIds = new Set(cartItems.map(item => item.variantId));

      // 3.2 Fetch Wishlist Items
      const wishlistItems = await prisma.wishlistItem.findMany({
        where: {
          wishlist: { userId: userId }, // Link to the user's wishlist
          variantId: { in: allVariantIds }, // Filter by the variants we are displaying
        },
        select: { variantId: true },
      });
      wishlistVariantIds = new Set(wishlistItems.map(item => item.variantId));
    }
    // --- END: Cart/Wishlist Check Logic ---


    // 4. Map products and apply price filter
    let mapped = products.map((p) => {
      const defaultVariant = p.variants?.[0] || null;
      
      // Determine if ANY variant of this product is in the cart/wishlist
      const isInCart = p.variants.some(v => cartVariantIds.has(v.id));
      const isInWishlist = p.variants.some(v => wishlistVariantIds.has(v.id));

      return {
        id: p.id,
        name: p.name,
        description: p.description ?? undefined,
        image: p.image,
        brandId: p.brandId ?? undefined,
        categoryId: p.categoryId ?? undefined,
        subCategoryId: p.subCategoryId ?? undefined,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        brand: p.brand || undefined,
        category: p.category || undefined,
        subCategory: p.subCategory || undefined,
        
        price: defaultVariant?.price ?? 0,
        offerPrice: defaultVariant?.offerPrice ?? undefined,
        subimage: defaultVariant?.images ?? [],
        defaultVariantId: defaultVariant?.id ?? null,
        
        isInCart: isInCart, 
        isInWishlist: isInWishlist,
      };
    });

    if (priceRange) {
      let minPrice = 0;
      let maxPrice = Number.MAX_SAFE_INTEGER;

      if (priceRange === "1-500") {
        minPrice = 1;
        maxPrice = 500;
      } else if (priceRange === "500-1000") {
        minPrice = 501; // Fixed overlap
        maxPrice = 1000;
      } else if (priceRange === "1000-5000") {
        minPrice = 1001; // Fixed overlap
        maxPrice = 5000;
      } else if (priceRange === "5000+") {
        minPrice = 5001; // Fixed overlap
      }

      mapped = mapped.filter((product) => {
        const price = product.price ?? 0;
        return price >= minPrice && price <= maxPrice;
      });
    }

    // 6. Apply sorting (Existing Logic)
    if (sort === "price_asc") {
      mapped.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    } else if (sort === "price_desc") {
      mapped.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    }

    return NextResponse.json(mapped);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// CREATE product
export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    // Convert FormData to the expected shape
    const productData = {
      name: formData.get("name") as string,
      price: formData.get("price") as string,
      qty: formData.get("qty") as string,
      image: formData.get("image") as File,
      subimage: formData.getAll("subimage") as File[],
      attributes: JSON.parse(formData.get("attributes") as string || "[]"),
      description: formData.get("description") as string | undefined,
      brandId: formData.get("brandId") as string | undefined,
      categoryId: formData.get("categoryId") as string | undefined,
      subcategoryId: formData.get("subcategoryId") as string | undefined,
    };

    const result = await createProductAction(productData);

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create product" },
      { status: 500 }
    );
  }
}