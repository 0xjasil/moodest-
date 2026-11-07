// app/api/admin/offer-slides/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { v2 as cloudinary } from "cloudinary";
import { getAuthenticatedAdmin } from "@/server/actions/admin-user-action";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET() {
  try {
    await getAuthenticatedAdmin();
    const slides = await prisma.offerSlide.findMany({ orderBy: { order: "asc" } });
    return NextResponse.json(slides);
  } catch {
    return NextResponse.json({ error: "Failed to fetch offer slides" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await getAuthenticatedAdmin();
    const { image, route } = await req.json();

    const uploaded = await cloudinary.uploader.upload(image, { folder: "offer-slides" });
    const last = await prisma.offerSlide.findFirst({ orderBy: { order: "desc" } });
    const order = last ? last.order + 1 : 0;

    const slide = await prisma.offerSlide.create({
      data: { image: uploaded.secure_url, route, order, isActive: true },
    });

    return NextResponse.json(slide, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create offer slide" }, { status: 500 });
  }
}