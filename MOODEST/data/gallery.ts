export interface GalleryItem {
  id: string;
  title: string;
  href: string;
  image: string;
  alt: string;
}

/**
 * Editorial Gallery Configuration
 * Manually update your gallery images, titles, and links here separately.
 * 
 * Image guidelines:
 * - Place your local image files in: public/abaya/gallery/ (e.g. /abaya/gallery/gallery-1.jpg)
 * - Or use an external image URL: https://res.cloudinary.com/... or https://...
 */
export const editorialGalleryItems: {
  leftTall: GalleryItem;
  rightTop: GalleryItem;
  rightBottom: GalleryItem;
  desktopRightTall: GalleryItem;
} = {
  // 1. Mobile Left Tall Card (Full height on both mobile and desktop)
  leftTall: {
    id: "gallery-1",
    title: "Syrian Edits",
    href: "/category/syrian-collection",
    image: "/abaya/hero/hero-6.jpg",
    alt: "Syrian Collection — Modest Silhouettes & Artisanal Handwork | Modest Studio"
  },

  // 2. Mobile Right Column — Top Card
  rightTop: {
    id: "gallery-2",
    title: "The Classics",
    href: "/category/the-classics",
    image: "/abaya/hero/hero-2.jpg",
    alt: "The Classics — Silk & Midnight Nida Classic Abayas | Modest Studio"
  },

  // 3. Mobile Right Column — Bottom Card
  rightBottom: {
    id: "gallery-3",
    title: "The Luxe Edit",
    href: "/category/the-luxe-edit",
    image: "/abaya/hero/hero-3.jpg",
    alt: "The Luxe Edit — Earth Tones & Silk Organza Edits | Modest Studio"
  },

  // 4. Desktop 3rd Column — Right Tall Card (Visible on md+ screens)
  desktopRightTall: {
    id: "gallery-4",
    title: "Occasion Wear",
    href: "/category/occasion-wear",
    image: "/abaya/hero/hero-4.jpg",
    alt: "Occasion Wear — Bespoke Celebratory Cuts & Opulent Drapes | Modest Studio"
  }
};

