import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { sendOrderConfirmationEmail } from "@/lib/email-utils";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    const user = session?.user;
    const { paymentId, orderId, signature, items, phoneNumber, street, city, state, pincode, name, email } = await req.json();

    const body = orderId + "|" + paymentId;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== signature) {
      return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
    }

    type OrderItemInput = { variantId: string; quantity: number };

    const orderItems: { variantId: string; quantity: number; price: number }[] = [];
    let totalAmount = 0;

    const variantIds = (items as OrderItemInput[]).map((i) => i.variantId);
    const variants = await prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      select: { id: true, price: true, offerPrice: true, qty: true },
    });

    for (const it of items as OrderItemInput[]) {
      const v = variants.find((vv) => vv.id === it.variantId);
      if (!v) {
        return NextResponse.json({ error: `Variant not found: ${it.variantId}` }, { status: 400 });
      }
      const priceToUse = v.offerPrice ?? v.price ?? 0;
      orderItems.push({ variantId: v.id, quantity: it.quantity, price: priceToUse });
      totalAmount += priceToUse * it.quantity;
    }

    // Atomic transaction for payment order creation and stock adjustment
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId: user?.id || null,
          paymentMethod: "ONLINE",
          totalAmount,
          status: "PAID",
          phoneNumber,
          street,
          city,
          state,
          pincode,
          name: name || user?.name || null,
          email: email || user?.email || null,
          razorpayOrderId: orderId,
          razorpayPaymentId: paymentId,
          razorpaySignature: signature,
          items: {
            create: orderItems.map((item) => ({
              variantId: item.variantId,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        },
      });

      for (const item of orderItems) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { qty: { decrement: item.quantity } },
        });
      }

      if (user) {
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

    return NextResponse.json({ success: true, order });
  } catch (err) {
    console.error("Payment verify error:", err);
    return NextResponse.json({ error: "Payment error" }, { status: 500 });
  }
}
