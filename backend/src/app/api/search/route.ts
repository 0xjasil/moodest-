import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length === 0) {
      return NextResponse.json([]);
    }

    // Search through Product name and description, then get the first variant of each product
    const products = await prisma.product.findMany({
      where: {
        OR: [
          {
            name: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: query,
              mode: 'insensitive',
            },
          },
        ],
      },
      include: {
        variants: {
          take: 1, // Get only the first variant
          select: {
            id: true,
          },
        },
      },
      take: 10, // Limit results to 10
    });

    // Format the response to include product id, name, and variant id
    const searchResults = products
      .filter((product) => product.variants.length > 0) // Only include products that have variants
      .map((product) => ({
        id: product.id,
        name: product.name,
        variantId: product.variants[0].id,
      }));

    return NextResponse.json(searchResults);
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
