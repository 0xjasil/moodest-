import { BrandDialogForm } from "@/components/brand/brand-dialog-from";
import BrandTable from "@/components/brand/brand-table";
import { brandColumns } from "@/components/brand/brand-columns";
import { serverFetch, type Brand } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function BrandPage() {
  let brands: Brand[] = [];

  try {
    const result = await serverFetch<Brand[]>("/brands");
    brands = Array.isArray(result) ? result : [];
  } catch (error) {
    console.error("[BrandPage] Failed to fetch brands:", error);
    // brands stays empty — table shows empty state
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Brands</h1>
              <p className="text-muted-foreground">Manage Brands</p>
            </div>
            <BrandDialogForm />
          </div>

          <BrandTable data={brands} columns={brandColumns} />
        </div>
      </div>
    </div>
  );
}
