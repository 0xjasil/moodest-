
import {prisma} from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET all SubCategories, optionally filtered by categoryId
export async function GET(req: Request) {
  try {
    // 1️⃣ Get query params
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId"); // optional

    // 2️⃣ Fetch subcategories with category relation
    const subcategories = await prisma.subCategory.findMany({
      where: categoryId ? { categoryId } : {},
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 3️⃣ Return result
    return NextResponse.json(subcategories, { status: 200 });
  } catch (error: unknown) {
    console.error("Get all SubCategories error:", error);
    return NextResponse.json({ error: "Failed to fetch subcategories" }, { status: 500 });
  }
}

// POST: Create a new SubCategory
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, categoryId } = body;

    if (!name || !categoryId) {
      return NextResponse.json(
        { error: "Name and categoryId are required" },
        { status: 400 }
      );
    }

    const newSubCategory = await prisma.subCategory.create({
      data: {
        name,
        categoryId,
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

    return NextResponse.json(
      {
        message: "SubCategory created successfully",
        data: newSubCategory,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("SubCategory creation error:", error);
    return NextResponse.json(
      { error: "Failed to create subcategory" },
      { status: 500 }
    );
  }
}