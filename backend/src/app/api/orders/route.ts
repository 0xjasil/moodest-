import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { sendOrderConfirmationEmail } from "@/lib/email-utils";

// Place a new order
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    const user = session?.user;

    const { paymentMethod, phoneNumber, street, city, state, pincode, items, name, email } = await req.json();

    if (!paymentMethod || !phoneNumber || !street || !city || !state || !pincode) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!user && (!name || !email)) {
      return NextResponse.json(
        { error: "Guest orders require name and email" },
        { status: 400 }
      );
    }

    type OrderItemInput = {
      variantId: string;
      quantity: number;
    };

    const orderItems: { variantId: string; quantity: number; price: number }[] = [];
    let totalAmount = 0;
    let isDirectBuyNow = true;

    if (Array.isArray(items) && items.length > 0) {
      isDirectBuyNow = items.length === 1;
      const variantIds = (items as OrderItemInput[]).map((i) => i.variantId);
      const variants = await prisma.productVariant.findMany({
        where: { id: { in: variantIds } },
        select: { id: true, price: true, offerPrice: true, qty: true },
      });

      for (const it of items as OrderItemInput[]) {
        const v = variants.find((vv) => vv.id === it.variantId);
        const priceToUse = v?.offerPrice ?? v?.price ?? 0;
        if (!v) return NextResponse.json({ error: `Variant not found: ${it.variantId}` }, { status: 400 });
        if (it.quantity < 1) return NextResponse.json({ error: `Invalid quantity for ${it.variantId}` }, { status: 400 });
        if (it.quantity > v.qty) return NextResponse.json({ error: `Insufficient stock for ${it.variantId}` }, { status: 400 });
        orderItems.push({ variantId: v.id, quantity: it.quantity, price: priceToUse });
        totalAmount += priceToUse * it.quantity;
      }
    } else {
      // Fallback to cart (only for logged-in users)
      if (!user) {
        return NextResponse.json({ error: "Guest orders must specify items" }, { status: 400 });
      }

      const cart = await prisma.cart.findUnique({
        where: { userId: user.id },
        include: {
          items: { include: { variant: { select: { id: true, price: true, offerPrice: true, qty: true } } } },
        },
      });

      if (!cart || cart.items.length === 0) {
        return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
      }

      for (const ci of cart.items) {
        if (!ci.variant) continue;
        if (ci.quantity > ci.variant.qty) {
          return NextResponse.json({ error: `Insufficient stock for ${ci.variant.id}` }, { status: 400 });
        }
        orderItems.push({ variantId: ci.variantId, quantity: ci.quantity, price: ci.variant.offerPrice ?? ci.variant.price });
        totalAmount += (ci.variant.offerPrice ?? ci.variant.price) * ci.quantity;
      }
    }

    // Atomic transaction for order creation, stock update, and cart clearance
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId: user?.id || null,
          paymentMethod,
          totalAmount,
          status: "PENDING",
          phoneNumber,
          street,
          city,
          state,
          pincode,
          name: name || user?.name || null,
          email: email || user?.email || null,
          items: {
            create: orderItems.map((item) => ({
              variantId: item.variantId,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        },
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

      // Update product stock atomically
      for (const item of orderItems) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { qty: { decrement: item.quantity } },
        });
      }

      // Clear cart only if order was placed from cart (not direct buy) and user exists
      if (!isDirectBuyNow && user) {
        const cart = await tx.cart.findUnique({ where: { userId: user.id } });
        if (cart) {
          await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
        }
      }

      return newOrder;
    });

    // Send order confirmation email asynchronously
    sendOrderConfirmationEmail(order.id).catch((e) =>
      console.error("[Email Error] Order confirmation email failed:", e)
    );

    return NextResponse.json({ success: true, order }, { status: 201 });
  } catch (err) {
    console.error("Order creation error:", err);
    return NextResponse.json(
      { error: "Failed to place order" },
      { status: 500 }
    );
  }
}

// Get all orders of logged-in user
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    const user = session.user;

    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { userId: user.id },
          ...(user.email ? [{ email: user.email }] : []),
        ],
      },
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
      orderBy: { createdAt: "desc" },
    });

    // Transform data safely to match frontend expectations
    const transformedOrders = orders.map((order) => ({
      ...order,
      items: order.items.map((item) => ({
        productId: item.variant?.product?.id || item.variantId || "",
        quantity: item.quantity,
        price: item.price,
        product: {
          name: item.variant?.product?.name || "Product Item",
          image: item.variant?.product?.image || "",
        },
      })),
    }));

    return NextResponse.json(transformedOrders);
  } catch (err) {
    console.error("Fetch orders error:", err);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
