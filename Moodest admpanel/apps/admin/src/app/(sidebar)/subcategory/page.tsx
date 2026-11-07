/**
 * Subcategory page.
 * 
 * The NestJS backend uses a single Category model with optional parentId
 * for hierarchical categories — there is no separate SubCategory table.
 * 
 * This page shows categories that have a parentId (i.e., subcategories)
 * and allows creating new ones using the existing SubcategoryDialogForm,
 * which we adapt to pass parentId when creating.
 */
import { SubcategoryDialogForm } from "@/components/subcategory/subcategory-dialog-form";
import SubcategoryTable from "@/components/subcategory/subcategory-table";
import { subcategoryColumns } from "@/components/subcategory/subcategory-columns";
import { serverFetch, type Category } from "@/lib/api";
import type { SubCategoryWithCategory } from "@/types/subcategory";

export const dynamic = "force-dynamic";

export default async function SubcategoriesPage() {
  let topLevelCategories: Category[] = [];
  let subcategoryItems: SubCategoryWithCategory[] = [];

  try {
    const all = await serverFetch<Category[]>("/categories");
    const categories = Array.isArray(all) ? all : [];

    topLevelCategories = categories.filter((c) => !c.parentId);

    // Map NestJS Category (with parentId) to the SubCategoryWithCategory shape
    // that the existing subcategory table component expects
    subcategoryItems = categories
      .filter((c) => c.parentId != null)
      .map((sub) => {
        const parent = categories.find((p) => p.id === sub.parentId);
        return {
          id: String(sub.id),
          name: sub.name,
          categoryId: String(sub.parentId),
          createdAt: new Date(),
          updatedAt: new Date(),
          category: parent
            ? {
                id: String(parent.id),
                name: parent.name,
                image: "",
                createdAt: new Date(),
                updatedAt: new Date(),
              }
            : {
                id: String(sub.parentId),
                name: "Unknown",
                image: "",
                createdAt: new Date(),
                updatedAt: new Date(),
              },
        } satisfies SubCategoryWithCategory;
      });
  } catch (error) {
    console.error("[SubcategoryPage] Failed to fetch categories:", error);
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="container flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Subcategories</h1>
              <p className="text-muted-foreground">
                Manage subcategories (categories with a parent)
              </p>
            </div>
            {/* Pass top-level categories so the form can pick a parent */}
            <SubcategoryDialogForm categories={topLevelCategories} />
          </div>

          <SubcategoryTable
            columns={subcategoryColumns}
            data={subcategoryItems}
          />
        </div>
      </div>
    </div>
  );
}
