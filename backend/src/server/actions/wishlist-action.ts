'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { addToWishlistSchema, removeFromWishlistSchema } from "@/schema/wishlist-schema";
import { getAuthenticatedUser } from "./cart-action";

export async function addToWishlist(data: unknown) {
  const user = await getAuthenticatedUser();
  const parsed = addToWishlistSchema.parse(data);

  // ensure wishlist exists
  let wishlist = await prisma.wishlist.findUnique({
    where: { userId: user.id },
    include: { items: true },
  });

  if (!wishlist) {
    wishlist = await prisma.wishlist.create({
      data: { userId: user.id },
      include: { items: true },
    });
  }

  const exists = wishlist.items.find((i) => i.variantId === parsed.variantId);
  if (exists) {
    return { success: true, message: "Already in wishlist" } as const;
  }

  await prisma.wishlistItem.create({
    data: { wishlistId: wishlist.id, variantId: parsed.variantId },
  });

  revalidatePath('/wishlist');
  return { success: true } as const;
}

export async function removeFromWishlist(data: unknown) {
  const user = await getAuthenticatedUser();
  const parsed = removeFromWishlistSchema.parse(data);

  const wishlist = await prisma.wishlist.findUnique({
    where: { userId: user.id },
    include: { items: true },
  });

  if (!wishlist) {
    return { success: true } as const;
  }

  const item = wishlist.items.find((i) => i.variantId === parsed.variantId);
  if (!item) {
    return { success: true } as const;
  }

  await prisma.wishlistItem.delete({ where: { id: item.id } });
  revalidatePath('/wishlist');
  return { success: true } as const;
}

export async function getUserWishlist() {
  const user = await getAuthenticatedUser();
  const wishlist = await prisma.wishlist.findUnique({
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

  return wishlist ?? { id: '', userId: user.id, createdAt: new Date(), updatedAt: new Date(), items: [] };
}


