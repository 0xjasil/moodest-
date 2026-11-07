'use server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedAdmin } from './admin-user-action';

// Types for filters and responses
export interface DateRangeFilter {
  startDate?: Date;
  endDate?: Date;
}

export interface SalesMetricsFilter extends DateRangeFilter {
  status?: 'PENDING' | 'PAID' | 'FAILED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  paymentMethod?: 'COD' | 'ONLINE';
  userId?: string;
}

export interface ProductFilter {
  brandId?: string;
  categoryId?: string;
  subCategoryId?: string;
  lowStock?: number; // Variants with qty <= this value
  minPrice?: number;
  maxPrice?: number;
  searchTerm?: string;
}

export interface SalesMetrics {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  totalRevenue: number;
}

export interface TopSellingProduct {
  id: string;
  variantId: string;
  name: string;
  sku: string;
  totalQuantitySold: number;
  totalRevenue: number;
  currentStock: number;
  brand?: string;
  category?: string;
  image: string;
  variantOptions: string; // e.g., "Red - Large"
}

export interface ProductInventory {
  id: string;
  productId: string;
  name: string;
  sku: string;
  currentStock: number;
  price: number;
  brand?: string;
  category?: string;
  subCategory?: string;
  images: string[];
  variantOptions: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderSummary {
  id: string;
  userId: string | null;
  userName: string;
  userEmail: string;
  totalAmount: number;
  status: string;
  paymentMethod: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  createdAt: Date;
  itemCount: number;
  phoneNumber: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
}

// Helper function to format variant options
function formatVariantOptions(options: Array<{ attribute: { name: string }; attributeValue: { value: string } }>): string {
  return options.map(opt => `${opt.attribute.name}: ${opt.attributeValue.value}`).join(', ');
}

// Sales Metrics Server Action
export async function getSalesMetrics(filter: SalesMetricsFilter = {}): Promise<SalesMetrics> {
  try {
    await getAuthenticatedAdmin();
    const whereClause: Record<string, unknown> = {};

    if (filter.startDate || filter.endDate) {
      whereClause.createdAt = {};
      if (filter.startDate) {
        (whereClause.createdAt as Record<string, unknown>).gte = filter.startDate;
      }
      if (filter.endDate) {
        (whereClause.createdAt as Record<string, unknown>).lte = filter.endDate;
      }
    }

    if (filter.status) {
      whereClause.status = filter.status;
    }

    if (filter.paymentMethod) {
      whereClause.paymentMethod = filter.paymentMethod;
    }

    if (filter.userId) {
      whereClause.userId = filter.userId;
    }

    const [totalSales, salesAggregation] = await Promise.all([
      prisma.order.count({
        where: whereClause,
      }),
      
      prisma.order.aggregate({
        where: whereClause,
        _sum: {
          totalAmount: true,
        },
        _avg: {
          totalAmount: true,
        },
      }),
    ]);

    return {
      totalSales,
      totalOrders: totalSales,
      averageOrderValue: salesAggregation._avg.totalAmount || 0,
      totalRevenue: salesAggregation._sum.totalAmount || 0,
    };
  } catch (error) {
    console.error('Error fetching sales metrics:', error);
    throw new Error('Failed to fetch sales metrics');
  }
}

// Top Selling Products Server Action (now based on variants)
export async function getTopSellingProducts(
  limit: number = 10,
  filter: DateRangeFilter = {}
): Promise<TopSellingProduct[]> {
  try {
    await getAuthenticatedAdmin();
    const whereClause: Record<string, unknown> = {};

    if (filter.startDate || filter.endDate) {
      whereClause.order = {
        createdAt: {}
      };
      if (filter.startDate) {
        ((whereClause.order as Record<string, unknown>).createdAt as Record<string, unknown>).gte = filter.startDate;
      }
      if (filter.endDate) {
        ((whereClause.order as Record<string, unknown>).createdAt as Record<string, unknown>).lte = filter.endDate;
      }
    }

    const topVariants = await prisma.orderItem.groupBy({
      by: ['variantId'],
      where: whereClause,
      _sum: {
        quantity: true,
        price: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: limit,
    });

    const variantsWithDetails = await Promise.all(
      topVariants.map(async (item) => {
        const variant = await prisma.productVariant.findUnique({
          where: { id: item.variantId },
          include: {
            product: {
              include: {
                brand: true,
                category: true,
              },
            },
            options: {
              include: {
                attribute: true,
                attributeValue: true,
              },
            },
          },
        });

        if (!variant) {
          throw new Error(`Variant not found: ${item.variantId}`);
        }

        return {
          id: variant.product.id,
          variantId: variant.id,
          name: variant.product.name,
          sku: variant.sku,
          totalQuantitySold: item._sum.quantity || 0,
          totalRevenue: item._sum.price || 0,
          currentStock: variant.qty,
          brand: variant.product.brand?.name,
          category: variant.product.category?.name,
          image: variant.images[0] || variant.product.image,
          variantOptions: formatVariantOptions(variant.options),
        };
      })
    );

    return variantsWithDetails;
  } catch (error) {
    console.error('Error fetching top selling products:', error);
    throw new Error('Failed to fetch top selling products');
  }
}

// Product Inventory Report Server Action (now based on variants)
export async function getProductInventory(filter: ProductFilter = {}): Promise<ProductInventory[]> {
  try {
    await getAuthenticatedAdmin();
    const whereClause: Record<string, unknown> = {};

    // Build where clause for the product
    const productWhere: Record<string, unknown> = {};

    if (filter.brandId) {
      productWhere.brandId = filter.brandId;
    }

    if (filter.categoryId) {
      productWhere.categoryId = filter.categoryId;
    }

    if (filter.subCategoryId) {
      productWhere.subCategoryId = filter.subCategoryId;
    }

    if (filter.searchTerm) {
      productWhere.OR = [
        {
          name: {
            contains: filter.searchTerm,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: filter.searchTerm,
            mode: 'insensitive',
          },
        },
      ];
    }

    if (Object.keys(productWhere).length > 0) {
      whereClause.product = productWhere;
    }

    // Low stock filter
    if (filter.lowStock !== undefined) {
      whereClause.qty = {
        lte: filter.lowStock,
      };
    }

    // Price range filter
    if (filter.minPrice !== undefined || filter.maxPrice !== undefined) {
      whereClause.price = {};
      if (filter.minPrice !== undefined) {
        (whereClause.price as Record<string, unknown>).gte = filter.minPrice;
      }
      if (filter.maxPrice !== undefined) {
        (whereClause.price as Record<string, unknown>).lte = filter.maxPrice;
      }
    }

    const variants = await prisma.productVariant.findMany({
      where: whereClause,
      include: {
        product: {
          include: {
            brand: true,
            category: true,
            subCategory: true,
          },
        },
        options: {
          include: {
            attribute: true,
            attributeValue: true,
          },
        },
      },
      orderBy: {
        qty: 'asc',
      },
    });

    return variants.map((variant) => ({
      id: variant.id,
      productId: variant.product.id,
      name: variant.product.name,
      sku: variant.sku,
      currentStock: variant.qty,
      price: variant.price,
      brand: variant.product.brand?.name,
      category: variant.product.category?.name,
      subCategory: variant.product.subCategory?.name,
      images: variant.images,
      variantOptions: formatVariantOptions(variant.options),
      createdAt: variant.createdAt,
      updatedAt: variant.updatedAt,
    }));
  } catch (error) {
    console.error('Error fetching product inventory:', error);
    throw new Error('Failed to fetch product inventory');
  }
}

// Orders with Payment Status Server Action
export async function getOrdersWithPaymentStatus(
  filter: SalesMetricsFilter = {}
): Promise<OrderSummary[]> {
  try {
    await getAuthenticatedAdmin();
    const whereClause: Record<string, unknown> = {};

    if (filter.startDate || filter.endDate) {
      whereClause.createdAt = {};
      if (filter.startDate) {
        (whereClause.createdAt as Record<string, unknown>).gte = filter.startDate;
      }
      if (filter.endDate) {
        (whereClause.createdAt as Record<string, unknown>).lte = filter.endDate;
      }
    }

    if (filter.status) {
      whereClause.status = filter.status;
    }

    if (filter.paymentMethod) {
      whereClause.paymentMethod = filter.paymentMethod;
    }

    if (filter.userId) {
      whereClause.userId = filter.userId;
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        items: {
          select: {
            quantity: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return orders.map((order) => ({
      id: order.id,
      userId: order.userId,
      userName: order.user?.name || order.name || "Guest",
      userEmail: order.user?.email || order.email || "",
      totalAmount: order.totalAmount,
      status: order.status,
      paymentMethod: order.paymentMethod,
      razorpayOrderId: order.razorpayOrderId || undefined,
      razorpayPaymentId: order.razorpayPaymentId || undefined,
      createdAt: order.createdAt,
      itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
      phoneNumber: order.phoneNumber,
      street: order.street,
      city: order.city,
      state: order.state,
      pincode: order.pincode,
    }));
  } catch (error) {
    console.error('Error fetching orders with payment status:', error);
    throw new Error('Failed to fetch orders with payment status');
  }
}

// Get Low Stock Products Alert
export async function getLowStockProducts(threshold: number = 10): Promise<ProductInventory[]> {
  try {
    await getAuthenticatedAdmin();
    const products = await getProductInventory({ lowStock: threshold });
    return products;
  } catch (error) {
    console.error('Error fetching low stock products:', error);
    throw new Error('Failed to fetch low stock products');
  }
}

// Get Sales by Date Range (for charts/graphs)
export async function getSalesByDateRange(
  filter: DateRangeFilter = {}
): Promise<Array<{ date: string; sales: number; orders: number }>> {
  try {
    await getAuthenticatedAdmin();
    const whereClause: Record<string, unknown> = {};

    if (filter.startDate || filter.endDate) {
      whereClause.createdAt = {};
      if (filter.startDate) {
        (whereClause.createdAt as Record<string, unknown>).gte = filter.startDate;
      }
      if (filter.endDate) {
        (whereClause.createdAt as Record<string, unknown>).lte = filter.endDate;
      }
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      select: {
        createdAt: true,
        totalAmount: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const salesByDate = orders.reduce((acc: Record<string, { sales: number; orders: number }>, order) => {
      const date = order.createdAt.toISOString().split('T')[0];
      
      if (!acc[date]) {
        acc[date] = { sales: 0, orders: 0 };
      }
      
      acc[date].sales += order.totalAmount;
      acc[date].orders += 1;
      
      return acc;
    }, {});

    return Object.entries(salesByDate).map(([date, data]) => ({
      date,
      sales: data.sales,
      orders: data.orders,
    }));
  } catch (error) {
    console.error('Error fetching sales by date range:', error);
    throw new Error('Failed to fetch sales by date range');
  }
}

// Get Available Filter Options
export async function getFilterOptions(): Promise<{
  brands: Array<{ id: string; name: string }>;
  categories: Array<{ id: string; name: string }>;
  subCategories: Array<{ id: string; name: string; categoryId: string }>;
}> {
  try {
    await getAuthenticatedAdmin();
    const [brands, categories, subCategories] = await Promise.all([
      prisma.brand.findMany({
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          name: 'asc',
        },
      }),
      
      prisma.category.findMany({
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          name: 'asc',
        },
      }),
      
      prisma.subCategory.findMany({
        select: {
          id: true,
          name: true,
          categoryId: true,
        },
        orderBy: {
          name: 'asc',
        },
      }),
    ]);

    return {
      brands,
      categories,
      subCategories,
    };
  } catch (error) {
    console.error('Error fetching filter options:', error);
    throw new Error('Failed to fetch filter options');
  }
}

// Get Order Details with Items
export async function getOrderDetails(orderId: string): Promise<{
  order: OrderSummary & {
    items: Array<{
      id: string;
      variantId: string;
      productId: string;
      productName: string;
      sku: string;
      variantOptions: string;
      quantity: number;
      price: number;
      productImages: string[];
    }>;
  };
} | null> {
  try {
    await getAuthenticatedAdmin();
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            variant: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    image: true,
                  },
                },
                options: {
                  include: {
                    attribute: true,
                    attributeValue: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!order) {
      return null;
    }

    return {
      order: {
        id: order.id,
        userId: order.userId,
        userName: order.user?.name || order.name || "Guest",
        userEmail: order.user?.email || order.email || "",
        totalAmount: order.totalAmount,
        status: order.status,
        paymentMethod: order.paymentMethod,
        razorpayOrderId: order.razorpayOrderId || undefined,
        razorpayPaymentId: order.razorpayPaymentId || undefined,
        createdAt: order.createdAt,
        itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
        phoneNumber: order.phoneNumber,
        street: order.street,
        city: order.city,
        state: order.state,
        pincode: order.pincode,
        items: order.items.map((item) => ({
          id: item.id,
          variantId: item.variant.id,
          productId: item.variant.product.id,
          productName: item.variant.product.name,
          sku: item.variant.sku,
          variantOptions: formatVariantOptions(item.variant.options),
          quantity: item.quantity,
          price: item.price,
          productImages: item.variant.images,
        })),
      },
    };
  } catch (error) {
    console.error('Error fetching order details:', error);
    throw new Error('Failed to fetch order details');
  }
}

// Get total products count (counting unique products, not variants)
export async function getTotalProductsCount(): Promise<number> {
  try {
    await getAuthenticatedAdmin();
    const count = await prisma.product.count();
    return count;
  } catch (error) {
    console.error('Error fetching total products count:', error);
    throw new Error('Failed to fetch total products count');
  }
}

// Get total variants count
export async function getTotalVariantsCount(): Promise<number> {
  try {
    await getAuthenticatedAdmin();
    const count = await prisma.productVariant.count();
    return count;
  } catch (error) {
    console.error('Error fetching total variants count:', error);
    throw new Error('Failed to fetch total variants count');
  }
}