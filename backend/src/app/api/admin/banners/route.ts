// app/api/admin/banners/route.ts

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
    const banners = await prisma.banner.findMany({ orderBy: { order: "asc" } });
    return NextResponse.json(banners);
  } catch {
    return NextResponse.json({ error: "Failed to fetch banners" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await getAuthenticatedAdmin();
    const { title, desktopImage, mobileImage } = await req.json();

    const [desktop, mobile] = await Promise.all([
      cloudinary.uploader.upload(desktopImage, { folder: "banners/desktop" }),
      cloudinary.uploader.upload(mobileImage, { folder: "banners/mobile" }),
    ]);

    const last = await prisma.banner.findFirst({ orderBy: { order: "desc" } });
    const order = last ? last.order + 1 : 0;

    const banner = await prisma.banner.create({
      data: {
        title: title ?? null,
        desktopImage: desktop.secure_url,
        mobileImage: mobile.secure_url,
        order,
        isActive: true,
      },
    });

    return NextResponse.json(banner, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create banner" }, { status: 500 });
  }
}