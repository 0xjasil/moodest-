import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateProductAction, deleteProductAction } from "@/server/actions/product-action";

// GET product by ID
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        brand: true,
        subCategory: true,
        variants: {
          orderBy: { createdAt: "asc" },
          include: {
            options: {
              include: {
                attribute: true,
                attributeValue: true,
              },
            },
          },
        },
        reviews: {
          include: {
            user: {
              select: {
                name: true,
                image: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Shape response for frontend ease of rendering
    const variants = (product.variants || []).map((v) => ({
      id: v.id,
      price: v.price,
      offerPrice: v.offerPrice,
      qty: v.qty,
      images: v.images,
      options: v.options.map((o) => ({
        attributeId: o.attributeId,
        attributeName: o.attribute.name,
        valueId: o.valueId,
        value: o.attributeValue.value,
      })),
    }));

    const attributeMap = new Map<string, { attributeId: string; name: string; values: { valueId: string; value: string }[] }>();
    for (const v of variants) {
      for (const o of v.options) {
        const entry = attributeMap.get(o.attributeId) || { attributeId: o.attributeId, name: o.attributeName, values: [] };
        if (!entry.values.some((vv) => vv.valueId === o.valueId)) {
          entry.values.push({ valueId: o.valueId, value: o.value });
        }
        attributeMap.set(o.attributeId, entry);
      }
    }

    const defaultVariant = variants[0] || null;

    const shaped = {
      id: product.id,
      name: product.name,
      description: product.description ?? undefined,
      image: product.image,
      brand: product.brand ? { id: product.brand.id, name: product.brand.name } : undefined,
      category: product.category || undefined,
      subCategory: product.subCategory || undefined,
      price: defaultVariant?.price ?? 0,
      offerPrice: defaultVariant?.offerPrice ?? undefined,
      subimage: defaultVariant?.images ?? [],
      variants,
      attributesCatalog: Array.from(attributeMap.values()),
      defaultVariantId: defaultVariant?.id ?? null,
      reviews: product.reviews.map((r) => ({
        id: r.id,
        userName: r.user.name,
        userImage: r.user.image,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt.toISOString(),
      })),
    };

    return NextResponse.json(shaped);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}

// UPDATE product
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const formData = await req.formData();
    formData.append("id", id); // attach ID from URL

    const result = await updateProductAction(formData);
    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update product" },
      { status: 500 }
    );
  }
}

// DELETE product
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Pass plain object to delete action
    const result = await deleteProductAction({ id });
    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete product" },
      { status: 500 }
    );
  }
}