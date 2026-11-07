import {prisma} from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

// POST: Create category
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const name = formData.get("name") as string;
    const file = formData.get("image") as File | null;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (!file) {
      return NextResponse.json({ error: "Image is required" }, { status: 400 });
    }

    // Convert file -> buffer -> base64 -> dataURI
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");
    const mime = file.type; // e.g. "image/jpeg"
    const dataURI = `data:${mime};base64,${base64}`;

    // Upload to Cloudinary
    const uploaded = await cloudinary.uploader.upload(dataURI, {
      folder: "categories",
    });

    // Save to DB
    const category = await prisma.category.create({
      data: {
        name,
        image: uploaded.secure_url,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}

// GET: Get all categories
export async function GET() {
  try {
    const categories = await prisma.category.findMany();
    return NextResponse.json(categories, { status: 200 });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}
