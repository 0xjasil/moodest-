import { fallBackImage } from "@/constants/values";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface FormattedBestsellers {
  id: string;
  variantId: string;
  name: string;
  title: string;
  image: string;
  images?: string[];
  price: string;
  originalPrice?: string | null;
}

export async function GET() {
  try {
    // Step 1: Fetch products explicitly marked as customer favorites
    const favoriteProducts = await prisma.product.findMany({
      where: {
        isCustomerFavorite: true,
      },
      include: {
        brand: true,
        variants: {
          orderBy: {
            createdAt: "asc",
          },
          take: 1,
        },
      },
    });

    if (favoriteProducts.length > 0) {
      const formattedFavorites: FormattedBestsellers[] = favoriteProducts.map(
        (product) => {
          const variant = product.variants[0];
          return {
            id: product.id,
            variantId: variant?.id || "",
            name: product.brand?.name || "Unknown Brand",
            title: product.name || "Unknown Product",
            price: variant?.price?.toFixed(2) || "0.00",
            originalPrice: variant?.offerPrice?.toFixed(2) || null,
            image: product.image || variant?.images[0] || fallBackImage,
            images: variant?.images || [],
          };
        }
      );
      return NextResponse.json(formattedFavorites, { status: 200 });
    }

    // Step 2: Fallback to original logic based on most purchased variants if no favorites are marked
    const variantPurchases = await prisma.orderItem.groupBy({
      by: ["variantId"],
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: "desc",
        },
      },
      take: 10,
    });

    if (variantPurchases.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    const variantIds = variantPurchases.map((v) => v.variantId);
    const variants = await prisma.productVariant.findMany({
      where: {
        id: { in: variantIds },
      },
      include: {
        product: {
          include: {
            brand: true,
          },
        },
      },
    });

    const purchaseMap = new Map(
      variantPurchases.map((v) => [v.variantId, v._sum.quantity || 0])
    );

    const productMap = new Map<string, {
      product: { id: string; name: string; image: string; brand: { name: string } | null };
      topVariantId: string;
      topVariantPurchases: number;
      topVariantPrice: number;
      topVariantOfferPrice: number | null;
      topVariantImages: string[];
    }>();

    variants.forEach((variant) => {
      const productId = variant.product.id;
      const purchases = purchaseMap.get(variant.id) || 0;

      if (!productMap.has(productId)) {
        productMap.set(productId, {
          product: variant.product,
          topVariantId: variant.id,
          topVariantPurchases: purchases,
          topVariantPrice: variant.price,
          topVariantOfferPrice: variant.offerPrice,
          topVariantImages: variant.images,
        });
      } else {
        const existing = productMap.get(productId)!;
        if (purchases > existing.topVariantPurchases) {
          existing.topVariantId = variant.id;
          existing.topVariantPurchases = purchases;
          existing.topVariantPrice = variant.price;
          existing.topVariantOfferPrice = variant.offerPrice;
          existing.topVariantImages = variant.images;
        }
      }
    });

    const sortedProducts = Array.from(productMap.values()).sort(
      (a, b) => b.topVariantPurchases - a.topVariantPurchases
    );

    const formattedBestsellers: FormattedBestsellers[] = sortedProducts.map(
      (item) => ({
        id: item.product.id,
        variantId: item.topVariantId,
        name: item.product.brand?.name || "Unknown Brand",
        title: item.product.name || "Unknown Product",
        price: item.topVariantPrice.toFixed(2),
        originalPrice: item.topVariantOfferPrice?.toFixed(2) || null,
        image: item.product.image || item.topVariantImages[0] || fallBackImage,
        images: item.topVariantImages || [],
      })
    );

    return NextResponse.json(formattedBestsellers, { status: 200 });
  } catch (error) {
    console.error("Error fetching best-selling products:", error);
    return NextResponse.json(
      { error: "Failed to fetch best-selling products." },
      { status: 500 }
    );
  }
}