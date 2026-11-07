import {prisma} from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// POST: Create a new brand
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const brand = await prisma.brand.create({
      data: { name: body.name },
    });
    return NextResponse.json(brand);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}

// GET: Get all brands
export async function GET() {
  try {
    const brands = await prisma.brand.findMany();
    return NextResponse.json(brands);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}