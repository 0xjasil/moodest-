// app/api/admin/offer-slides/[id]/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { v2 as cloudinary } from "cloudinary";
import { getAuthenticatedAdmin } from "@/server/actions/admin-user-action";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getAuthenticatedAdmin();
    const { id } = await params;
    const body = await req.json();
    const updateData: Record<string, unknown> = {};

    if (body.route !== undefined) updateData.route = body.route;
    if (body.order !== undefined) updateData.order = body.order;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    if (body.image?.startsWith("data:")) {
      const u = await cloudinary.uploader.upload(body.image, { folder: "offer-slides" });
      updateData.image = u.secure_url;
    }

    const slide = await prisma.offerSlide.update({ where: { id }, data: updateData });
    return NextResponse.json(slide);
  } catch {
    return NextResponse.json({ error: "Failed to update offer slide" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getAuthenticatedAdmin();
    const { id } = await params;
    await prisma.offerSlide.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete offer slide" }, { status: 500 });
  }
}