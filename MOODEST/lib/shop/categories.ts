import { CATEGORIES, type CategoryItem } from "@/data/categories";

export async function getCategories(): Promise<CategoryItem[]> {
  return CATEGORIES;
}

export async function getCategoryBySlug(slug: string): Promise<CategoryItem | null> {
  const normalized = (slug || "").toLowerCase().trim();
  const found = CATEGORIES.find(
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
      itemCount: 80,
    };
  }

  // Fallback category representation
  const readableName = normalized
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return {
    id: `cat-${normalized}`,
    name: readableName,
    slug: normalized,
    description: `Curated ${readableName} designs crafted in pure Nida, Silk, and Chiffon fabrics.`,
    image: "/abaya/categories/front-open.jpg",
    featured: false,
    itemCount: 20,
  };
}

