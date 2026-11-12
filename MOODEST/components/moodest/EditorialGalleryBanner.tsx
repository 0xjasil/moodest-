import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { bannerAPI, categoryAPI, productAPI, mapBackendProductToProduct } from "@/lib/api";
import { getDynamicCategoryImage, type CategoryItem } from "@/components/moodest/DiscoverCategories";
import type { Banner, Product } from "@/lib/types";

interface EditorialGalleryBannerProps {
  initialBanners?: Banner[];
  initialCategories?: CategoryItem[];
  initialProducts?: Product[];
}

interface GalleryCardItem {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  image: string;
  ariaLabel: string;
}

const DEFAULT_GALLERY_SLOTS = [
  {
    tag: "GALLERY_1",
    title: "Syrian Edits",
    subtitle: "Exclusive Edition",
    href: "/category/syrian-collection",
    image: "/abaya/hero/hero-6.jpg",
  },
  {
    tag: "GALLERY_2",
    title: "The Classics",
    subtitle: "Timeless Silhouettes",
    href: "/category/the-classics",
    image: "/abaya/hero/hero-2.jpg",
  },
  {
    tag: "GALLERY_3",
    title: "The Luxe Edit",
    subtitle: "Signature Atelier",
    href: "/category/the-luxe-edit",
    image: "/abaya/hero/hero-3.jpg",
  },
  {
    tag: "GALLERY_4",
    title: "Occasion Wear",
    subtitle: "Evening Collection",
    href: "/category/occasion-wear",
    image: "/abaya/hero/hero-4.jpg",
  },
];

export default function EditorialGalleryBanner({
  initialBanners,
  initialCategories,
  initialProducts,
}: EditorialGalleryBannerProps) {
  const [banners, setBanners] = useState<Banner[]>(initialBanners || []);
  const [categories, setCategories] = useState<CategoryItem[]>(initialCategories || []);
  const [products, setProducts] = useState<Product[]>(initialProducts || []);
  const [loading, setLoading] = useState(
    (!initialBanners || initialBanners.length === 0) &&
    (!initialCategories || initialCategories.length === 0) &&
    (!initialProducts || initialProducts.length === 0)
  );

  useEffect(() => {
    if (initialBanners && initialBanners.length > 0) {
      setBanners(initialBanners);
    }
    if (initialCategories && initialCategories.length > 0) {
      setCategories(initialCategories);
    }
    if (initialProducts && initialProducts.length > 0) {
      setProducts(initialProducts);
    }
  }, [initialBanners, initialCategories, initialProducts]);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        // Always refresh banners silently so admin updates show on client navigation too
        const [bannersRes, catsRes, prodsRes] = await Promise.all([
          bannerAPI.getAll().catch(() => null),
          categories.length === 0 ? categoryAPI.getAll().catch(() => []) : Promise.resolve(null),
          products.length === 0 ? productAPI.getAll({ limit: 12 }).catch(() => null) : Promise.resolve(null),
        ]);

        if (!isMounted) return;

        if (Array.isArray(bannersRes) && bannersRes.length > 0) {
          setBanners(bannersRes);
        }

        if (catsRes && Array.isArray(catsRes) && catsRes.length > 0) {
          setCategories(
            catsRes.map((cat: any) => ({
              id: String(cat.id),
              name: cat.name,
              slug: cat.slug || cat.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
              image: cat.image || cat.imageUrl || cat.img || cat.thumbnail || "",
              description: cat.description || "",
            }))
          );
        }

        if (prodsRes?.items && Array.isArray(prodsRes.items)) {
          setProducts(prodsRes.items.map(mapBackendProductToProduct));
        }
      } catch (err) {
        console.warn("[EditorialGalleryBanner] Error fetching gallery items:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [categories.length, products.length]);

  // Construct 4 gallery cards: prioritize CMS GALLERY_1..4 banners, then fallback to categories/products/defaults
  const cards: GalleryCardItem[] = React.useMemo(() => {
    return DEFAULT_GALLERY_SLOTS.map((slotDef, idx) => {
      const slotNum = idx + 1;
      const cmsMatch = banners.find((b) => {
        if (b.isActive === false) return false;
        const tag = (b.tag || "").toUpperCase();
        const alt = (b.alt || "").toUpperCase();
        return (
          tag === slotDef.tag ||
          alt === slotDef.tag ||
          (tag.startsWith("GALLERY_") && (b.order === slotNum || b.sortOrder === slotNum))
        );
      });

      if (cmsMatch && (cmsMatch.imageUrl || cmsMatch.image)) {
        const title = cmsMatch.title || slotDef.title;
        return {
          id: cmsMatch.id || slotDef.tag,
          title,
          subtitle: slotDef.subtitle,
          href: cmsMatch.buttonLink || cmsMatch.linkUrl || cmsMatch.link || slotDef.href,
          image: cmsMatch.imageUrl || cmsMatch.image || slotDef.image,
          ariaLabel: `Explore ${title} Collection`,
        };
      }

      const cat = categories[idx];
      if (cat) {
        const resolvedImg = getDynamicCategoryImage(cat, products) || slotDef.image;
        return {
          id: cat.id,
          title: cat.name,
          subtitle: cat.description ? cat.description.slice(0, 45) : slotDef.subtitle,
          href: `/category/${cat.slug}`,
          image: resolvedImg,
          ariaLabel: `Explore ${cat.name} Collection`,
        };
      }

      const prod = products[idx];
      if (prod) {
        return {
          id: String(prod.id),
          title: prod.name,
          subtitle: prod.brand || "Modest Studio",
          href: `/product/${prod.id}`,
          image: prod.image || slotDef.image,
          ariaLabel: `View ${prod.name}`,
        };
      }

      return {
        id: slotDef.tag,
        title: slotDef.title,
        subtitle: slotDef.subtitle,
        href: slotDef.href,
        image: slotDef.image,
        ariaLabel: `Explore ${slotDef.title} Collection`,
      };
    });
  }, [banners, categories, products]);

  // Loading skeleton state
  if (loading && cards.length === 0) {
    return (
      <section className="w-full px-3 sm:px-6 my-10 sm:my-20 relative block clear-both" aria-label="Loading Visual Gallery">
        <div className="w-full h-auto grid grid-cols-2 md:grid-cols-12 gap-2.5 sm:gap-4.5 animate-pulse">
          <div className="col-span-1 md:col-span-4 h-[340px] sm:h-[440px] md:h-[620px] lg:h-[680px] bg-gray-200 dark:bg-white/5 rounded-[2px]" />
          <div className="col-span-1 md:col-span-4 flex flex-col gap-2.5 sm:gap-4.5 h-[340px] sm:h-[440px] md:h-[620px] lg:h-[680px]">
            <div className="flex-1 bg-gray-200 dark:bg-white/5 rounded-[2px]" />
            <div className="flex-1 bg-gray-200 dark:bg-white/5 rounded-[2px]" />
          </div>
          <div className="hidden md:block md:col-span-4 h-[420px] sm:h-[480px] md:h-[620px] lg:h-[680px] bg-gray-200 dark:bg-white/5 rounded-[2px]" />
        </div>
      </section>
    );
  }

  const card1 = cards[0];
  const card2 = cards[1];
  const card3 = cards[2];
  const card4 = cards[3] || cards[0];

  return (
    <section className="w-full px-3 sm:px-6 my-10 sm:my-20 relative block clear-both" aria-label="Signature Visual Gallery">
      {/* Mobile-first Mosaic Gallery: 2-column asymmetrical on mobile (<md), 3-column on desktop (md+) */}
      <div className="w-full h-auto grid grid-cols-2 md:grid-cols-12 gap-2.5 sm:gap-4.5">
        
        {/* Column 1: Left Tall Vertical Card — Full height on mobile & desktop */}
        {card1 && (
          <div className="col-span-1 md:col-span-4 h-[340px] sm:h-[440px] md:h-[620px] lg:h-[680px]">
            <Link
              href={card1.href}
              className="group relative block w-full h-full overflow-hidden rounded-[2px] bg-mb-surface border border-mb-border shadow-card hover:shadow-dropdown transition-all duration-300"
              aria-label={card1.ariaLabel}
            >
              <img
                src={card1.image}
                alt={`${card1.title} | Modest Studio`}
                className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.src.includes("/banners/top-promo-banner.jpg")) {
                    target.src = "/banners/top-promo-banner.jpg";
                  }
                }}
              />
              {/* Subtle Gradient & Floating Circular Arrow Button */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent flex items-end justify-between p-3.5 sm:p-5">
                <span className="font-serif text-sm sm:text-base md:text-lg font-semibold text-white drop-shadow-md truncate pr-2">
                  {card1.title}
                </span>
                <div className="w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-mb-surface text-mb-primary border border-mb-border shadow-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-110 flex-shrink-0">
                  <Icon icon="lucide:chevron-right" className="w-4 h-4 sm:w-5 sm:h-5 text-mb-primary" />
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Column 2: 2 Stacked Cards — Top & Bottom on mobile & desktop */}
        <div className="col-span-1 md:col-span-4 flex flex-col gap-2.5 sm:gap-4.5 h-[340px] sm:h-[440px] md:h-[620px] lg:h-[680px]">
          {/* Top Card */}
          {card2 && (
            <Link
              href={card2.href}
              className="group flex-1 relative block w-full h-full overflow-hidden rounded-[2px] bg-mb-surface border border-mb-border shadow-card hover:shadow-dropdown transition-all duration-300"
              aria-label={card2.ariaLabel}
            >
              <img
                src={card2.image}
                alt={`${card2.title} | Modest Studio`}
                className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.src.includes("/banners/category-highlights-banner.jpg")) {
                    target.src = "/banners/category-highlights-banner.jpg";
                  }
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent flex items-end justify-between p-3 sm:p-4">
                <span className="font-serif text-xs sm:text-sm md:text-base font-semibold text-white drop-shadow-md truncate pr-2">
                  {card2.title}
                </span>
                <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-full bg-mb-surface text-mb-primary border border-mb-border shadow-md flex items-center justify-center transition-transform duration-300 group-hover:scale-110 flex-shrink-0">
                  <Icon icon="lucide:chevron-right" className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-mb-primary" />
                </div>
              </div>
            </Link>
          )}

          {/* Bottom Card */}
          {card3 && (
            <Link
              href={card3.href}
              className="group flex-1 relative block w-full h-full overflow-hidden rounded-[2px] bg-mb-surface border border-mb-border shadow-card hover:shadow-dropdown transition-all duration-300"
              aria-label={card3.ariaLabel}
            >
              <img
                src={card3.image}
                alt={`${card3.title} | Modest Studio`}
                className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.src.includes("/banners/timeless-beauty-banner.jpg")) {
                    target.src = "/banners/timeless-beauty-banner.jpg";
                  }
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent flex items-end justify-between p-3 sm:p-4">
                <span className="font-serif text-xs sm:text-sm md:text-base font-semibold text-white drop-shadow-md truncate pr-2">
                  {card3.title}
                </span>
                <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-full bg-mb-surface text-mb-primary border border-mb-border shadow-md flex items-center justify-center transition-transform duration-300 group-hover:scale-110 flex-shrink-0">
                  <Icon icon="lucide:chevron-right" className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-mb-primary" />
                </div>
              </div>
            </Link>
          )}
        </div>

        {/* Column 3: Right Tall Vertical Card — Only on desktop (md+), hidden on mobile (<md) */}
        {card4 && (
          <div className="hidden md:block md:col-span-4 h-[420px] sm:h-[480px] md:h-[620px] lg:h-[680px]">
            <Link
              href={card4.href}
              className="group relative block w-full h-full overflow-hidden rounded-[2px] bg-mb-surface border border-mb-border shadow-card hover:shadow-dropdown transition-all duration-300"
              aria-label={card4.ariaLabel}
            >
              <img
                src={card4.image}
                alt={`${card4.title} | Modest Studio`}
                className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.src.includes("/banners/top-promo-banner.jpg")) {
                    target.src = "/banners/top-promo-banner.jpg";
                  }
                }}
              />
              {/* Gradient & Floating Circular Arrow Button */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent flex items-end justify-between p-5">
                <span className="font-serif text-base sm:text-lg font-semibold text-white drop-shadow-md truncate pr-2">
                  {card4.title}
                </span>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white text-neutral-900 shadow-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-110 flex-shrink-0">
                  <Icon icon="lucide:chevron-right" className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
                </div>
              </div>
            </Link>
          </div>
        )}

      </div>
    </section>
  );
}
