import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class StoreService {
  constructor(private readonly prisma: PrismaService) {}

  // --- COUPONS ---

  async validateCoupon(code: string, orderAmount: number) {
    if (!code) {
      throw new BadRequestException('Coupon code is required');
    }

    const coupon = await this.prisma.coupon.findUnique({
      where: { code: code.trim().toUpperCase() },
    });

    if (!coupon || !coupon.isActive) {
      return {
        valid: false,
        message: 'Invalid or inactive coupon code',
        discount: 0,
      };
    }

    const now = new Date();
    if (now < coupon.startDate || now > coupon.endDate) {
      return {
        valid: false,
        message: 'Coupon code has expired',
        discount: 0,
      };
    }

    if (coupon.minOrderValue && orderAmount < Number(coupon.minOrderValue)) {
      return {
        valid: false,
        message: `Minimum order value of ₹${coupon.minOrderValue} required for this coupon`,
        discount: 0,
      };
    }

    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return {
        valid: false,
        message: 'Coupon usage limit has been reached',
        discount: 0,
      };
    }

    let discount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discount = (orderAmount * Number(coupon.discountValue)) / 100;
      if (coupon.maxDiscount) {
        discount = Math.min(discount, Number(coupon.maxDiscount));
      }
    } else {
      discount = Number(coupon.discountValue);
    }

    discount = Math.min(discount, orderAmount);

    return {
      valid: true,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: Number(coupon.discountValue),
      discountAmount: discount,
      discount,
      message: 'Coupon applied successfully',
    };
  }

  async getAllCoupons() {
    return this.prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async createCoupon(data: any) {
    return this.prisma.coupon.create({
      data: {
        code: data.code.toUpperCase(),
        discountType: data.discountType,
        discountValue: new Prisma.Decimal(data.discountValue),
        minOrderValue: data.minOrderAmount ? new Prisma.Decimal(data.minOrderAmount) : new Prisma.Decimal(0),
        maxDiscount: data.maxDiscount ? new Prisma.Decimal(data.maxDiscount) : null,
        startDate: data.startDate ? new Date(data.startDate) : new Date(),
        endDate: data.expiresAt ? new Date(data.expiresAt) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        usageLimit: data.maxUses ? Number(data.maxUses) : null,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
      },
    });
  }

  async deleteCoupon(id: string) {
    await this.prisma.coupon.delete({ where: { id } });
    return { message: 'Coupon deleted successfully', id };
  }

  // --- REVIEWS ---

  async getProductReviews(productId: string, page: number = 1, limit: number = 10) {
    const skip = (Math.max(1, page) - 1) * limit;

    const [total, reviews] = await Promise.all([
      this.prisma.review.count({ where: { productId } }),
      this.prisma.review.findMany({
        where: { productId },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const formatted = reviews.map((r) => {
      const nameParts = (r.user?.name || '').split(' ');
      return {
        id: r.id,
        productId: r.productId,
        userId: r.userId,
        rating: r.rating,
        title: r.comment ? r.comment.slice(0, 30) : '',
        body: r.comment || '',
        comment: r.comment || '',
        createdAt: r.createdAt,
        user: r.user
          ? {
              id: r.user.id,
              email: r.user.email,
              name: r.user.name,
              firstName: nameParts[0] || 'Customer',
            }
          : undefined,
      };
    });

    return {
      reviews: formatted,
      data: formatted,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async createReview(userId: string, productId: string, dto: { rating: number; title?: string; body?: string; comment?: string }) {
    const comment = dto.comment || dto.body || dto.title || '';

    const review = await this.prisma.review.create({
      data: {
        userId,
        productId,
        rating: Math.min(5, Math.max(1, Number(dto.rating) || 5)),
        comment,
        isApproved: true,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return {
      id: review.id,
      productId: review.productId,
      userId: review.userId,
      rating: review.rating,
      comment: review.comment,
      title: dto.title || '',
      body: review.comment,
      createdAt: review.createdAt,
      user: review.user,
    };
  }

  // --- WISHLIST ---

  async getWishlist(userId: string) {
    let wishlist = await this.prisma.wishlist.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true,
                brand: true,
                variants: { where: { isActive: true } },
                images: true,
                reviews: { select: { rating: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!wishlist) {
      await this.prisma.wishlist.create({
        data: { userId },
      });
      return [];
    }

    return (wishlist.items || []).map((item: any) => {
      const p = item.product;
      const variants = p.variants || [];
      const basePrices = variants.map((v: any) => Number(v.price)).filter((pr: number) => !isNaN(pr));
      const basePrice = basePrices.length > 0 ? Math.min(...basePrices) : 0;

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        image: p.image || p.images?.[0]?.url || '/placeholder.png',
        images: (p.images || []).map((img: any) => img.url),
        basePrice,
        price: basePrice,
        category: p.category ? { id: p.category.id, name: p.category.name, slug: p.category.slug } : null,
        brand: p.brand ? { id: p.brand.id, name: p.brand.name, slug: p.brand.slug } : null,
        variants,
      };
    });
  }

  async addToWishlist(userId: string, productId: string) {
    let wishlist = await this.prisma.wishlist.findUnique({ where: { userId } });
    if (!wishlist) {
      wishlist = await this.prisma.wishlist.create({ data: { userId } });
    }

    const existing = await this.prisma.wishlistItem.findUnique({
      where: {
        wishlistId_productId: {
          wishlistId: wishlist.id,
          productId,
        },
      },
    });

    if (!existing) {
      await this.prisma.wishlistItem.create({
        data: {
          wishlistId: wishlist.id,
          productId,
        },
      });
    }

    return { message: 'Product added to wishlist', productId };
  }

  async removeFromWishlist(userId: string, productId: string) {
    const wishlist = await this.prisma.wishlist.findUnique({ where: { userId } });
    if (wishlist) {
      await this.prisma.wishlistItem.deleteMany({
        where: {
          wishlistId: wishlist.id,
          productId,
        },
      });
    }
    return { message: 'Product removed from wishlist', productId };
  }

  // --- BANNERS & FLASH SALES ---

  async getBanners() {
    return this.prisma.banner.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getFlashSales() {
    const featured = await this.prisma.product.findMany({
      where: { isArchived: false, isFeatured: true },
      include: { variants: { where: { isActive: true } } },
      take: 6,
    });

    return [
      {
        id: 1,
        name: 'Curated Elegance Flash Sale',
        slug: 'curated-elegance',
        startsAt: new Date().toISOString(),
        endsAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
        isActive: true,
        products: featured.map((p) => ({
          productId: p.id,
          salePrice: p.variants?.[0]?.offerPrice ? Number(p.variants[0].offerPrice) : Number(p.variants?.[0]?.price || 1999),
        })),
      },
    ];
  }

  // --- WALLET ---

  async getWallet(userId: string) {
    return {
      balance: 0,
      currency: 'INR',
      userId,
    };
  }

  async getWalletTransactions(userId: string) {
    return [];
  }

  async getWalletLedger(from?: string, to?: string) {
    return [];
  }
}
