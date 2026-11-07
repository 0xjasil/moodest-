import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    const userId = session?.user.id;

    // Try fetching products explicitly marked as new arrivals first
    let products = await prisma.product.findMany({
      where: {
        isNewArrival: true,
      },
      take: 14,
      orderBy: { createdAt: "desc" },
      include: {
        category: true,
        brand: true,
        subCategory: true,
        variants: {
          select: {
            id: true,
            price: true,
            offerPrice: true,
            sku: true,
            images: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    // Fallback if no products are marked
    if (products.length === 0) {
      products = await prisma.product.findMany({
        take: 14,
        orderBy: { createdAt: "desc" },
        include: {
          category: true,
          brand: true,
          subCategory: true,
          variants: {
            select: {
              id: true,
              price: true,
              offerPrice: true,
              sku: true,
              images: true,
            },
            orderBy: { createdAt: "asc" },
          },
        },
      });
    }

    let cartVariantIds = new Set<string>();
    let wishlistVariantIds = new Set<string>();

    if (userId) {
      const allVariantIds = products.flatMap(p => p.variants).map(v => v.id);

      const cartItems = await prisma.cartItem.findMany({
        where: {
          cart: { userId },
          variantId: { in: allVariantIds },
        },
        select: { variantId: true },
      });

      const wishlistItems = await prisma.wishlistItem.findMany({
        where: {
          wishlist: { userId },
          variantId: { in: allVariantIds },
        },
        select: { variantId: true },
      });

      cartVariantIds = new Set(cartItems.map(i => i.variantId));
      wishlistVariantIds = new Set(wishlistItems.map(i => i.variantId));
    }

    const mapped = products.map(p => {
      const defaultVariant = p.variants[0] ?? null;

      return {
        id: p.id,
        name: p.name,
        description: p.description ?? undefined,
        image: p.image,

        brand: p.brand ?? undefined,
        category: p.category ?? undefined,
        subCategory: p.subCategory ?? undefined,

        price: defaultVariant?.price ?? 0,
        offerPrice: defaultVariant?.offerPrice ?? undefined,
        subimage: defaultVariant?.images ?? [],
        // defaultVariantId: defaultVariant?.id ?? null,
        variantId: defaultVariant?.id ?? null,

        isInCart: p.variants.some(v => cartVariantIds.has(v.id)),
        isInWishlist: p.variants.some(v => wishlistVariantIds.has(v.id)),

        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      };
    });

    return NextResponse.json(mapped);
  } catch (error) {
    console.error("Latest products error:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
