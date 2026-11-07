// app/api/admin/banners/[id]/route.ts

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

    if (body.title !== undefined) updateData.title = body.title;
    if (body.order !== undefined) updateData.order = body.order;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    if (body.desktopImage?.startsWith("data:")) {
      const u = await cloudinary.uploader.upload(body.desktopImage, { folder: "banners/desktop" });
      updateData.desktopImage = u.secure_url;
    }
    if (body.mobileImage?.startsWith("data:")) {
      const u = await cloudinary.uploader.upload(body.mobileImage, { folder: "banners/mobile" });
      updateData.mobileImage = u.secure_url;
    }

    const banner = await prisma.banner.update({ where: { id }, data: updateData });
    return NextResponse.json(banner);
  } catch {
    return NextResponse.json({ error: "Failed to update banner" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getAuthenticatedAdmin();
    const { id } = await params;
    await prisma.banner.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete banner" }, { status: 500 });
  }
}