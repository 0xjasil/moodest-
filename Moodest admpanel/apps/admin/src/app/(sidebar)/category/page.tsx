import { CategoryDialogForm } from "@/components/category/category-dialog-form";
import CategoryTable from "@/components/category/category-table";
import { categoryColumns } from "@/components/category/category-columns";
import { serverFetch, type Category } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  let categories: Category[] = [];

  try {
    const result = await serverFetch<Category[]>("/categories");
    categories = Array.isArray(result) ? result : [];
  } catch (error) {
    console.error("[CategoriesPage] Failed to fetch categories:", error);
  }

  // Top-level categories only (no parentId) for the main categories table.
  // Subcategories (parentId != null) are managed on the /subcategory page.
  const topLevel = categories.filter((c) => !c.parentId);

  return (
    <div className="flex flex-1 flex-col">
      <div className="container flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
              <p className="text-muted-foreground">
                Manage top-level categories. Subcategories use parent categories.
              </p>
            </div>
            <CategoryDialogForm />
          </div>

          <CategoryTable
            data={topLevel as unknown as Parameters<typeof CategoryTable>[0]["data"]}
            columns={categoryColumns}
          />
        </div>
      </div>
    </div>
  );
}
