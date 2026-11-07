import {prisma} from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import cloudinary from "@/lib/cloudinary";

// GET single category
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id)
      return NextResponse.json({ error: "Missing category ID" }, { status: 400 });

    const category = await prisma.category.findUnique({ where: { id } });
    if (!category)
      return NextResponse.json({ error: "Category not found" }, { status: 404 });

    return NextResponse.json(category, { status: 200 });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}

// PUT: Update category
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing category ID" }, { status: 400 });
    }

    const formData = await req.formData();
    const name = formData.get("name") as string;
    const file = formData.get("image") as File | null;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    let imageUrl: string | undefined;

    if (file) {
      // Convert file -> buffer -> base64 -> dataURI
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64 = buffer.toString("base64");
      const mime = file.type; // e.g. "image/jpeg"
      const dataURI = `data:${mime};base64,${base64}`;

      // Upload new image to Cloudinary
      const uploaded = await cloudinary.uploader.upload(dataURI, {
        folder: "categories",
      });

      imageUrl = uploaded.secure_url;
    }

    // Update category in DB
    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        name,
        ...(imageUrl ? { image: imageUrl } : {}), // only update image if provided
      },
    });

    return NextResponse.json(updatedCategory, { status: 200 });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}

// DELETE category
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id)
      return NextResponse.json({ error: "Missing category ID" }, { status: 400 });

    const productUsingCategory = await prisma.product.findFirst({
      where: { categoryId: id },
    });

    if (productUsingCategory) {
      return NextResponse.json(
        { error: "Cannot delete: Category is used in one or more products." },
        { status: 400 }
      );
    }

    const deleted = await prisma.category.delete({ where: { id } });

    return NextResponse.json(
      { message: "Category deleted successfully", data: deleted },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Category delete error:", error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json({ error: "Category delete failed" }, { status: 500 });
  }
}
