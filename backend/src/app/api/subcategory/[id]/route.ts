// /app/api/subcategory/[id]/route.ts
import {prisma} from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

// GET single SubCategory
export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    // 1️⃣ Extract ID from context.params (await the promise)
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "SubCategory ID is required" }, { status: 400 });
    }

    // 2️⃣ Find subcategory with category relation
    const subcategory = await prisma.subCategory.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!subcategory) {
      return NextResponse.json({ error: "SubCategory not found" }, { status: 404 });
    }

    // 3️⃣ Return found subcategory
    return NextResponse.json(subcategory, { status: 200 });
  } catch (error: unknown) {
    console.error("SubCategory GET error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch subcategory";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// PUT update subcategory
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updated = await prisma.subCategory.update({
      where: { id },
      data: {
        name: body.name,
        categoryId: body.categoryId,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ message: "SubCategory updated successfully", data: updated });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to update subcategory";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// DELETE subcategory
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const usedInProduct = await prisma.product.findFirst({
      where: { subCategoryId: id },
    });

    if (usedInProduct)
      return NextResponse.json(
        { error: "Cannot delete: SubCategory is used in one or more products." },
        { status: 400 }
      );

    const deleted = await prisma.subCategory.delete({ where: { id } });

    return NextResponse.json({ message: "SubCategory deleted successfully", data: deleted });
  } catch (error: unknown) {
    console.error("SubCategory delete error:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "SubCategory not found" }, { status: 404 });
    }

    return NextResponse.json({ error: "SubCategory delete failed" }, { status: 500 });
  }
}