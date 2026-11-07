'use server';

import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import {
  addToCartSchema,
  updateCartItemSchema,
  addToCartBundleInput,
  removeFromCartSchema,
} from "@/schema/cart-schema";

export async function getAuthenticatedUser() {
  const nextHeaders = await headers();
  const standardHeaders = new Headers();

  nextHeaders.forEach((value, key) => {
    standardHeaders.set(key, value);
  });

  const session = await auth.api.getSession({ headers: standardHeaders });

  if (!session?.user) {
    console.log("❌ No session found");
    throw new Error("Unauthorized");
  }

  console.log("✅ Session found for user:", session.user.id);

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });

  if (!user) {
    console.log("❌ User not found in database");
    throw new Error("User not found");
  }

  console.log("✅ User found:", user.id);
  return user;
}

// Add to Cart with extensive debugging
export async function addToCart(data: unknown) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      console.log('❌ Unauthorized user');
      throw new Error('Unauthorized');
    }

    const parsed = addToCartSchema.parse(data);
    const { variantId, quantity } = parsed;
    console.log('✅ Data parsed:', parsed);

    // 1. Get variant and check stock
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: true },
    });

    if (!variant) {
      console.log('❌ Variant not found:', variantId);
      throw new Error('Variant not found');
    }
    
    // 2. Find or create user's cart
    let cart = await prisma.cart.findUnique({
      where: { userId: user.id },
      include: { items: true },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: user.id },
        include: { items: true },
      });
      console.log('✅ New cart created:', cart.id);
    } else {
      console.log('✅ Existing cart found:', cart.id);
    }

    // 3. Find existing cart item for the variant
    const existingItem = cart.items.find(
      (item) => item.variantId === variantId
    );

    const quantityToAdd = quantity;
    const currentQuantityInCart = existingItem?.quantity || 0;
    const newTotalQuantity = currentQuantityInCart + quantityToAdd;
    
    // 4. Perform the stock check
    if (newTotalQuantity > variant.qty) {
      console.log('❌ Insufficient stock:', {
        requested: newTotalQuantity,
        available: variant.qty,
      });
      // Return a specific error message to be handled by the client
      throw new Error(
        `Insufficient stock. Only ${variant.qty} left, you have ${currentQuantityInCart} in your cart.`
      );
    }
    
    // 5. Update or create the cart item
    if (existingItem) {
      console.log('📦 Updating existing item quantity');
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newTotalQuantity },
      });
      console.log('✅ Item quantity updated');
    } else {
      console.log('📦 Creating new cart item');
      const newItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          variantId: variantId,
          quantity: quantityToAdd,
        },
      });
      console.log('✅ New cart item created:', newItem.id);
    }

    revalidatePath('/');
    revalidatePath('/cart');

    console.log('✅ Cart operation successful');
    return { success: true };
  } catch (error) {
    console.error('❌ Add to cart error:', error);
    throw error;
  }
}


export async function addToCartAsBundle(data: unknown) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      console.log('❌ Unauthorized user');
      throw new Error('Unauthorized');
    }

    const parsedItems = addToCartBundleInput.parse(data);
    console.log('✅ Data parsed:', parsedItems);

    // Find or create the user's cart once at the beginning
    let cart = await prisma.cart.findUnique({
      where: { userId: user.id },
      include: { items: true },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: user.id },
        include: { items: true },
      });
      console.log('✅ New cart created:', cart.id);
    } else {
      console.log('✅ Existing cart found:', cart.id);
    }

    // Process each item in the array sequentially
    for (const item of parsedItems) {
      const { variantId, quantity } = item;

      // 1. Get product and check stock
      const variant = await prisma.productVariant.findUnique({
        where: { id: variantId },
        include: { product: true },
      });

      if (!variant) {
        console.log(`❌ Variant not found: ${variantId}`);
        throw new Error(`Variant not found: ${variantId}`);
      }

      // 2. Find existing cart item for the product
      const existingItem = cart.items.find((i) => i.variantId === variantId);
      const currentQuantityInCart = existingItem?.quantity || 0;
      const newTotalQuantity = currentQuantityInCart + quantity;

      // 3. Perform the stock check
      if (newTotalQuantity > variant.qty) {
        console.log('❌ Insufficient stock:', {
          requested: newTotalQuantity,
          available: variant.qty,
        });
        throw new Error(
          `Insufficient stock. Only ${variant.qty} of ${variant.product.name} are left. You currently have ${currentQuantityInCart} in your cart.`
        );
      }

      // 4. Update or create the cart item
      if (existingItem) {
        console.log(`📦 Updating existing item quantity for variant ${variantId}`);
        await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: newTotalQuantity },
        });
        console.log('✅ Item quantity updated');
      } else {
        console.log(`📦 Creating new cart item for variant ${variantId}`);
        const newItem = await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            variantId: variantId,
            quantity: quantity,
          },
        });
        console.log('✅ New cart item created:', newItem.id);
      }
    }

    revalidatePath('/');
    revalidatePath('/cart');

    console.log('✅ Cart operation successful');
    return { success: true };
  } catch (error) {
    console.error('❌ Add to cart error:', error);
    throw error;
  }
}

// Get user cart with debugging
export async function getUserCart() {
  try {
    console.log("🔍 Getting user cart...");
    const user = await getAuthenticatedUser();
    
    const cart = await prisma.cart.findUnique({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  select: { id: true, name: true, image: true },
                },
              },
            },
          },
        },
      },
    });

    if (!cart) {
      console.log("📦 No cart found for user:", user.id);
      return null;
    }
    
    return cart;
  } catch (error) {
    console.error("❌ Failed to get user cart:", error);
    return null;
  }
}

// Update Cart Item
export async function updateCartItem(data: unknown) {
  try {
    console.log("🔄 Updating cart item:", data);
    const user = await getAuthenticatedUser();
    const parsed = updateCartItemSchema.parse(data);

    const cart = await prisma.cart.findUnique({
      where: { userId: user.id },
      include: { items: true },
    });

    if (!cart) throw new Error("Cart not found");

    const item = cart.items.find((i) => i.variantId === parsed.variantId);
    if (!item) throw new Error("Item not found in cart");

    await prisma.cartItem.update({
      where: { id: item.id },
      data: { quantity: parsed.quantity },
    });

    revalidatePath("/");
    revalidatePath("/cart");

    console.log("✅ Cart item updated successfully");
    return { success: true };
  } catch (error) {
    console.error("❌ Update cart item error:", error);
    throw error;
  }
}

// Remove from Cart
export async function removeFromCart(data: unknown) {
  try {
    console.log("🗑️ Removing from cart:", data);
    const user = await getAuthenticatedUser();
    const parsed = removeFromCartSchema.parse(data);

    const cart = await prisma.cart.findUnique({
      where: { userId: user.id },
      include: { items: true },
    });

    if (!cart) throw new Error("Cart not found");

    const item = cart.items.find((i) => i.variantId === parsed.variantId);
    if (!item) throw new Error("Item not found in cart");

    await prisma.cartItem.delete({
      where: { id: item.id },
    });

    revalidatePath("/");
    revalidatePath("/cart");

    console.log("✅ Item removed from cart successfully");
    return { success: true };
  } catch (error) {
    console.error("❌ Remove from cart error:", error);
    throw error;
  }
}

export async function dummyCart(data: unknown) {
  try {
    const parsed = addToCartBundleInput.parse(data);
    const variantIds = parsed.map(item => item.variantId);
    const variants = await prisma.productVariant.findMany({
      where: {
        id: {
          in: variantIds,
        },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    const cartItemsWithDetails = parsed.map(cartItem => {
      const variant = variants.find(v => v.id === cartItem.variantId);
      return {
        variantId: cartItem.variantId,
        quantity: cartItem.quantity,
        price: variant?.price ?? 0,
        offerPrice: variant?.offerPrice ?? null,
        qty: variant?.qty ?? 0,
        product: variant?.product ?? null,
      };
    });

    return {
      success: true,
      message: "Cart items fetched successfully.",
      data: cartItemsWithDetails,
    };
  } catch (err) {
    console.error("Failed to fetch dummy cart", err);
    return {
      success: false,
      message: "Failed to fetch cart items.",
      data: null,
    };
  }
}