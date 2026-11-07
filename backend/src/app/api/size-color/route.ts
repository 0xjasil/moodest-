import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log("hiting")
    const attributeNames = ["Color", "Size"];
    
    // 1. Find the Attribute IDs for 'Color' and 'Size'
    const attributes = await prisma.attribute.findMany({
      where: {
        name: {
          in: attributeNames,
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    const colorAttributeId = attributes.find(attr => attr.name === "Color")?.id;
    const sizeAttributeId = attributes.find(attr => attr.name === "Size")?.id;

    if (!colorAttributeId || !sizeAttributeId) {
       return NextResponse.json({ error: "Missing 'Color' or 'Size' attribute definition" }, { status: 404 });
    }

    const attributeIds = [colorAttributeId, sizeAttributeId];

    // 2. Fetch all unique values for those IDs
    const attributeValues = await prisma.attributeValue.findMany({
      where: {
        attributeId: {
          in: attributeIds,
        },
      },
      select: {
        value: true,
        attributeId: true,
      },
      orderBy: {
        value: 'asc',
      }
    });

    // 3. Structure the response
    const colors = attributeValues
      .filter(av => av.attributeId === colorAttributeId)
      .map(av => av.value);

    const sizes = attributeValues
      .filter(av => av.attributeId === sizeAttributeId)
      .map(av => av.value);

    return NextResponse.json({
      colors: colors,
      sizes: sizes,
    });
  } catch (error) {
    console.error("Error fetching colors and sizes:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}