import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status:400 });
    }

    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) {
      return NextResponse.json({ canReview: false, message: "Please login to write a review" });
    }

    // Check if user has purchased ANY variant of this product
    const purchase = await prisma.order.findFirst({
      where: {
        userId: session.user.id,
        items: {
          some: {
            variant: {
              productId: productId
            }
          }
        }
      }
    });

    if (!purchase) {
      return NextResponse.json({ canReview: false, message: "You can only review products you have purchased" });
    }

    // Check if already reviewed
    const existingReview = await prisma.review.findFirst({
      where: {
        productId: productId,
        userId: session.user.id
      }
    });

    if (existingReview) {
      return NextResponse.json({ canReview: false, message: "You have already reviewed this product" });
    }

    return NextResponse.json({ canReview: true });
  } catch (error) {
    console.error("Check purchase error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { productId, rating, comment } = await req.json();

    if (!productId || !rating) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check purchase again for security
    const purchase = await prisma.order.findFirst({
      where: {
        userId: session.user.id,
        items: {
          some: {
            variant: {
              productId: productId
            }
          }
        }
      }
    });

    if (!purchase) {
      return NextResponse.json({ error: "You must purchase the product before reviewing" }, { status: 403 });
    }

    // Check if already reviewed
    const existingReview = await prisma.review.findFirst({
      where: {
        productId: productId,
        userId: session.user.id
      }
    });

    if (existingReview) {
      return NextResponse.json({ error: "You have already reviewed this product" }, { status: 400 });
    }

    const review = await prisma.review.create({
      data: {
        productId,
        userId: session.user.id,
        rating: Number(rating),
        comment
      },
      include: {
        user: {
          select: {
            name: true,
            image: true
          }
        }
      }
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error("Review submission error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
