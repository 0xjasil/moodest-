"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, cn } from "@/lib/utils";
import Image from "next/image";
import { ArrowDown, ArrowUp, ArrowUpDown, Edit3 } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { InventoryActionMenu } from "./inventory-action-menu";

export type InventoryVariantItem = {
  id: string; // variant id
  productId: string | number;
  productName: string;
  image?: string | null;
  sku: string;
  size: string;
  color: string;
  colorHex?: string | null;
  price: number;
  onHandQty: number;
  reservedQty: number | null; // null if backend doesn't supply reservations
  availableQty: number;
  isActive: boolean;
  isLowStock: boolean;
  categoryName?: string;
  brandName?: string;
};

// Keep backward compatibility export
export type ProductWithRelations = InventoryVariantItem;

export const createInventoryColumns = (
  onQuickEditStock?: (item: InventoryVariantItem) => void
): ColumnDef<InventoryVariantItem>[] => [
  {
    accessorKey: "image",
    header: "Product",
    cell: ({ row }) => {
      const item = row.original;
      return (
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
            {item.image ? (
              <Image
                src={item.image}
                alt={item.productName}
                width={40}
                height={40}
                className="size-10 object-cover"
              />
            ) : (
              <span className="text-[10px] text-muted-foreground">No img</span>
            )}
          </div>
          <div className="flex flex-col min-w-0 max-w-[200px]">
            <span className="font-semibold text-xs text-gray-900 dark:text-gray-100 truncate">
              {item.productName}
            </span>
            <span className="text-[11px] text-muted-foreground truncate">
              {item.categoryName || "Abaya"}
            </span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "sku",
    header: ({ column }) => {
      const sort = column.getIsSorted();
      return (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(sort === "asc")}
          className="h-8 px-2 text-xs font-semibold"
        >
          SKU
          {sort === "asc" ? (
            <ArrowUp className="size-3.5 ml-1" />
          ) : sort === "desc" ? (
            <ArrowDown className="size-3.5 ml-1" />
          ) : (
            <ArrowUpDown className="size-3.5 ml-1" />
          )}
        </Button>
      );
    },
    cell: ({ row }) => (
      <span className="font-mono text-xs font-semibold text-gray-800 dark:text-gray-200">
        {row.original.sku}
      </span>
    ),
  },
  {
    accessorKey: "size",
    header: "Size",
    cell: ({ row }) => (
      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-mono text-xs font-bold border border-indigo-100 dark:border-indigo-900/30">
        {row.original.size}
      </span>
    ),
  },
  {
    accessorKey: "color",
    header: "Color",
    cell: ({ row }) => {
      const color = row.original.color;
      const colorHex = row.original.colorHex;
      if (!color || color === "-" || color === "None") {
        return <span className="text-muted-foreground italic text-xs">-</span>;
      }
      return (
        <div className="flex items-center gap-1.5">
          {colorHex && (
            <span
              className="size-3 rounded-full border border-gray-300 shrink-0"
              style={{ backgroundColor: colorHex }}
            />
          )}
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {color}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "onHandQty",
    header: ({ column }) => {
      const sort = column.getIsSorted();
      return (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(sort === "asc")}
          className="h-8 px-2 text-xs font-semibold"
        >
          Stock Breakdown
          {sort === "asc" ? (
            <ArrowUp className="size-3.5 ml-1" />
          ) : sort === "desc" ? (
            <ArrowDown className="size-3.5 ml-1" />
          ) : (
            <ArrowUpDown className="size-3.5 ml-1" />
          )}
        </Button>
      );
    },
    cell: ({ row }) => {
      const item = row.original;
      // If reservations are supplied by backend, distinguish on-hand, reserved, and available
      if (item.reservedQty !== null) {
        return (
          <div className="flex flex-col text-xs space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-[10px]">On-hand:</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {item.onHandQty}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-amber-600 dark:text-amber-400 text-[10px]">Reserved:</span>
              <span className="font-semibold text-amber-600 dark:text-amber-400">
                {item.reservedQty}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-600 dark:text-emerald-400 text-[10px]">Available:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {item.availableQty}
              </span>
            </div>
          </div>
        );
      }

      // No reservations supplied
      return (
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "font-bold text-xs",
              item.onHandQty > 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-600 dark:text-red-400"
            )}
          >
            {item.onHandQty} in stock
          </span>
          {item.isLowStock && item.onHandQty > 0 && (
            <Badge variant="destructive" className="text-[9px] px-1 py-0">
              Low
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "price",
    header: "Price",
    cell: ({ row }) => (
      <span className="text-xs font-semibold text-gray-900 dark:text-white">
        {formatCurrency(row.original.price)}
      </span>
    ),
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => {
      const isActive = row.original.isActive;
      return (
        <Badge
          variant={isActive ? "default" : "outline"}
          className={cn(
            "text-[10px] px-2 py-0.5 rounded-full font-medium",
            isActive
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
              : "bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400"
          )}
        >
          {isActive ? "Active" : "Inactive"}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => {
      const item = row.original;
      return (
        <div className="flex items-center justify-end gap-1">
          {onQuickEditStock && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onQuickEditStock(item)}
              className="size-7 p-0 rounded-lg text-gray-600 hover:text-indigo-600 hover:bg-indigo-50"
              title="Quick Adjust Stock"
            >
              <Edit3 className="size-3.5" />
            </Button>
          )}
          <InventoryActionMenu
            product={{
              id: String(item.productId),
              name: item.productName,
            }}
          />
        </div>
      );
    },
  },
];

// Default export columns
export const inventoryColumns = createInventoryColumns();
