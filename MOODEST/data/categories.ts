export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  featured?: boolean;
  itemCount?: number;
}

export const CATEGORIES: CategoryItem[] = [
  {
    id: "cat-1",
    name: "Front Open",
    slug: "front-open",
    description: "Flowing silhouettes with buttoned and clasp closures in premium Nida and Crepe.",
    image: "/abaya/categories/front-open.jpg",
    featured: true,
    itemCount: 28,
  },
  {
    id: "cat-2",
    name: "Double Shrug",
    slug: "double-shrug",
    description: "Layered elegance with coordinating inner slips and textured outer coats.",
    image: "/abaya/categories/double-shrug.jpg",
    featured: true,
    itemCount: 22,
  },
  {
    id: "cat-3",
    name: "Basic Kaftans",
    slug: "basic-kaftan",
    description: "Relaxed everyday butterfly cuts in breathable matte Nida for effortless comfort.",
    image: "/abaya/categories/basic-kaftan.jpg",
    featured: true,
    itemCount: 19,
  },
  {
    id: "cat-4",
    name: "Daily Wear",
    slug: "daily-wear",
    description: "Lightweight, wrinkle-resistant modest cuts tailored for your day-to-day routine.",
    image: "/abaya/categories/daily-wear.jpg",
    featured: true,
    itemCount: 34,
  },
  {
    id: "cat-5",
    name: "Kimono Abayas",
    slug: "kimono-abaya",
    description: "Japanese-crepe and Korean-silk inspired wide-sleeve silhouettes with satin trims.",
    image: "/abaya/categories/kimono-abaya.jpg",
    featured: true,
    itemCount: 16,
  },
  {
    id: "cat-6",
    name: "Embroidery",
    slug: "embroidery-abaya",
    description: "Intricate tonal threadwork along cuffs, hemlines, and lapels for refined sophistication.",
    image: "/abaya/categories/embroidery-abaya.jpg",
    featured: true,
    itemCount: 25,
  },
  {
    id: "cat-7",
    name: "Handwork",
    slug: "handwork-abaya",
    description: "Artisan-crafted Swarovski crystals, cutdana, and glass-bead embellishments.",
    image: "/abaya/categories/handwork-abaya.jpg",
    featured: true,
    itemCount: 14,
  },
  {
    id: "cat-8",
    name: "Bridal Wear",
    slug: "bridal-wear",
    description: "Opulent wedding and celebration edits with trailing hems and organza accents.",
    image: "/abaya/categories/bridal-wear.jpg",
    featured: true,
    itemCount: 12,
  },
  {
    id: "cat-9",
    name: "Jilbabs",
    slug: "jilbabs",
    description: "Full-coverage two-piece jilbab sets crafted with soft stretch headband ties.",
    image: "/abaya/categories/jilbabs.jpg",
    featured: true,
    itemCount: 15,
  },
  {
    id: "cat-10",
    name: "Chiffon Stoles",
    slug: "hijabs-stoles",
    description: "Ultra-soft Malaysian chiffon, modal cotton, and silk scarves in timeless neutrals.",
    image: "/abaya/categories/hijabs-stoles.jpg",
    featured: false,
    itemCount: 40,
  },
  {
    id: "cat-11",
    name: "Accessories",
    slug: "caps-accessories",
    description: "Ninja underscarves, magnetic hijab pins, satin scrunchies, and sleeve cuffs.",
    image: "/abaya/categories/caps-accessories.jpg",
    featured: false,
    itemCount: 18,
  },
  {
    id: "cat-12",
    name: "Special Offers",
    slug: "all",
    description: "Curated seasonal edits and promotional offers on premium abayas.",
    image: "/abaya/categories/classic-black.jpg",
    featured: false,
    itemCount: 30,
  },
];

export default CATEGORIES;

