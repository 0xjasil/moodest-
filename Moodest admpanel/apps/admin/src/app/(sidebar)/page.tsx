import {
  PremiumDashboard,
  type DashboardMetrics,
  type RecentOrder,
  type LowStockItem,
} from "@/components/admin/dashboard/premium-dashboard";
import { serverFetch } from "@/lib/api";
import type { DashboardStats } from "@/lib/api";

export const dynamic = "force-dynamic";

async function getDashboardData(): Promise<{
  metrics: DashboardMetrics;
  recentOrders: RecentOrder[];
  lowStockItems: LowStockItem[];
}> {
  try {
    // Real endpoint: GET /api/admin/dashboard
    const stats = await serverFetch<DashboardStats>("/admin/dashboard");

    const metrics: DashboardMetrics = {
      totalRevenue: stats.totalRevenue ?? 0,
      totalOrders: stats.totalOrders ?? 0,
      averageOrderValue:
        stats.totalOrders > 0
          ? Math.round(stats.totalRevenue / stats.totalOrders)
          : 0,
      conversionRate: 0, // not provided by this endpoint
      revenueChange: 0,
      ordersChange: 0,
      aovChange: 0,
      totalProducts: stats.totalProducts ?? 0,
      totalVariants: 0,
      lowStockCount: stats.lowStockCount ?? 0,
      categoriesCount: 0,
      brandsCount: 0,
      subcategoriesCount: 0,
    };

    const recentOrders: RecentOrder[] = (stats.recentOrders ?? []).map((o) => ({
      id: String(o.id),
      userName:
        o.user
          ? [o.user.firstName, o.user.lastName].filter(Boolean).join(" ") || o.user.email
          : `User #${o.userId}`,
      userEmail: o.user?.email,
      totalAmount: o.total ?? o.totalAmount ?? 0,
      status: o.status,
      createdAt: o.createdAt,
    }));

    // Low stock — fetch separately via admin/low-stock
    let lowStockItems: LowStockItem[] = [];
    try {
      const { serverFetch: sf } = await import("@/lib/api");
      const lowStock = await sf<Array<{
        id: number;
        productId: number;
        productName: string;
        sku: string;
        size: string;
        color: string;
        stock: number;
      }>>("/admin/low-stock?threshold=5");

      lowStockItems = Array.isArray(lowStock)
        ? lowStock.map((item) => ({
            id: String(item.productId),
            name: item.productName,
            sku: item.sku,
            variantOptions: `${item.size} / ${item.color}`,
            currentStock: item.stock,
          }))
        : [];
    } catch {
      // low-stock fetch is non-critical
    }

    return { metrics, recentOrders, lowStockItems };
  } catch (error) {
    // Backend unreachable or unauthorized — return empty dashboard gracefully
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes("Unauthorized") || msg.includes("401")) {
      console.warn("[Dashboard] Unauthenticated session — displaying default dashboard metrics");
    } else {
      console.warn("[Dashboard] Failed to fetch stats:", msg);
    }
    const metrics: DashboardMetrics = {
      totalRevenue: 0,
      totalOrders: 0,
      averageOrderValue: 0,
      conversionRate: 0,
      revenueChange: 0,
      ordersChange: 0,
      aovChange: 0,
      totalProducts: 0,
      totalVariants: 0,
      lowStockCount: 0,
      categoriesCount: 0,
      brandsCount: 0,
      subcategoriesCount: 0,
    };
    return { metrics, recentOrders: [], lowStockItems: [] };
  }
}

export default async function AdminDashboardPage() {
  const { metrics, recentOrders, lowStockItems } = await getDashboardData();

  return (
    <PremiumDashboard
      metrics={metrics}
      recentOrders={recentOrders}
      lowStockItems={lowStockItems}
    />
  );
}
