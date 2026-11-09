"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  ArrowUp,
  Plus,
  MoreVertical,
  Eye,
  Edit2,
  Trash2,
  Smartphone,
  Radio,
  Clock,
  Footprints,
  Watch,
  Laptop,
  Headphones,
  Armchair,
  Package,
  Users,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  Check,
} from "lucide-react";
import Checkbox from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProductDeleteDialog } from "@/components/product/delete-product-dialog";
import { ProductDetail } from "@/types/product";
import { API_URL } from "@/lib/api-client";
import { formatCurrency, cn } from "@/lib/utils";
import { toast } from "sonner";

export interface CommerceoProductItem {
  id: string;
  name: string;
  description: string;
  category: string;
  stock: boolean;
  sku: string;
  price: number;
  priceDisplay: string;
  qty: number;
  variantCount: number;
  availableSizes: string[];
  status: "Publish" | "Scheduled" | "Inactive";
  image?: string;
  iconType: "phone" | "speaker" | "clock" | "shoe" | "watch" | "laptop" | "vr" | "furniture" | "package";
  rawProduct?: ProductDetail;
}


function ProductIcon({ type, name }: { type: CommerceoProductItem["iconType"]; name: string }) {
  const iconProps = { className: "size-4 text-stone-700 dark:text-stone-300 stroke-[1.75]" };
  switch (type) {
    case "phone":
      return <Smartphone {...iconProps} />;
    case "speaker":
      return <Radio {...iconProps} />;
    case "clock":
      return <Clock {...iconProps} />;
    case "shoe":
      return <Footprints {...iconProps} />;
    case "watch":
      return <Watch {...iconProps} />;
    case "laptop":
      return <Laptop {...iconProps} />;
    case "vr":
      return <Headphones {...iconProps} />;
    case "furniture":
      return <Armchair {...iconProps} />;
    default:
      return <Package {...iconProps} />;
  }
}

export default function CommerceoProductList() {
  const router = useRouter();

  // Data & loading states
  const [products, setProducts] = useState<CommerceoProductItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<string>("all");
  const [sizeFilter, setSizeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Selection states
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Deletion modal
  const [deleteProduct, setDeleteProduct] = useState<ProductDetail | null>(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);

  // Load backend products and merge with reference list if desired
  const fetchProductsFromApi = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/products?limit=50`).catch(() => fetch(`${API_URL}/products?limit=50`));
      if (res.ok) {
        const json = await res.json();
        const apiData: ProductDetail[] = Array.isArray(json) ? json : json.data || [];
        if (apiData.length > 0) {
          const mapped: CommerceoProductItem[] = apiData.map((item, idx) => {
            const variants = item.variants || [];
            const variantCount = variants.length;
            const totalQty = variants.reduce((acc, v) => acc + (Number(v.qty) || 0), 0);
            const inStock = totalQty > 0;
            const firstVariant = variants[0];
            const price = firstVariant ? Number(firstVariant.price) : 0;
            const sku = firstVariant?.sku || `MDS-${item.id}`;

            // Derive sizes strictly from variants
            const sizeSet = new Set<string>();
            variants.forEach((v) => {
              const sz =
                v.size ||
                v.options?.find((o) => o.attribute?.name?.toLowerCase() === "size")
                  ?.attributeValue?.value;
              if (sz) sizeSet.add(sz);
            });
            const availableSizes = Array.from(sizeSet).sort();

            // Strictly derive price or price range from variants - no secondary pricing source
            const prices = variants
              .map((v) => Number(v.price))
              .filter((p) => !isNaN(p) && p > 0);
            let priceDisplay = "-";
            if (prices.length > 0) {
              const minPrice = Math.min(...prices);
              const maxPrice = Math.max(...prices);
              priceDisplay =
                minPrice === maxPrice
                  ? formatCurrency(minPrice)
                  : `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`;
            } else if (price > 0) {
              priceDisplay = formatCurrency(price);
            }

            const categoryName = item.category?.name || "Abayas";
            const statuses: ("Publish" | "Scheduled" | "Inactive")[] = [
              "Publish",
              "Scheduled",
              "Inactive",
            ];
            const assignedStatus = statuses[idx % 3];

            return {
              id: item.id,
              name: item.name,
              description: item.description || "High-quality abaya store catalog item",
              category: categoryName,
              stock: inStock,
              sku,
              price,
              priceDisplay,
              qty: totalQty,
              variantCount,
              availableSizes,
              status: assignedStatus,
              image: item.image,
              iconType: "package",
              rawProduct: item,
            };
          });

          setProducts(mapped);
        } else {
          setProducts([]);
        }
      } else {
        setProducts([]);
      }
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProductsFromApi();
  }, [fetchProductsFromApi]);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  // Extract unique variant sizes
  const availableVariantSizes = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      (p.availableSizes || []).forEach((sz) => set.add(sz));
    });
    return Array.from(set).sort();
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Status
      if (statusFilter !== "all" && p.status.toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }
      // Category
      if (categoryFilter !== "all" && p.category.toLowerCase() !== categoryFilter.toLowerCase()) {
        return false;
      }
      // Stock
      if (stockFilter === "in_stock" && !p.stock) return false;
      if (stockFilter === "out_of_stock" && p.stock) return false;
      // Size / Variant
      if (sizeFilter !== "all") {
        const hasSize = (p.availableSizes || []).some(
          (s) => s.toLowerCase() === sizeFilter.toLowerCase()
        );
        if (!hasSize) return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = p.name.toLowerCase().includes(query);
        const matchesSku = p.sku.toLowerCase().includes(query);
        const matchesCategory = p.category.toLowerCase().includes(query);
        if (!matchesName && !matchesSku && !matchesCategory) return false;
      }
      return true;
    });
  }, [products, statusFilter, categoryFilter, stockFilter, sizeFilter, searchQuery]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, categoryFilter, stockFilter, sizeFilter, searchQuery, pageSize]);

  // Toggle stock status
  const toggleStock = (id: string) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const next = !p.stock;
          toast.success(`"${p.name}" marked as ${next ? "In Stock" : "Out of Stock"}`);
          return { ...p, stock: next };
        }
        return p;
      })
    );
  };

  // Toggle select row
  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Toggle select all on current page
  const allCurrentPageSelected =
    paginatedProducts.length > 0 &&
    paginatedProducts.every((p) => selectedIds.includes(p.id));

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      const pageIds = paginatedProducts.map((p) => p.id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    } else {
      const pageIdSet = new Set(paginatedProducts.map((p) => p.id));
      setSelectedIds((prev) => prev.filter((id) => !pageIdSet.has(id)));
    }
  };

  // Export to CSV
  const handleExport = () => {
    const headers = ["Product", "Category", "Stock", "SKU", "Price", "Qty", "Status"];
    const rows = filteredProducts.map((p) => [
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.category}"`,
      p.stock ? "In Stock" : "Out of Stock",
      p.sku,
      p.price,
      p.qty,
      p.status,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `products_export_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${filteredProducts.length} products to CSV`);
  };

  // Reset filters
  const resetFilters = () => {
    setStatusFilter("all");
    setCategoryFilter("all");
    setStockFilter("all");
    setSizeFilter("all");
    setSearchQuery("");
  };

  const hasActiveFilters =
    statusFilter !== "all" ||
    categoryFilter !== "all" ||
    stockFilter !== "all" ||
    sizeFilter !== "all" ||
    searchQuery !== "";

  // Delete product action
  const handleDeleteProduct = (p: CommerceoProductItem) => {
    if (p.rawProduct) {
      setDeleteProduct(p.rawProduct);
      setOpenDeleteModal(true);
    } else {
      setProducts((prev) => prev.filter((item) => item.id !== p.id));
      toast.success(`"${p.name}" removed from view`);
    }
  };

  return (
    <div className="flex flex-1 flex-col space-y-6">
      {/* 2. Main Card with Filters, Toolbar, Table & Pagination */}
      <div className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#141414] shadow-xs overflow-hidden">
        {/* Filter Section */}
        <div className="p-6 border-b border-gray-200/70 dark:border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Filter</h2>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-8 text-xs text-muted-foreground hover:text-foreground"
              >
                Clear all filters
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Status (All) */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-10 bg-white dark:bg-[#181818] border-gray-200 dark:border-white/10 rounded-xl text-xs sm:text-sm">
                <SelectValue placeholder="Status (All)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Status (All)</SelectItem>
                <SelectItem value="publish">Publish</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            {/* Category (All) */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-10 bg-white dark:bg-[#181818] border-gray-200 dark:border-white/10 rounded-xl text-xs sm:text-sm">
                <SelectValue placeholder="Category (All)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Category (All)</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat.toLowerCase()}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Stock (All) */}
            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="h-10 bg-white dark:bg-[#181818] border-gray-200 dark:border-white/10 rounded-xl text-xs sm:text-sm">
                <SelectValue placeholder="Stock (All)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Stock (All)</SelectItem>
                <SelectItem value="in_stock">In Stock</SelectItem>
                <SelectItem value="out_of_stock">Out of Stock</SelectItem>
              </SelectContent>
            </Select>

            {/* Variant Size (All) */}
            <Select value={sizeFilter} onValueChange={setSizeFilter}>
              <SelectTrigger className="h-10 bg-white dark:bg-[#181818] border-gray-200 dark:border-white/10 rounded-xl text-xs sm:text-sm">
                <SelectValue placeholder="Variant Size (All)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Variant Size (All)</SelectItem>
                {availableVariantSizes.map((sz) => (
                  <SelectItem key={sz} value={sz.toLowerCase()}>
                    {sz.startsWith("Size ") || sz.toLowerCase().includes("free") || sz.toLowerCase().includes("custom")
                      ? sz
                      : `Size ${sz}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-gray-200/70 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02]">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 bg-white dark:bg-[#181818] border-gray-200 dark:border-white/10 rounded-xl text-sm shadow-2xs"
            />
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            {/* Page Size */}
            <Select
              value={pageSize.toString()}
              onValueChange={(v) => {
                setPageSize(Number(v));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-10 w-20 bg-white dark:bg-[#181818] border-gray-200 dark:border-white/10 rounded-xl text-xs font-medium">
                <SelectValue placeholder={pageSize.toString()} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>

            {/* Export Button matching reference: "↑ Export" */}
            <Button
              variant="outline"
              onClick={handleExport}
              className="h-10 gap-1.5 px-4 rounded-xl border-gray-200 dark:border-white/10 bg-white dark:bg-[#181818] text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 font-medium text-xs shadow-2xs"
            >
              <ArrowUp className="size-4" />
              Export
            </Button>

            {/* Add Product Button */}
            <Link href="/products/add-product">
              <Button className="h-10 gap-1.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-xs transition-colors">
                <Plus className="size-4" />
                Add Product
              </Button>
            </Link>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-200/80 dark:border-white/10 bg-gray-50/40 dark:bg-white/[0.01]">
                <th className="py-4 pl-6 pr-3 w-12">
                  <div className="flex items-center">
                    <Checkbox
                      checked={allCurrentPageSelected}
                      onCheckedChange={(val) => toggleSelectAll(Boolean(val))}
                    />
                  </div>
                </th>
                <th className="py-4 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider min-w-[280px]">
                  Product
                </th>
                <th className="py-4 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider min-w-[130px]">
                  Category
                </th>
                <th className="py-4 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider min-w-[90px]">
                  Stock
                </th>
                <th className="py-4 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider min-w-[100px]">
                  SKU
                </th>
                <th className="py-4 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider min-w-[100px]">
                  Price
                </th>
                <th className="py-4 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider min-w-[80px]">
                  Qty
                </th>
                <th className="py-4 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider min-w-[120px]">
                  Status
                </th>
                <th className="py-4 pl-3 pr-6 text-xs font-medium text-muted-foreground uppercase tracking-wider min-w-[80px] text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200/70 dark:divide-white/5">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`skel-${i}`} className="animate-pulse">
                    <td className="py-4 pl-6 pr-3"><div className="size-4 bg-gray-200 dark:bg-white/10 rounded" /></td>
                    <td className="py-4 px-3"><div className="h-10 w-48 bg-gray-200 dark:bg-white/10 rounded-lg" /></td>
                    <td className="py-4 px-3"><div className="h-4 w-20 bg-gray-200 dark:bg-white/10 rounded" /></td>
                    <td className="py-4 px-3"><div className="h-4 w-14 bg-gray-200 dark:bg-white/10 rounded" /></td>
                    <td className="py-4 px-3"><div className="h-4 w-16 bg-gray-200 dark:bg-white/10 rounded" /></td>
                    <td className="py-4 px-3"><div className="h-4 w-16 bg-gray-200 dark:bg-white/10 rounded" /></td>
                    <td className="py-4 px-3"><div className="h-4 w-12 bg-gray-200 dark:bg-white/10 rounded" /></td>
                    <td className="py-4 px-3"><div className="h-6 w-16 bg-gray-200 dark:bg-white/10 rounded-full" /></td>
                    <td className="py-4 pl-3 pr-6 text-right"><div className="h-8 w-8 ml-auto bg-gray-200 dark:bg-white/10 rounded" /></td>
                  </tr>
                ))
              ) : paginatedProducts.length > 0 ? (
                paginatedProducts.map((item) => {
                  const isSelected = selectedIds.includes(item.id);

                  return (
                    <tr
                      key={item.id}
                      className={cn(
                        "transition-colors hover:bg-gray-50/70 dark:hover:bg-white/[0.02]",
                        isSelected && "bg-indigo-50/40 dark:bg-indigo-950/20"
                      )}
                    >
                      {/* Checkbox */}
                      <td className="py-4 pl-6 pr-3 align-middle">
                        <div className="flex items-center">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSelectRow(item.id)}
                          />
                        </div>
                      </td>

                      {/* Product (Thumbnail + Name + Subtitle) */}
                      <td className="py-4 px-3 align-middle">
                        <div className="flex items-center gap-3.5">
                          {/* Square Thumbnail matching reference image */}
                          <div className="size-11 rounded-xl bg-[#f5f1eb] dark:bg-[#201e1b] border border-[#e8e2d9] dark:border-white/5 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="size-9 object-contain"
                              />
                            ) : (
                              <ProductIcon type={item.iconType} name={item.name} />
                            )}
                          </div>

                          <div className="flex flex-col min-w-0 max-w-xs">
                            <span
                              onClick={() => {
                                if (item.rawProduct) {
                                  router.push(`/products/${item.rawProduct.id}`);
                                }
                              }}
                              className="font-semibold text-gray-900 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate cursor-pointer"
                            >
                              {item.name}
                            </span>
                            <span className="text-xs text-muted-foreground line-clamp-1 truncate mt-0.5">
                              {item.description}
                            </span>
                            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300">
                                {item.variantCount} variant{item.variantCount === 1 ? "" : "s"}
                              </span>
                              {item.availableSizes && item.availableSizes.length > 0 && (
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] text-muted-foreground">Sizes:</span>
                                  {item.availableSizes.slice(0, 4).map((s) => (
                                    <button
                                      key={s}
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSizeFilter(s.toLowerCase());
                                        toast.info(`Filtered products by ${s.startsWith("Size ") ? s : `Size ${s}`}`);
                                      }}
                                      title={`Filter catalog by ${s}`}
                                      className="px-1.5 py-0.2 rounded bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-mono text-[10px] border border-indigo-100 dark:border-indigo-900/40 cursor-pointer transition-colors"
                                    >
                                      {s}
                                    </button>
                                  ))}
                                  {item.availableSizes.length > 4 && (
                                    <span className="text-[10px] text-muted-foreground">
                                      +{item.availableSizes.length - 4}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-4 px-3 align-middle">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                          {item.category}
                        </span>
                      </td>

                      {/* Stock Switch Toggle */}
                      <td className="py-4 px-3 align-middle">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={item.stock}
                          onClick={() => toggleStock(item.id)}
                          className={cn(
                            "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none shadow-2xs",
                            item.stock
                              ? "bg-sky-600 dark:bg-sky-500"
                              : "bg-stone-200 dark:bg-stone-700"
                          )}
                        >
                          <span
                            className={cn(
                              "pointer-events-none inline-block h-4 w-4 transform rounded-full shadow-xs ring-0 transition duration-200 ease-in-out",
                              item.stock
                                ? "translate-x-4 bg-white"
                                : "translate-x-0 bg-stone-800 dark:bg-stone-200"
                            )}
                          />
                        </button>
                      </td>

                      {/* SKU */}
                      <td className="py-4 px-3 align-middle">
                        <span className="text-sm font-mono text-gray-500 dark:text-gray-400">
                          {item.sku}
                        </span>
                      </td>

                      {/* Price (strictly derived from variants) */}
                      <td className="py-4 px-3 align-middle">
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {item.priceDisplay}
                        </span>
                      </td>

                      {/* Stock Summary */}
                      <td className="py-4 px-3 align-middle">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {item.qty} units
                          </span>
                          <span
                            className={cn(
                              "text-[10px] font-medium",
                              item.stock
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-red-500"
                            )}
                          >
                            {item.stock ? "In stock" : "Out of stock"}
                          </span>
                        </div>
                      </td>

                      {/* Status pill badges matching reference colors */}
                      <td className="py-4 px-3 align-middle">
                        {item.status === "Publish" && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400 border border-sky-200/60 dark:border-sky-800/40">
                            Publish
                          </span>
                        )}
                        {item.status === "Scheduled" && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40">
                            Scheduled
                          </span>
                        )}
                        {item.status === "Inactive" && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#f5f1eb] text-[#8c827a] dark:bg-[#25221e] dark:text-[#b0a79e] border border-[#e8e2d9] dark:border-white/5">
                            Inactive
                          </span>
                        )}
                      </td>

                      {/* Row Actions Menu */}
                      <td className="py-4 pl-3 pr-6 align-middle text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="size-8 p-0 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10"
                            >
                              <span className="sr-only">Open menu</span>
                              <MoreVertical className="size-4 text-gray-500" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-36 rounded-xl">
                            <DropdownMenuItem
                              onClick={() => {
                                if (item.rawProduct) {
                                  router.push(`/products/${item.rawProduct.id}`);
                                } else {
                                  toast.info(`Viewing details for ${item.name}`);
                                }
                              }}
                              className="gap-2 cursor-pointer"
                            >
                              <Eye className="size-4" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                if (item.rawProduct) {
                                  router.push(`/products/edit-product/${item.rawProduct.id}`);
                                } else {
                                  toast.info(`Edit mode for ${item.name}`);
                                }
                              }}
                              className="gap-2 cursor-pointer"
                            >
                              <Edit2 className="size-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteProduct(item)}
                              className="gap-2 text-rose-600 focus:text-rose-600 cursor-pointer"
                            >
                              <Trash2 className="size-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-muted-foreground">
                    <p className="text-base font-medium">No products found</p>
                    <p className="text-xs mt-1">Try adjusting your filters or search keywords.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 3. Pagination Footer matching CommerceO */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-gray-200/80 dark:border-white/10 bg-gray-50/30 dark:bg-white/[0.01]">
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Showing {filteredProducts.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{" "}
            {Math.min(currentPage * pageSize, filteredProducts.length)} of {filteredProducts.length}{" "}
            entries
          </p>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="h-8 px-2.5 rounded-lg border-gray-200 dark:border-white/10 text-xs font-medium"
            >
              <ChevronLeft className="size-3.5 mr-1" />
              Previous
            </Button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(page)}
                className={cn(
                  "h-8 w-8 p-0 rounded-lg text-xs font-medium",
                  currentPage === page
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                    : "border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5"
                )}
              >
                {page}
              </Button>
            ))}

            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="h-8 px-2.5 rounded-lg border-gray-200 dark:border-white/10 text-xs font-medium"
            >
              Next
              <ChevronRight className="size-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Dialog if backend product */}
      {deleteProduct && (
        <ProductDeleteDialog
          open={openDeleteModal}
          setOpen={setOpenDeleteModal}
          product={deleteProduct}
        />
      )}
    </div>
  );
}
