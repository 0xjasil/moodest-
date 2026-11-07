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
      { id: 1, name: "Everyday Abayas", slug: "everyday-abayas", description: "Effortless, breathable everyday modest wear crafted from premium Cey crepe and soft Nida fabrics.", image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80" },
      { id: 2, name: "Occasion & Luxury Abayas", slug: "occasion-luxury-abayas", description: "Opulent embroidery, hand-beaded lace, and flowing silk georgette designed for weddings and special moments.", image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80" },
      { id: 3, name: "Jilbabs & Khimars", slug: "jilbabs-khimars", description: "Full-coverage French jilbabs, overhead robes, and instant tie-back khimars.", image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80" },
      { id: 4, name: "Hijabs & Stoles", slug: "hijabs-stoles", description: "Malaysian chiffon, modal cotton, and silk modal stoles in soothing neutral palettes.", image: "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&w=800&q=80" },
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
