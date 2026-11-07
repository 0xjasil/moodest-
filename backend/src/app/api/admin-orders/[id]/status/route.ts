import { NextRequest, NextResponse } from "next/server";
import { updateOrderStatusAndAdjustStock } from "@/lib/order-utils";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ Add admin authentication check here
    const { id } = await params; // ← Need to await params in Next.js 15
    const { status } = await req.json();
    
    // Allowed statuses for admin — align with schema
    const allowedStatuses = ["PENDING","PAID","FAILED","SHIPPED","DELIVERED","CANCELLED"];
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }
    
    const order = await updateOrderStatusAndAdjustStock(id, status);
    
    return NextResponse.json({ success: true, order });
  } catch (err) {
    console.error("Admin update order status error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update order status" },
      { status: 500 }
    );
  }
}