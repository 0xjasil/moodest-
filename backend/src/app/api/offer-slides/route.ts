// app/api/offer-slides/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const slides = await prisma.offerSlide.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
    });
    return NextResponse.json(slides);
  } catch {
    return NextResponse.json({ error: "Failed to fetch offer slides" }, { status: 500 });
  }
}