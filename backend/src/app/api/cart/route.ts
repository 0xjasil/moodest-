// app/api/cart/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // First, clean up orphaned cart items (items with deleted variants)
    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: {
        items: true,
      },
    });

    // If no cart exists, return empty array
    if (!cart) {
      return NextResponse.json([]);
    }

    // Check each item and delete if variant doesn't exist
    const itemsToCheck = cart.items;
    for (const item of itemsToCheck) {
      const variantExists = await prisma.productVariant.findUnique({
        where: { id: item.variantId },
      });
      
      if (!variantExists) {
        // Delete orphaned cart item
        await prisma.cartItem.delete({
          where: { id: item.id },
        });
      }
    }

    // Now fetch the cleaned cart with all relations
    const cleanCart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: { select: { id: true, name: true, image: true } },
              },
            },
          },
        },
      },
    });

    // Return items array or empty array if no cart
    return NextResponse.json(cleanCart?.items || []);
  } catch (error) {
    console.error("Cart API error:", error);
    return NextResponse.json({ error: "Failed to fetch cart" }, { status: 500 });
  }
}

// ADD TO CART
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { variantId, quantity } = body;

    if (!variantId) {
      return NextResponse.json({ error: "Variant ID required" }, { status: 400 });
    }

    // Verify variant exists before adding to cart
    const variantExists = await prisma.productVariant.findUnique({
      where: { id: variantId },
    });

    if (!variantExists) {
      return NextResponse.json({ error: "Product variant not found" }, { status: 404 });
    }

    // Ensure cart exists
    let cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: session.user.id },
      });
    }

    // Check if variant already exists in cart
    const existingItem = await prisma.cartItem.findFirst({
      where: { cartId: cart.id, variantId },
    });

    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + (quantity || 1) },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          variantId,
          quantity: quantity || 1,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Add to Cart error:", error);
    return NextResponse.json({ error: "Failed to add to cart" }, { status: 500 });
  }
}