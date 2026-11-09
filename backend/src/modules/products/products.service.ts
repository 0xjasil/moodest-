import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@prisma/client';

export interface ProductQueryFilters {
  search?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  size?: string;
  color?: string;
  tags?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  includeArchived?: boolean;
}

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper to format a Prisma Product record with derived fields for Storefront and Admin compatibility
   */
  private formatProduct(p: any) {
    const variants = p.variants || [];
    const validPrices = variants
      .map((v: any) => (v.offerPrice ? Number(v.offerPrice) : Number(v.price)))
      .filter((pr: number) => !isNaN(pr) && pr > 0);

    const basePrices = variants
      .map((v: any) => Number(v.price))
      .filter((pr: number) => !isNaN(pr) && pr > 0);

    const basePrice = basePrices.length > 0 ? Math.min(...basePrices) : 0;
    const effectivePrice = validPrices.length > 0 ? Math.min(...validPrices) : basePrice;

    let discountPct: number | undefined;
    if (basePrice > 0 && effectivePrice < basePrice) {
      discountPct = Math.round(((basePrice - effectivePrice) / basePrice) * 100);
    }

    const reviews = p.reviews || [];
    const avgRating =
      reviews.length > 0
        ? Number((reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length).toFixed(1))
        : 4.5;

    const imageUrls = (p.images || []).map((img: any) => (typeof img === 'string' ? img : img.url));
    if (p.image && !imageUrls.includes(p.image)) {
      imageUrls.unshift(p.image);
    }

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description || '',
      fabric: p.fabric || null,
      careInstructions: p.careInstructions || null,
      image: p.image || imageUrls[0] || '/placeholder.png',
      images: imageUrls,
      basePrice,
      price: effectivePrice,
      originalPrice: discountPct ? basePrice : undefined,
      discountPct,
      discount: discountPct,
      avgRating,
      rating: avgRating,
      reviewCount: reviews.length,
      category: p.category ? { id: p.category.id, name: p.category.name, slug: p.category.slug } : null,
      brand: p.brand ? { id: p.brand.id, name: p.brand.name, slug: p.brand.slug } : null,
      subCategory: p.subCategory ? { id: p.subCategory.id, name: p.subCategory.name, slug: p.subCategory.slug } : null,
      isFeatured: p.isFeatured,
      isCustomerFavorite: p.isFeatured || p.isBestSeller,
      isTrending: p.isFeatured || p.isBestSeller,
      isNewArrival: p.isNewArrival,
      isBestSeller: p.isBestSeller,
      isArchived: p.isArchived,
      variants: variants.map((v: any) => ({
        id: v.id,
        size: v.size,
        color: v.color,
        colorHex: v.colorHex || null,
        image: v.image || null,
        price: Number(v.price),
        offerPrice: v.offerPrice ? Number(v.offerPrice) : null,
        stock: v.qty,
        qty: v.qty,
        sku: v.sku,
        isActive: v.isActive,
      })),
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  }

  async getAll(filters: ProductQueryFilters = {}) {
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filters.limit) || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {};

    if (!filters.includeArchived) {
      where.isArchived = false;
    }

    if (filters.search) {
      const q = filters.search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { fabric: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (filters.category) {
      where.OR = [
        ...(where.OR || []),
        { categoryId: filters.category },
        { category: { slug: filters.category } },
      ];
    }

    if (filters.brand) {
      where.OR = [
        ...(where.OR || []),
        { brandId: filters.brand },
        { brand: { slug: filters.brand } },
      ];
    }

    const variantFilter: Prisma.ProductVariantWhereInput = { isActive: true };
    if (filters.size) {
      variantFilter.size = { equals: filters.size, mode: 'insensitive' };
    }
    if (filters.color) {
      variantFilter.color = { equals: filters.color, mode: 'insensitive' };
    }
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      variantFilter.price = {};
      if (filters.minPrice !== undefined) {
        variantFilter.price.gte = new Prisma.Decimal(filters.minPrice);
      }
      if (filters.maxPrice !== undefined) {
        variantFilter.price.lte = new Prisma.Decimal(filters.maxPrice);
      }
    }

    if (filters.size || filters.color || filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.variants = { some: variantFilter };
    }

    if (filters.tags) {
      const tag = filters.tags.toLowerCase();
      if (tag === 'featured') where.isFeatured = true;
      if (tag === 'new-arrival' || tag === 'new_arrival') where.isNewArrival = true;
      if (tag === 'best-seller' || tag === 'best_seller') where.isBestSeller = true;
    }

    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };
    if (filters.sort === 'price') {
      // Prisma doesn't directly sort by min(variants.price) cleanly, but we can order by createdAt as default
      orderBy = { createdAt: filters.order === 'asc' ? 'asc' : 'desc' };
    } else if (filters.sort === 'name') {
      orderBy = { name: filters.order === 'desc' ? 'desc' : 'asc' };
    } else if (filters.sort === 'newest') {
      orderBy = { createdAt: 'desc' };
    }

    const [total, products] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        include: {
          category: true,
          brand: true,
          subCategory: true,
          images: { orderBy: { sortOrder: 'asc' } },
          variants: { where: filters.includeArchived ? undefined : { isActive: true } },
          reviews: { select: { rating: true } },
        },
        skip,
        take: limit,
        orderBy,
      }),
    ]);

    const formatted = products.map((p) => this.formatProduct(p));
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      success: true,
      message: '',
      items: formatted,
      data: formatted,
      total,
      page,
      limit,
      totalPages,
      pages: totalPages,
    };
  }

  async getById(idOrSlug: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      include: {
        category: true,
        brand: true,
        subCategory: true,
        images: { orderBy: { sortOrder: 'asc' } },
        variants: true,
        reviews: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product not found: ${idOrSlug}`);
    }

    return this.formatProduct(product);
  }

  async autocomplete(query: string): Promise<string[]> {
    if (!query || query.trim().length === 0) return [];
    const q = query.trim();

    const matches = await this.prisma.product.findMany({
      where: {
        isArchived: false,
        name: { contains: q, mode: 'insensitive' },
      },
      select: { name: true },
      take: 8,
    });

    return Array.from(new Set(matches.map((m) => m.name)));
  }

  async getTrendingSearches(limit: number = 10): Promise<string[]> {
    const featured = await this.prisma.product.findMany({
      where: { isArchived: false, isFeatured: true },
      select: { name: true },
      take: limit,
    });

    if (featured.length > 0) {
      return featured.map((p) => p.name);
    }

    const latest = await this.prisma.product.findMany({
      where: { isArchived: false },
      select: { name: true },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return latest.map((p) => p.name);
  }

  async getFacets(filters: Partial<ProductQueryFilters> = {}) {
    const [categories, brands, variants] = await Promise.all([
      this.prisma.category.findMany({ select: { id: true, name: true, slug: true } }),
      this.prisma.brand.findMany({ where: { isActive: true }, select: { id: true, name: true, slug: true } }),
      this.prisma.productVariant.findMany({
        where: { isActive: true },
        select: { size: true, color: true, price: true },
      }),
    ]);

    const sizes = Array.from(new Set(variants.map((v) => v.size))).filter(Boolean);
    const colors = Array.from(new Set(variants.map((v) => v.color))).filter(Boolean);
    const prices = variants.map((v) => Number(v.price)).filter((p) => !isNaN(p));
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 10000;

    return {
      categories,
      brands,
      sizes,
      colors,
      priceRange: { min: minPrice, max: maxPrice },
    };
  }

  async getRelated(idOrSlug: string, limit: number = 8) {
    const product = await this.prisma.product.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
      select: { id: true, categoryId: true, brandId: true },
    });

    if (!product) return [];

    const related = await this.prisma.product.findMany({
      where: {
        isArchived: false,
        id: { not: product.id },
        OR: [
          product.categoryId ? { categoryId: product.categoryId } : {},
          product.brandId ? { brandId: product.brandId } : {},
        ],
      },
      include: {
        category: true,
        brand: true,
        images: { orderBy: { sortOrder: 'asc' } },
        variants: { where: { isActive: true } },
        reviews: { select: { rating: true } },
      },
      take: limit,
    });

    return related.map((p) => this.formatProduct(p));
  }

  // --- ADMIN OPERATIONS ---

  async create(data: {
    name: string;
    slug?: string;
    description?: string;
    fabric?: string;
    careInstructions?: string;
    image?: string;
    images?: string[];
    categoryId?: string;
    brandId?: string;
    subCategoryId?: string;
    isFeatured?: boolean;
    isNewArrival?: boolean;
    isBestSeller?: boolean;
    variants?: Array<{
      size: string;
      color: string;
      colorHex?: string;
      image?: string | null;
      price: number;
      offerPrice?: number;
      qty: number;
      sku?: string;
    }>;
  }) {
    let slug = (
      data.slug ||
      data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
    );
    if (!slug) {
      slug = `prod-${Date.now().toString(36)}`;
    }

    // Check if slug already exists to prevent Unique constraint collision
    const existingSlug = await this.prisma.product.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (existingSlug) {
      slug = `${slug}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    }

    const createdId = await this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name: data.name,
          slug,
          description: data.description || null,
          fabric: data.fabric || null,
          careInstructions: data.careInstructions || null,
          image: data.image || data.images?.[0] || '/placeholder.png',
          categoryId: data.categoryId || null,
          brandId: data.brandId || null,
          subCategoryId: data.subCategoryId || null,
          isFeatured: Boolean(data.isFeatured || (data as any).isCustomerFavorite || (data as any).isTrending),
          isNewArrival: Boolean(data.isNewArrival),
          isBestSeller: Boolean(data.isBestSeller),
        },
      });

      if (data.images && data.images.length > 0) {
        await tx.productImage.createMany({
          data: data.images.map((url, idx) => ({
            productId: product.id,
            url,
            sortOrder: idx,
          })),
        });
      }

      if (data.variants && data.variants.length > 0) {
        for (const [idx, v] of data.variants.entries()) {
          const skuSalt = Math.random().toString(36).substring(2, 7).toUpperCase();
          let sku = v.sku || `${slug.slice(0, 10).toUpperCase()}-${v.size}-${v.color}-${idx + 1}-${skuSalt}`;
          
          const existingVariant = await tx.productVariant.findUnique({
            where: { sku },
            select: { id: true },
          });
          if (existingVariant) {
            sku = `${sku}-${skuSalt}`;
          }

          await tx.productVariant.create({
            data: {
              productId: product.id,
              sku,
              size: v.size,
              color: v.color,
              colorHex: v.colorHex || null,
              image: v.image || null,
              price: new Prisma.Decimal(v.price),
              offerPrice: v.offerPrice ? new Prisma.Decimal(v.offerPrice) : null,
              qty: v.qty || 0,
              isActive: true,
            } as any,
          });
        }
      }

      return product.id;
    });

    return this.getById(createdId);
  }

  async update(id: string, data: any) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Product ${id} not found`);
    }

    await this.prisma.product.update({
      where: { id },
      data: {
        name: data.name ?? existing.name,
        description: data.description !== undefined ? data.description : existing.description,
        fabric: data.fabric !== undefined ? data.fabric : existing.fabric,
        careInstructions: data.careInstructions !== undefined ? data.careInstructions : existing.careInstructions,
        image: data.image ?? existing.image,
        categoryId: data.categoryId !== undefined ? data.categoryId : existing.categoryId,
        brandId: data.brandId !== undefined ? data.brandId : existing.brandId,
        subCategoryId: data.subCategoryId !== undefined ? data.subCategoryId : existing.subCategoryId,
        isFeatured: data.isFeatured !== undefined ? Boolean(data.isFeatured) : (data as any).isCustomerFavorite !== undefined ? Boolean((data as any).isCustomerFavorite) : (data as any).isTrending !== undefined ? Boolean((data as any).isTrending) : existing.isFeatured,
        isNewArrival: data.isNewArrival !== undefined ? Boolean(data.isNewArrival) : existing.isNewArrival,
        isBestSeller: data.isBestSeller !== undefined ? Boolean(data.isBestSeller) : existing.isBestSeller,
        isArchived: data.isArchived !== undefined ? Boolean(data.isArchived) : existing.isArchived,
      },
    });

    if (Array.isArray(data.variants) && data.variants.length > 0) {
      for (const v of data.variants) {
        if (v.id && !String(v.id).startsWith("temp_")) {
          await this.updateVariant(String(v.id), v).catch(() => {});
        } else if (v.isNew || String(v.id || "").startsWith("temp_")) {
          await this.addVariant(id, v).catch(() => {});
        }
      }
    }

    return this.getById(id);
  }

  async delete(id: string) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Product ${id} not found`);
    }

    // Soft delete by setting isArchived: true
    await this.prisma.product.update({
      where: { id },
      data: { isArchived: true },
    });

    return { message: 'Product archived successfully', id };
  }

  async getVariants(productId: string) {
    return this.prisma.productVariant.findMany({
      where: { productId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addVariant(productId: string, data: any) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException(`Product ${productId} not found`);

    let sku =
      data.sku ||
      `${product.slug.slice(0, 10).toUpperCase()}-${data.size}-${data.color}-${Date.now().toString(36)}`;

    const existingSku = await this.prisma.productVariant.findUnique({ where: { sku } });
    if (existingSku) {
      sku = `${sku}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    }

    return this.prisma.productVariant.create({
      data: {
        productId,
        sku,
        size: data.size,
        color: data.color,
        colorHex: data.colorHex || null,
        image: data.image || null,
        price: new Prisma.Decimal(data.price),
        offerPrice: data.offerPrice ? new Prisma.Decimal(data.offerPrice) : null,
        qty: data.qty ?? data.stock ?? 0,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
      } as any,
    });
  }

  async updateVariant(variantId: string, data: any) {
    const existing = await this.prisma.productVariant.findUnique({ where: { id: variantId } }) as any;
    if (!existing) throw new NotFoundException(`Variant ${variantId} not found`);

    return this.prisma.productVariant.update({
      where: { id: variantId },
      data: {
        sku: data.sku ?? existing.sku,
        size: data.size ?? existing.size,
        color: data.color ?? existing.color,
        colorHex: data.colorHex !== undefined ? data.colorHex : existing.colorHex,
        image: data.image !== undefined ? data.image : existing.image,
        price: data.price ? new Prisma.Decimal(data.price) : existing.price,
        offerPrice:
          data.offerPrice !== undefined
            ? data.offerPrice
              ? new Prisma.Decimal(data.offerPrice)
              : null
            : existing.offerPrice,
        qty:
          data.qty !== undefined
            ? Number(data.qty)
            : data.stock !== undefined
            ? Number(data.stock)
            : existing.qty,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : existing.isActive,
      } as any,
    });
  }

  async deleteVariant(variantId: string) {
    const existing = await this.prisma.productVariant.findUnique({ where: { id: variantId } });
    if (!existing) throw new NotFoundException(`Variant ${variantId} not found`);

    await this.prisma.productVariant.delete({ where: { id: variantId } });
    return { message: 'Variant deleted successfully', id: variantId };
  }
}

