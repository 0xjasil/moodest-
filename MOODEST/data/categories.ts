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
    id: "cat-syrian",
    name: "Syrian Collection",
    slug: "syrian-collection",
    description: "Authentic Syrian artisanal embroidery and delicate handwoven details on breathable luxury fabrics.",
    image: "/abaya/categories/handwork-abaya.jpg",
    featured: true,
    itemCount: 18,
  },
  {
    id: "cat-classics",
    name: "The Classics",
    slug: "the-classics",
    description: "Timeless black abayas crafted from premium midnight Nida with clean, versatile cuts.",
    image: "/abaya/categories/classic-black.jpg",
    featured: true,
    itemCount: 24,
  },
  {
    id: "cat-luxe",
    name: "The Luxe Edit",
    slug: "the-luxe-edit",
    description: "Opulent silk satin and textured organza edits tailored for unmatched elegance.",
    image: "/abaya/categories/silk-satin.jpg",
    featured: true,
    itemCount: 16,
  },
  {
    id: "cat-occasion",
    name: "Occasion Wear",
    slug: "occasion-wear",
    description: "Statement celebratory silhouettes with intricate crystal beading and graceful drapes.",
    image: "/abaya/categories/bridal-occasion.jpg",
    featured: true,
    itemCount: 20,
  },
  {
    id: "cat-kimono",
    name: "Kimono & Kaftan",
    slug: "kimono-kaftan",
    description: "Flowing bisht cuts and relaxed kaftans designed for effortless modest layering.",
    image: "/abaya/categories/kimono-abaya.jpg",
    featured: true,
    itemCount: 19,
  },
  {
    id: "cat-open",
    name: "Open Abaya Edit",
    slug: "open-abaya-edit",
    description: "Front-open silhouettes with tailored lapels and coordinating inner slip options.",
    image: "/abaya/categories/front-open.jpg",
    featured: true,
    itemCount: 22,
  },
];

export default CATEGORIES;

