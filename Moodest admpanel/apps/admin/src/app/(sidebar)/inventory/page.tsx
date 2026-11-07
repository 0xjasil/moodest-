import { inventoryColumns } from "@/components/inventory/inventory-column";
import InventoryTable from "@/components/inventory/inventory-table";
import React from "react";
import { serverFetch, type Brand, type Category } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  let brands: Brand[] = [];
  let categories: Category[] = [];

  try {
    const [brandsRes, categoriesRes] = await Promise.all([
      serverFetch<Brand[]>("/brands").catch(() => []),
      serverFetch<Category[]>("/categories").catch(() => []),
    ]);

    brands = Array.isArray(brandsRes) ? brandsRes : [];
    categories = Array.isArray(categoriesRes) ? categoriesRes : [];
  } catch (error) {
    console.error("[InventoryPage] Failed to fetch filters:", error);
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
              <p className="text-muted-foreground">Manage Inventory</p>
            </div>
          </div>

          <InventoryTable brands={Array.isArray(brands) ? brands : []} categories={Array.isArray(categories) ? categories : []} columns={inventoryColumns} />
        </div>
      </div>
    </div>
  );
}
