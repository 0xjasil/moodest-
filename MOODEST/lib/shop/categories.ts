import { categoryAPI } from "@/lib/api";
import type { CategoryItem } from "@/data/categories";

export async function getCategories(): Promise<CategoryItem[]> {
  try {
    const list = await categoryAPI.getAll();
    const items = Array.isArray(list) ? list : Array.isArray((list as any)?.data) ? (list as any).data : [];
    return items.map((c: any) => ({
      id: String(c.id),
      name: c.name,
      slug: c.slug || c.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      description: c.description || "",
      image: c.image || "/abaya/categories/front-open.jpg",
      featured: Boolean(c.isFeatured),
      itemCount: c.productCount || c.productsCount || 0,
    }));
  } catch (error) {
    console.error("[getCategories] Failed to fetch categories from API:", error);
    return [];
  }
}

export async function getCategoryBySlug(slug: string): Promise<CategoryItem | null> {
  const normalized = (slug || "").toLowerCase().trim();
  const all = await getCategories();
  const found = all.find(
    (c) => c.slug.toLowerCase() === normalized || c.name.toLowerCase().replace(/\s+/g, "-") === normalized
  );
  if (found) return found;

  if (normalized === "all") {
    return {
      id: "cat-all",
      name: "All Collections",
      slug: "all",
      description: "Explore all handcrafted abayas, luxury kimonos, stoles, and modest sets.",
      image: "/abaya/categories/front-open.jpg",
      featured: true,
      itemCount: all.reduce((sum, c) => sum + (c.itemCount || 0), 0),
    };
  }

  return null;
}
