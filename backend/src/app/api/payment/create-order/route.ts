import Razorpay from "razorpay";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {

    const { totalAmount } = await req.json();

    if (!totalAmount || totalAmount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    const razorOrder = await razorpay.orders.create({
      amount: totalAmount * 100, // INR → paise
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
    });

    return NextResponse.json({
      success: true,
      key: process.env.RAZORPAY_KEY_ID,
      orderId: razorOrder.id,
    });
  } catch (err) {
    console.error("Create Razorpay order error:", err);
    return NextResponse.json({ error: "Payment init failed" }, { status: 500 });
  }
}
