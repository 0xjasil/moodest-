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
  let topLevel = categories.filter((c) => !c.parentId);

  if (topLevel.length === 0) {
    topLevel = [
      { id: 1, name: "Syrian Collection", slug: "syrian-collection", description: "Authentic Syrian artisanal embroidery and delicate handwoven details on breathable luxury fabrics.", image: "/abaya/categories/handwork-abaya.jpg" },
      { id: 2, name: "The Classics", slug: "the-classics", description: "Timeless black abayas crafted from premium midnight Nida with clean, versatile cuts.", image: "/abaya/categories/classic-black.jpg" },
      { id: 3, name: "The Luxe Edit", slug: "the-luxe-edit", description: "Opulent silk satin and textured organza edits tailored for unmatched elegance.", image: "/abaya/categories/silk-satin.jpg" },
      { id: 4, name: "Occasion Wear", slug: "occasion-wear", description: "Statement celebratory silhouettes with intricate crystal beading and graceful drapes.", image: "/abaya/categories/bridal-occasion.jpg" },
      { id: 5, name: "Kimono & Kaftan", slug: "kimono-kaftan", description: "Flowing bisht cuts and relaxed kaftans designed for effortless modest layering.", image: "/abaya/categories/kimono-abaya.jpg" },
      { id: 6, name: "Open Abaya Edit", slug: "open-abaya-edit", description: "Front-open silhouettes with tailored lapels and coordinating inner slip options.", image: "/abaya/categories/front-open.jpg" },
    ];
  }

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
