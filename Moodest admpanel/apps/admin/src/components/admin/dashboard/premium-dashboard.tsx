"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Package,
  AlertTriangle,
  ArrowUpRight,
  Plus,
  ArrowRight,
  ChevronRight,
  Layers,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { rupee } from "@/constants/values";

// Types
export interface DashboardMetrics {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  conversionRate: number;
  revenueChange: number;
  ordersChange: number;
  aovChange: number;
  totalProducts: number;
  totalVariants: number;
  lowStockCount: number;
  categoriesCount: number;
  brandsCount: number;
  subcategoriesCount: number;
}

export interface RecentOrder {
  id: string;
  userName: string;
  userEmail?: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}

export interface LowStockItem {
  id: string;
  name: string;
  brand?: string;
  variantOptions?: string;
  sku?: string;
  currentStock: number;
}

interface PremiumDashboardProps {
  metrics: DashboardMetrics;
  recentOrders: RecentOrder[];
  lowStockItems: LowStockItem[];
}

// Chart dataset for 7D / 30D / 90D
const chartDataByRange: Record<
  string,
  { label: string; revenue: number; orders: number }[]
> = {
  "7D": [
    { label: "Mon", revenue: 14200, orders: 38 },
    { label: "Tue", revenue: 18500, orders: 49 },
    { label: "Wed", revenue: 16800, orders: 42 },
    { label: "Thu", revenue: 22100, orders: 58 },
    { label: "Fri", revenue: 26400, orders: 69 },
    { label: "Sat", revenue: 31200, orders: 84 },
    { label: "Sun", revenue: 28900, orders: 76 },
  ],
  "30D": [
    { label: "W1", revenue: 84000, orders: 210 },
    { label: "W2", revenue: 98000, orders: 254 },
    { label: "W3", revenue: 112000, orders: 290 },
    { label: "W4", revenue: 124580, orders: 342 },
  ],
  "90D": [
    { label: "Aug", revenue: 294000, orders: 780 },
    { label: "Sep", revenue: 326000, orders: 890 },
    { label: "Oct", revenue: 372000, orders: 984 },
  ],
};

// Cohesive monochromatic & indigo tonal scale
const categoryBreakdown = [
  { name: "Apparel & Outerwear", percentage: 46, revenue: 57306, color: "bg-indigo-600 dark:bg-indigo-500" },
  { name: "Footwear & Sneakers", percentage: 28, revenue: 34882, color: "bg-indigo-400 dark:bg-indigo-400" },
  { name: "Leather Accessories", percentage: 18, revenue: 22424, color: "bg-slate-400 dark:bg-slate-500" },
  { name: "Essentials & Other", percentage: 8, revenue: 9966, color: "bg-slate-200 dark:bg-slate-700" },
];

export function PremiumDashboard({
  metrics,
  recentOrders,
  lowStockItems,
}: PremiumDashboardProps) {
  const [dateRange, setDateRange] = useState<"7D" | "30D" | "90D">("30D");
  const [metricView, setMetricView] = useState<"revenue" | "orders">("revenue");

  const currentChartData = chartDataByRange[dateRange] || chartDataByRange["30D"];
  const maxVal = Math.max(
    ...currentChartData.map((d) => (metricView === "revenue" ? d.revenue : d.orders)),
    1
  );

  return (
    <div className="space-y-6">
      {/* 1. Header Section with Single Font Scale & Date Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Performance Overview
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Key commerce indicators, sales velocity, and catalog health.
          </p>
        </div>

        {/* Date Filter Bar & Primary CTA */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center p-1 bg-white dark:bg-[#161616] border border-gray-200/80 dark:border-white/10 rounded-xl shadow-xs">
            {(["7D", "30D", "90D"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={cn(
                  "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all",
                  dateRange === range
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                )}
              >
                {range}
              </button>
            ))}
          </div>

          <Link
            href="/products/add-product"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Product</span>
          </Link>
        </div>
      </div>

      {/* 2. Hero KPI Cards: 12-Column Grid (Uniform Indigo icon branding) */}
      <div className="grid grid-cols-12 gap-6">
        {/* KPI 1: Revenue */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-3 p-6 rounded-2xl bg-white dark:bg-[#161616] border border-gray-200/80 dark:border-white/10 shadow-xs hover:border-gray-300 dark:hover:border-white/20 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Total Revenue
            </span>
            <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center">
              <DollarSign className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              {rupee} {metrics.totalRevenue.toLocaleString()}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                <ArrowUpRight className="h-3 w-3" />
                +{metrics.revenueChange.toFixed(1)}%
              </span>
              <span className="text-[11px] text-gray-500 dark:text-gray-400">
                vs last month
              </span>
            </div>
          </div>
        </div>

        {/* KPI 2: Total Orders */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-3 p-6 rounded-2xl bg-white dark:bg-[#161616] border border-gray-200/80 dark:border-white/10 shadow-xs hover:border-gray-300 dark:hover:border-white/20 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Total Orders
            </span>
            <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center">
              <ShoppingCart className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              {metrics.totalOrders.toLocaleString()}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                <ArrowUpRight className="h-3 w-3" />
                +{metrics.ordersChange.toFixed(1)}%
              </span>
              <span className="text-[11px] text-gray-500 dark:text-gray-400">
                vs last month
              </span>
            </div>
          </div>
        </div>

        {/* KPI 3: Average Order Value */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-3 p-6 rounded-2xl bg-white dark:bg-[#161616] border border-gray-200/80 dark:border-white/10 shadow-xs hover:border-gray-300 dark:hover:border-white/20 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Average Order
            </span>
            <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center">
              <TrendingUp className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              {rupee} {metrics.averageOrderValue.toFixed(2)}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                <ArrowUpRight className="h-3 w-3" />
                +{metrics.aovChange.toFixed(1)}%
              </span>
              <span className="text-[11px] text-gray-500 dark:text-gray-400">
                conversion {metrics.conversionRate}%
              </span>
            </div>
          </div>
        </div>

        {/* KPI 4: Inventory & Catalog */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-3 p-6 rounded-2xl bg-white dark:bg-[#161616] border border-gray-200/80 dark:border-white/10 shadow-xs hover:border-gray-300 dark:hover:border-white/20 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Inventory Health
            </span>
            <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center">
              <Package className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              {metrics.totalVariants}{" "}
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                SKUs
              </span>
            </div>
            <div className="mt-3 flex items-center gap-2">
              {metrics.lowStockCount > 0 ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                  <AlertTriangle className="h-3 w-3" />
                  {metrics.lowStockCount} Low Stock
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  Healthy
                </span>
              )}
              <span className="text-[11px] text-gray-500 dark:text-gray-400">
                {metrics.categoriesCount} categories
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Middle Row: Visual Chart (8 cols) + Category Breakdown (4 cols) */}
      <div className="grid grid-cols-12 gap-6">
        {/* Sales Performance Chart (8 cols) */}
        <div className="col-span-12 lg:col-span-8 p-6 rounded-2xl bg-white dark:bg-[#161616] border border-gray-200/80 dark:border-white/10 shadow-xs flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Sales Velocity & Trends
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Revenue and order momentum over the selected {dateRange} period.
              </p>
            </div>
            <div className="flex items-center gap-1 bg-[#F5F5F5] dark:bg-[#111111] p-1 rounded-xl self-start sm:self-auto border border-gray-200/80 dark:border-white/10">
              <button
                onClick={() => setMetricView("revenue")}
                className={cn(
                  "px-3 py-1 text-xs font-semibold rounded-lg transition-colors",
                  metricView === "revenue"
                    ? "bg-white dark:bg-[#202020] text-gray-900 dark:text-white shadow-xs"
                    : "text-gray-500 hover:text-gray-900 dark:text-gray-400"
                )}
              >
                Revenue ({rupee})
              </button>
              <button
                onClick={() => setMetricView("orders")}
                className={cn(
                  "px-3 py-1 text-xs font-semibold rounded-lg transition-colors",
                  metricView === "orders"
                    ? "bg-white dark:bg-[#202020] text-gray-900 dark:text-white shadow-xs"
                    : "text-gray-500 hover:text-gray-900 dark:text-gray-400"
                )}
              >
                Orders
              </button>
            </div>
          </div>

          {/* Chart Display: Occupies 65% of height with minimal axes and rounded caps */}
          <div className="flex-1 min-h-[240px] flex items-end gap-3 sm:gap-6 pt-6 pb-2 px-2 border-b border-gray-100 dark:border-white/10 relative">
            {currentChartData.length === 0 ? (
              // Empty / Zero State (Non-negotiable rule)
              <div className="w-full h-full flex flex-col items-center justify-center text-center p-8">
                <Package className="h-8 w-8 text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  No sales recorded for this timeframe
                </p>
              </div>
            ) : (
              currentChartData.map((item) => {
                const value =
                  metricView === "revenue" ? item.revenue : item.orders;
                const heightPercent = Math.max(
                  Math.round((value / maxVal) * 100),
                  8
                );
                return (
                  <div
                    key={item.label}
                    className="flex-1 flex flex-col items-center gap-2 group h-full justify-end"
                  >
                    {/* Tooltip on hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[11px] font-semibold text-gray-900 dark:text-white bg-gray-100 dark:bg-[#202020] px-2 py-0.5 rounded-md shadow-xs pointer-events-none whitespace-nowrap">
                      {metricView === "revenue"
                        ? `${rupee} ${value.toLocaleString()}`
                        : `${value} orders`}
                    </div>

                    {/* Bar with rounded caps */}
                    <div className="w-full bg-gray-100 dark:bg-white/5 rounded-t-lg overflow-hidden flex items-end h-[180px]">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full rounded-t-lg transition-all duration-500 bg-gradient-to-t from-indigo-600 to-indigo-400 group-hover:from-indigo-500 group-hover:to-indigo-300"
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      {item.label}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex items-center justify-between pt-4 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-indigo-600" />
              {metricView === "revenue" ? "Gross Order Volume" : "Placed Orders"}
            </span>
            <Link
              href="/analytics"
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium inline-flex items-center gap-1"
            >
              Detailed Analytics <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Category & Distribution (4 cols) */}
        <div className="col-span-12 lg:col-span-4 p-6 rounded-2xl bg-white dark:bg-[#161616] border border-gray-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Revenue by Category
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Top performing product departments this month.
            </p>

            <div className="space-y-4 mt-6">
              {categoryBreakdown.map((cat) => (
                <div key={cat.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-gray-700 dark:text-gray-300">
                      {cat.name}
                    </span>
                    <span className="text-gray-900 dark:text-white font-semibold">
                      {rupee} {cat.revenue.toLocaleString()}{" "}
                      <span className="text-gray-400 font-normal">
                        ({cat.percentage}%)
                      </span>
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-white/5 rounded-full h-2 overflow-hidden">
                    <div
                      style={{ width: `${cat.percentage}%` }}
                      className={cn("h-full rounded-full", cat.color)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-white/10 flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              4 Product Categories
            </span>
            <Link
              href="/category"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 hover:underline"
            >
              Manage Catalog →
            </Link>
          </div>
        </div>
      </div>

      {/* 4. Bottom Row: Recent Orders (7 cols) + Low Stock & Actions (5 cols) */}
      <div className="grid grid-cols-12 gap-6">
        {/* Recent Orders Table (7 cols) */}
        <div className="col-span-12 lg:col-span-7 p-6 rounded-2xl bg-white dark:bg-[#161616] border border-gray-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Recent Orders
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Real-time transaction stream from customer checkout.
                </p>
              </div>
              <Link
                href="/orders"
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 hover:underline inline-flex items-center gap-1"
              >
                All Orders <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200/80 dark:border-white/10 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    <th className="py-2.5 pr-4">Order ID</th>
                    <th className="py-2.5 px-4">Customer</th>
                    <th className="py-2.5 px-4">Amount</th>
                    <th className="py-2.5 pl-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-sm">
                  {recentOrders.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-8 text-center text-xs text-gray-400"
                      >
                        No recent orders found
                      </td>
                    </tr>
                  ) : (
                    recentOrders.slice(0, 5).map((order, idx) => {
                      const isDelivered = order.status === "DELIVERED";
                      const isShipped = order.status === "SHIPPED";
                      const isPending = order.status === "PENDING";
                      const isCancelled = order.status === "CANCELLED";

                      return (
                        <tr
                          key={order.id}
                          className={cn(
                            "hover:bg-[#FAFAFA] dark:hover:bg-white/5 transition-colors",
                            idx % 2 === 1 && "bg-[#FBFBFB]/50 dark:bg-white/[0.02]"
                          )}
                        >
                          <td className="py-3 pr-4 font-mono text-xs font-semibold text-gray-900 dark:text-white">
                            #{order.id.slice(-6).toUpperCase()}
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-medium text-xs text-gray-900 dark:text-white truncate max-w-[140px]">
                              {order.userName}
                            </p>
                            <p className="text-[11px] text-gray-400 truncate max-w-[140px]">
                              {order.userEmail || "Customer"}
                            </p>
                          </td>
                          <td className="py-3 px-4 font-semibold text-xs text-gray-900 dark:text-white">
                            {rupee} {order.totalAmount.toFixed(2)}
                          </td>
                          <td className="py-3 pl-4 text-right">
                            <span
                              className={cn(
                                "inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold",
                                isDelivered &&
                                  "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20",
                                isShipped &&
                                  "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-500/20",
                                isPending &&
                                  "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20",
                                isCancelled &&
                                  "bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20"
                              )}
                            >
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-white/10 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Showing latest 5 orders</span>
            <span>Total {metrics.totalOrders} processed</span>
          </div>
        </div>

        {/* Stock Alerts & Quick Operations (5 cols) */}
        <div className="col-span-12 lg:col-span-5 space-y-6">
          {/* Stock Alerts Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#161616] border border-gray-200/80 dark:border-white/10 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Stock Alerts
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Variants below safety reorder threshold
                  </p>
                </div>
              </div>
              <Link
                href="/inventory"
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 hover:underline"
              >
                Inventory →
              </Link>
            </div>

            <div className="space-y-3">
              {lowStockItems.length === 0 ? (
                <div className="py-4 text-center text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  ✓ All products are adequately stocked
                </div>
              ) : (
                lowStockItems.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-[#FAFAFA] dark:bg-[#1c1c1c] border border-gray-200/60 dark:border-white/5 flex items-center justify-between"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                        {item.name}
                      </p>
                      <p className="text-[11px] text-gray-400 truncate">
                        {item.brand || "Brand"} • SKU: {item.sku || "N/A"}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0",
                        item.currentStock === 0
                          ? "bg-rose-500/15 text-rose-600 border border-rose-500/30"
                          : "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30"
                      )}
                    >
                      {item.currentStock} left
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Operations Action Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#161616] border border-gray-200/80 dark:border-white/10 shadow-xs">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Quick Administrative Tasks
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              <Link
                href="/products/add-product"
                className="p-3 rounded-xl bg-[#FAFAFA] dark:bg-[#1c1c1c] hover:bg-indigo-50/50 hover:border-indigo-200/80 dark:hover:bg-indigo-500/10 dark:hover:border-indigo-500/20 border border-gray-200/60 dark:border-white/5 transition-all group"
              >
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-gray-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                    Add Product
                  </span>
                </div>
              </Link>

              <Link
                href="/orders"
                className="p-3 rounded-xl bg-[#FAFAFA] dark:bg-[#1c1c1c] hover:bg-indigo-50/50 hover:border-indigo-200/80 dark:hover:bg-indigo-500/10 dark:hover:border-indigo-500/20 border border-gray-200/60 dark:border-white/5 transition-all group"
              >
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-gray-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                    Process Orders
                  </span>
                </div>
              </Link>

              <Link
                href="/coupons"
                className="p-3 rounded-xl bg-[#FAFAFA] dark:bg-[#1c1c1c] hover:bg-indigo-50/50 hover:border-indigo-200/80 dark:hover:bg-indigo-500/10 dark:hover:border-indigo-500/20 border border-gray-200/60 dark:border-white/5 transition-all group"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-gray-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                    New Coupon
                  </span>
                </div>
              </Link>

              <Link
                href="/banners"
                className="p-3 rounded-xl bg-[#FAFAFA] dark:bg-[#1c1c1c] hover:bg-indigo-50/50 hover:border-indigo-200/80 dark:hover:bg-indigo-500/10 dark:hover:border-indigo-500/20 border border-gray-200/60 dark:border-white/5 transition-all group"
              >
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-gray-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                    Hero Banners
                  </span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
