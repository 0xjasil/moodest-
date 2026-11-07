import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// For PATCH method, you would also need to update it similarly:
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { variantId, qty } = body;
    
    if (!variantId || qty === undefined) {
      return NextResponse.json({ error: "Variant id and quantity required." }, { status: 400 });
    }

    const quantity = parseInt(qty, 10);

    const variant = await prisma.productVariant.update({
      where: { id: variantId },
      data: { qty: quantity },
      include: { product: true },
    });

    if (!variant) {
      return NextResponse.json({ error: "Variant not found." }, { status: 404 });
    }

    if (variant.qty <= 10) {
      const exists = await prisma.notification.findFirst({
        where: { productId: variant.productId, seen: false },
      });

      if (!exists) {
        await prisma.notification.create({
          data: {
            productId: variant.productId,
            message: `${variant.product.name} (${variant.sku}) is low on stock (${variant.qty} left).`,
          },
        });
      }
    }

    return NextResponse.json(variant, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}