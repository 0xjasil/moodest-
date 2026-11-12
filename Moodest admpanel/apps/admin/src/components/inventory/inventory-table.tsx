"use client";

import { type Brand, type Category } from "@/lib/api";
import {
  ColumnDef,
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  RowSelectionState,
} from "@tanstack/react-table";
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  RefreshCw,
  Edit3,
} from "@/components/ui/icon";
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import Checkbox from "../ui/checkbox";
import { apiFetch } from "@/lib/apiFetch";
import { BatchUpdateDialog } from "./batch-update-dialog";
import {
  InventoryVariantItem,
  createInventoryColumns,
} from "./inventory-column";
import { toast } from "sonner";

export type ProductWithRelations = InventoryVariantItem;

interface SubCategory {
  id: string;
  name: string;
  categoryId: string;
}

interface InvenotryTableProps {
  columns?: ColumnDef<InventoryVariantItem>[];
  categories?: Category[];
  brands?: Brand[];
  onSelectionChange?: (selectedItems: InventoryVariantItem[]) => void;
}

const sortOptions = [
  { value: "sku_asc", label: "SKU A-Z", sortBy: "sku", sortOrder: "asc" },
  { value: "sku_desc", label: "SKU Z-A", sortBy: "sku", sortOrder: "desc" },
  { value: "name_asc", label: "Product Name A-Z", sortBy: "name", sortOrder: "asc" },
  { value: "name_desc", label: "Product Name Z-A", sortBy: "name", sortOrder: "desc" },
  { value: "stock_asc", label: "Stock Low to High", sortBy: "onHandQty", sortOrder: "asc" },
  { value: "stock_desc", label: "Stock High to Low", sortBy: "onHandQty", sortOrder: "desc" },
  { value: "price_asc", label: "Price Low to High", sortBy: "price", sortOrder: "asc" },
  { value: "price_desc", label: "Price High to Low", sortBy: "price", sortOrder: "desc" },
];

const DEFAULT_INVENTORY_VARIANTS: InventoryVariantItem[] = [
  {
    id: "var-101",
    productId: "demo-1",
    productName: "Noor Embroidered Abaya",
    image: "/images/products/1.webp",
    sku: "MDS-NOOR-BLK-52",
    size: "52",
    color: "Black",
    colorHex: "#000000",
    price: 4999,
    onHandQty: 15,
    reservedQty: null,
    availableQty: 15,
    isActive: true,
    isLowStock: false,
    categoryName: "Embroidered Abayas",
  },
  {
    id: "var-102",
    productId: "demo-1",
    productName: "Noor Embroidered Abaya",
    image: "/images/products/1.webp",
    sku: "MDS-NOOR-BLK-54",
    size: "54",
    color: "Black",
    colorHex: "#000000",
    price: 4999,
    onHandQty: 18,
    reservedQty: null,
    availableQty: 18,
    isActive: true,
    isLowStock: false,
    categoryName: "Embroidered Abayas",
  },
  {
    id: "var-103",
    productId: "demo-1",
    productName: "Noor Embroidered Abaya",
    image: "/images/products/1.webp",
    sku: "MDS-NOOR-BLK-56",
    size: "56",
    color: "Black",
    colorHex: "#000000",
    price: 4999,
    onHandQty: 12,
    reservedQty: null,
    availableQty: 12,
    isActive: true,
    isLowStock: false,
    categoryName: "Embroidered Abayas",
  },
  {
    id: "var-104",
    productId: "demo-2",
    productName: "Medina Classic Front-Open Abaya",
    image: "/images/products/2.webp",
    sku: "MDS-MED-NVY-54",
    size: "54",
    color: "Navy Blue",
    colorHex: "#0A192F",
    price: 3899,
    onHandQty: 14,
    reservedQty: null,
    availableQty: 14,
    isActive: true,
    isLowStock: false,
    categoryName: "Classic Abayas",
  },
  {
    id: "var-105",
    productId: "demo-2",
    productName: "Medina Classic Front-Open Abaya",
    image: "/images/products/2.webp",
    sku: "MDS-MED-NVY-56",
    size: "56",
    color: "Navy Blue",
    colorHex: "#0A192F",
    price: 3899,
    onHandQty: 18,
    reservedQty: null,
    availableQty: 18,
    isActive: true,
    isLowStock: false,
    categoryName: "Classic Abayas",
  },
  {
    id: "var-106",
    productId: "demo-3",
    productName: "Layla Luxury Georgette Kimono",
    image: "/images/products/3.webp",
    sku: "MDS-LAYLA-OLV-54",
    size: "54",
    color: "Olive Green",
    colorHex: "#4B5320",
    price: 5499,
    onHandQty: 4,
    reservedQty: null,
    availableQty: 4,
    isActive: true,
    isLowStock: true,
    categoryName: "Luxury Abayas",
  },
  {
    id: "var-107",
    productId: "demo-4",
    productName: "Zahra Everyday Linen Abaya",
    image: "/images/products/4.webp",
    sku: "MDS-ZAHRA-BGE-52",
    size: "52",
    color: "Beige",
    colorHex: "#E1C699",
    price: 2999,
    onHandQty: 0,
    reservedQty: null,
    availableQty: 0,
    isActive: false,
    isLowStock: true,
    categoryName: "Daily Wear",
  },
];

export default function InventoryTable({
  categories = [],
  brands = [],
  onSelectionChange,
}: InvenotryTableProps) {
  const [data, setData] = useState<InventoryVariantItem[]>(DEFAULT_INVENTORY_VARIANTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSubCategory, setSelectedSubCategory] = useState("all");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [sortBy, setSortBy] = useState("sku_asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showFilters, setShowFilters] = useState(false);

  // Quick Stock Adjustment Dialog State
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [adjustTargetItem, setAdjustTargetItem] = useState<InventoryVariantItem | null>(null);
  const [adjustQtyInput, setAdjustQtyInput] = useState<string>("");
  const [isUpdatingStock, setIsUpdatingStock] = useState(false);

  // Open Quick Stock Adjust Dialog
  const handleOpenStockAdjust = (item: InventoryVariantItem) => {
    setAdjustTargetItem(item);
    setAdjustQtyInput(String(item.onHandQty));
    setAdjustDialogOpen(true);
  };

  // Perform Authorized Backend Stock Edit
  const handleSaveStockAdjust = async () => {
    if (!adjustTargetItem) return;
    const newQty = parseInt(adjustQtyInput, 10);
    if (isNaN(newQty) || newQty < 0) {
      toast.error("Stock quantity must be a non-negative whole integer.");
      return;
    }

    setIsUpdatingStock(true);
    try {
      // Stock edits must use the actual authorized backend endpoint
      const response = await apiFetch(
        `/products/${adjustTargetItem.productId}/variants/${adjustTargetItem.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            stock: newQty,
            qty: newQty,
          }),
        }
      );

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.message || errJson.error || `HTTP ${response.status} failed to update stock`);
      }

      // Update state once confirmed by backend
      setData((prev) =>
        prev.map((item) =>
          item.id === adjustTargetItem.id
            ? {
                ...item,
                onHandQty: newQty,
                availableQty:
                  item.reservedQty !== null
                    ? Math.max(0, newQty - item.reservedQty)
                    : newQty,
                isLowStock: newQty <= 5,
              }
            : item
        )
      );

      toast.success(`Updated stock for ${adjustTargetItem.sku} to ${newQty}`);
      setAdjustDialogOpen(false);
    } catch (err) {
      console.error("Stock adjustment error:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to update stock on backend"
      );
    } finally {
      setIsUpdatingStock(false);
    }
  };

  // Columns definition with quick edit stock button
  const columns = useMemo(
    () => createInventoryColumns(handleOpenStockAdjust),
    []
  );

  const columnsWithSelection = useMemo<ColumnDef<InventoryVariantItem>[]>(() => [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          indeterminate={table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    ...columns,
  ], [columns]);

  // Fetch subcategories
  const fetchSubCategories = useCallback(async () => {
    try {
      const res = await apiFetch(`/categories`, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        const list = Array.isArray(json)
          ? json
          : ((json as { data?: SubCategory[] }).data || []);
        const subList = list.filter((c: SubCategory & { parentId?: number | null }) => c.parentId != null);
        setSubCategories(subList);
      }
    } catch {
      // silently ignore
    }
  }, []);

  useEffect(() => {
    fetchSubCategories();
  }, [fetchSubCategories]);

  // Fetch variant inventory from API
  const fetchInventory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch(`/products?limit=100`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      const rawProducts = Array.isArray(result) ? result : (result.data || []);

      if (rawProducts.length > 0) {
        const variantItems: InventoryVariantItem[] = [];

        rawProducts.forEach((p: {
          id: string | number;
          name: string;
          image?: string;
          images?: string[];
          basePrice?: number;
          qty?: number;
          isActive?: boolean;
          category?: { id: string | number; name: string };
          brand?: { id: string | number; name: string };
          variants?: Array<{
            id: string | number;
            sku: string;
            size?: string;
            color?: string;
            colorHex?: string | null;
            price?: number;
            qty?: number;
            stock?: number;
            isActive?: boolean;
            reservations?: Array<{
              id: string;
              quantity: number;
              status: string;
            }>;
            options?: Array<{
              attribute?: { name: string };
              attributeValue?: { value: string };
            }>;
          }>;
        }) => {
          const pVariants = p.variants || [];

          if (pVariants.length === 0) {
            // Product with single simple representation
            variantItems.push({
              id: `prod-${p.id}`,
              productId: p.id,
              productName: p.name,
              image: (p.images && p.images[0]) || p.image || null,
              sku: `MDS-${p.id}`,
              size: "Standard",
              color: "-",
              colorHex: null,
              price: p.basePrice || 0,
              onHandQty: p.qty || 0,
              reservedQty: null,
              availableQty: p.qty || 0,
              isActive: p.isActive !== false,
              isLowStock: (p.qty || 0) <= 5,
              categoryName: p.category?.name,
              brandName: p.brand?.name,
            });
          } else {
            pVariants.forEach((v) => {
              const onHand =
                typeof v.qty === "number"
                  ? v.qty
                  : typeof v.stock === "number"
                  ? v.stock
                  : 0;

              // If backend supplies reservations, calculate reserved quantity
              let reservedQty: number | null = null;
              if (Array.isArray(v.reservations)) {
                reservedQty = v.reservations.reduce((acc, r) => {
                  if (r.status === "RESERVED") return acc + (r.quantity || 0);
                  return acc;
                }, 0);
              }

              const availableQty =
                reservedQty !== null
                  ? Math.max(0, onHand - reservedQty)
                  : onHand;

              const sizeVal =
                v.size ||
                v.options?.find(
                  (o) => o.attribute?.name?.toLowerCase() === "size"
                )?.attributeValue?.value ||
                "54";

              const colorVal =
                v.color ||
                v.options?.find(
                  (o) => o.attribute?.name?.toLowerCase() === "color"
                )?.attributeValue?.value ||
                "-";

              variantItems.push({
                id: String(v.id),
                productId: p.id,
                productName: p.name,
                image: (p.images && p.images[0]) || p.image || null,
                sku: v.sku || `MDS-${p.id}-${v.id}`,
                size: sizeVal,
                color: colorVal,
                colorHex: v.colorHex || null,
                price: Number(v.price) || p.basePrice || 0,
                onHandQty: onHand,
                reservedQty,
                availableQty,
                isActive: v.isActive !== false,
                isLowStock: onHand <= 5,
                categoryName: p.category?.name,
                brandName: p.brand?.name,
              });
            });
          }
        });

        setData(variantItems);
      }
    } catch (err) {
      console.warn("Failed to fetch inventory from API, using catalog variants:", err);
      // Keep initial variants
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // Client-side filtering & sorting
  const filteredData = useMemo(() => {
    let result = [...data];

    // Search filter
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (item) =>
          item.productName.toLowerCase().includes(q) ||
          item.sku.toLowerCase().includes(q) ||
          item.size.toLowerCase().includes(q) ||
          item.color.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (selectedCategory !== "all") {
      result = result.filter(
        (item) => item.categoryName?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Sort
    const [field, dir] = sortBy.split("_");
    result.sort((a, b) => {
      let aVal: string | number = "";
      let bVal: string | number = "";
      if (field === "sku") {
        aVal = a.sku;
        bVal = b.sku;
      } else if (field === "name") {
        aVal = a.productName;
        bVal = b.productName;
      } else if (field === "stock") {
        aVal = a.onHandQty;
        bVal = b.onHandQty;
      } else if (field === "price") {
        aVal = a.price;
        bVal = b.price;
      }
      if (dir === "asc") return aVal > bVal ? 1 : -1;
      return aVal < bVal ? 1 : -1;
    });

    return result;
  }, [data, search, selectedCategory, sortBy]);

  // Paginated data
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));

  const table = useReactTable({
    data: paginatedData,
    columns: columnsWithSelection,
    state: { rowSelection },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedItems = selectedRows.map((r) => r.original);

  useEffect(() => {
    onSelectionChange?.(selectedItems);
  }, [rowSelection, onSelectionChange, selectedItems]);

  return (
    <Card className="w-full border-gray-200 dark:border-white/10 shadow-xs">
      <CardHeader className="p-4 sm:p-5 border-b border-gray-100 dark:border-white/5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-bold">Variant Inventory</CardTitle>
              <span className="text-xs text-muted-foreground">
                ({filteredData.length} variant{filteredData.length === 1 ? "" : "s"})
              </span>
            </div>
            <CardDescription className="text-xs mt-0.5">
              Live stock levels per abaya size length and colorway.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            {selectedItems.length > 0 && (
              <BatchUpdateDialog
                selectedProducts={selectedItems}
                onSuccess={() => fetchInventory()}
              />
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchInventory()}
              disabled={loading}
              className="h-9 gap-1.5 rounded-lg border-gray-200 text-xs font-medium"
            >
              <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by SKU, product name, size, or color..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 h-9 text-xs rounded-xl"
            />
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={sortBy}
              onValueChange={(val) => setSortBy(val)}
            >
              <SelectTrigger className="h-9 w-40 text-xs rounded-xl">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="h-9 gap-1.5 rounded-xl border-gray-200 text-xs"
            >
              <Filter className="size-3.5" />
              Filters
            </Button>
          </div>
        </div>

        {/* Collapsible Filter Panel */}
        {showFilters && (
          <div className="pt-3 pb-1 border-t mt-3 flex items-center gap-3 flex-wrap">
            <div className="w-48">
              <Label className="text-[11px] text-muted-foreground">Category</Label>
              <Select
                value={selectedCategory}
                onValueChange={(val) => {
                  setSelectedCategory(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-8 text-xs mt-1">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">
                    All Categories
                  </SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.name} className="text-xs">
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(selectedCategory !== "all" || search) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedCategory("all");
                  setSearch("");
                  setCurrentPage(1);
                }}
                className="h-8 text-xs mt-4 gap-1 text-muted-foreground"
              >
                <X className="size-3" />
                Clear Filters
              </Button>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="py-3 px-3 text-xs">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="hover:bg-gray-50/50 dark:hover:bg-white/[0.01]"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-3 px-3">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columnsWithSelection.length}
                    className="h-24 text-center text-xs text-muted-foreground"
                  >
                    No variant inventory found matching criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Toolbar */}
        <div className="p-4 flex items-center justify-between border-t border-gray-100 dark:border-white/5 text-xs text-muted-foreground">
          <div>
            Showing {(currentPage - 1) * pageSize + 1} to{" "}
            {Math.min(currentPage * pageSize, filteredData.length)} of{" "}
            {filteredData.length} variants
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="size-8 p-0"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="font-medium text-gray-800 dark:text-gray-200">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="size-8 p-0"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </CardContent>

      {/* Quick Stock Adjustment Dialog */}
      <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Edit3 className="size-4 text-indigo-600" />
              Adjust Stock Quantity
            </DialogTitle>
            <DialogDescription className="text-xs">
              Update on-hand stock for variant{" "}
              <strong>{adjustTargetItem?.sku}</strong> (Size {adjustTargetItem?.size},{" "}
              {adjustTargetItem?.color || "Standard"}).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-3">
            <div className="space-y-1.5">
              <Label htmlFor="quick-stock-qty" className="text-xs font-semibold">
                On-Hand Stock Quantity
              </Label>
              <Input
                id="quick-stock-qty"
                type="number"
                step="1"
                min="0"
                value={adjustQtyInput}
                onChange={(e) => setAdjustQtyInput(e.target.value)}
                placeholder="Enter stock quantity"
                className="h-9 text-xs"
              />
            </div>
            {adjustTargetItem?.reservedQty !== null && (
              <p className="text-[11px] text-muted-foreground">
                Currently reserved by pending orders:{" "}
                <span className="font-semibold text-amber-600">
                  {adjustTargetItem?.reservedQty} units
                </span>
                . Available quantity will be updated automatically.
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAdjustDialogOpen(false)}
              className="text-xs h-9"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isUpdatingStock}
              onClick={handleSaveStockAdjust}
              className="text-xs h-9 bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isUpdatingStock ? "Updating..." : "Save Stock Level"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
