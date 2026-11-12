import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { categoryAPI } from "@/lib/api";
import type { Product } from "@/lib/types";

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  image?: string;
  imageUrl?: string;
  img?: string;
  thumbnail?: string;
  banner?: string;
  coverImage?: string;
  description?: string;
}

interface DiscoverCategoriesProps {
  initialCategories?: CategoryItem[];
  initialProducts?: Product[];
}

/**
 * Dynamically resolves category image from:
 * 1. Direct dynamically uploaded category image (Cloudinary URL, external URL, or uploaded path)
 * 2. Dynamically matched product image for this category from live products
 * 3. Gracefully returns empty string if no image has been uploaded yet
 */
export function getDynamicCategoryImage(cat: CategoryItem, products?: Product[]): string {
  // 1. Direct dynamically uploaded image from Category
  const rawImage =
    cat.image ||
    cat.imageUrl ||
    cat.img ||
    cat.thumbnail ||
    cat.coverImage ||
    cat.banner;

  if (rawImage && typeof rawImage === "string" && rawImage.trim() !== "") {
    const trimmed = rawImage.trim();
    if (trimmed.startsWith("/images/")) {
      return `https://admin-moodest-25.vercel.app${trimmed}`;
    }
    return trimmed;
  }

  // 2. Dynamically match product image uploaded for this category if available
  if (products && products.length > 0) {
    const slug = (cat.slug || "").toLowerCase();
    const name = (cat.name || "").toLowerCase();
    const id = String(cat.id || "");

    const matchedProduct = products.find((p: any) => {
      const pCat = p.category;
      if (!pCat) return false;
      if (typeof pCat === "string") {
        const pSlug = pCat.toLowerCase();
        return pSlug === slug || pSlug === name || pSlug === id;
      }
      if (typeof pCat === "object") {
        return (
          pCat.id === id ||
          pCat.slug?.toLowerCase() === slug ||
          pCat.name?.toLowerCase() === name
        );
      }
      return false;
    });

    if (matchedProduct) {
      const pImg =
        matchedProduct.image ||
        (Array.isArray(matchedProduct.images) && matchedProduct.images[0]);
      if (pImg && typeof pImg === "string" && pImg.trim() !== "") {
        return pImg.trim();
      }
    }
  }

  return "";
}

export default function DiscoverCategories({ initialCategories, initialProducts }: DiscoverCategoriesProps) {
  const [categories, setCategories] = useState<CategoryItem[]>(initialCategories || []);
  const [loading, setLoading] = useState(!initialCategories || initialCategories.length === 0);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Sync state whenever initialCategories prop changes
  useEffect(() => {
    if (initialCategories && initialCategories.length > 0) {
      setCategories(initialCategories);
      setLoading(false);
    }
  }, [initialCategories]);

  // Live fetch from database via backend API (/api/categories)
  const fetchDbCategories = async (isSubscribed = true) => {
    try {
      if (!initialCategories || initialCategories.length === 0) {
        setLoading(true);
      }
      const data = await categoryAPI.getAll();
      if (!isSubscribed) return;
      const list = Array.isArray(data) ? data : Array.isArray((data as any)?.data) ? (data as any).data : [];
      if (list.length > 0) {
        const mapped: CategoryItem[] = list.map((cat: any) => {
          const directImg =
            cat.image ||
            cat.imageUrl ||
            cat.img ||
            cat.thumbnail ||
            cat.coverImage ||
            cat.banner;
          return {
            id: String(cat.id),
            name: cat.name,
            slug: cat.slug || cat.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            image:
              directImg && typeof directImg === "string" && directImg.trim() !== ""
                ? directImg.trim()
                : "",
            imageUrl: cat.imageUrl,
            img: cat.img,
            thumbnail: cat.thumbnail,
            banner: cat.banner,
            description: cat.description || "",
          };
        });
        setCategories(mapped);
      }
    } catch (err) {
      console.warn("[DiscoverCategories] Failed to load DB categories:", err);
    } finally {
      if (isSubscribed) setLoading(false);
    }
  };

  useEffect(() => {
    let isSubscribed = true;
    fetchDbCategories(isSubscribed);
    return () => {
      isSubscribed = false;
    };
  }, []);

  // Update active dot index on manual scroll
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const scrollLeft = container.scrollLeft;
    const childWidth = container.firstElementChild?.clientWidth || 200;
    const newIdx = Math.round(scrollLeft / (childWidth + 16));
    setActiveIndex(Math.min(Math.max(newIdx, 0), categories.length - 1));
  };

  // Manual dot click navigation
  const scrollToCard = (idx: number) => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const cards = container.children;
    if (cards[idx]) {
      cards[idx].scrollIntoView({
        behavior: "smooth",
        inline: "start",
        block: "nearest",
      });
      setActiveIndex(idx);
    }
  };

  // Left/Right arrow manual controls
  const scrollPrev = () => {
    scrollToCard(Math.max(activeIndex - 1, 0));
  };

  const scrollNext = () => {
    scrollToCard(Math.min(activeIndex + 1, categories.length - 1));
  };

  if (loading && categories.length === 0) {
    return (
      <section className="w-full px-3 sm:px-6 my-10" aria-label="Loading Abaya Categories">
        <div className="flex items-center justify-between mb-5">
          <div className="space-y-1">
            <div className="h-6 w-48 bg-mb-border/40 rounded animate-pulse" />
            <div className="h-4 w-72 bg-mb-border/30 rounded animate-pulse" />
          </div>
        </div>
        <div className="flex gap-3.5 sm:gap-4 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-[46vw] sm:w-[30vw] md:w-[22vw] lg:w-[calc((100%-5*1rem)/6)] aspect-[2/3] rounded-[2px] bg-mb-surface border border-mb-border animate-pulse"
            />
          ))}
        </div>
      </section>
    );
  }

  if (categories.length === 0) return null;

  return (
    <section className="w-full max-w-full px-3 sm:px-6 my-10 relative group/section overflow-hidden" aria-label="Explore Abaya Categories">
      {/* Header with Dynamic Database Categories Subtitle & Underlined DISCOVER MORE */}
      <div className="flex items-center justify-between mb-3.5 sm:mb-6">
        <div>
          <h2 className="font-serif text-lg sm:text-2xl md:text-3xl font-bold text-mb-text tracking-tight">
            Shop by Category
          </h2>
          <p className="text-[11px] sm:text-sm text-mb-muted mt-0.5 sm:mt-1">
            Browse our curated collections
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/category/all"
            className="text-[11px] sm:text-sm font-bold uppercase tracking-wider text-mb-text hover:text-mb-primary underline underline-offset-4 decoration-1 decoration-mb-text/80 transition-colors"
          >
            DISCOVER MORE
          </Link>
          {/* Arrow navigation buttons */}
          {categories.length > 1 && (
            <div className="hidden sm:flex items-center gap-1.5 ml-2">
              <button
                type="button"
                onClick={scrollPrev}
                disabled={activeIndex === 0}
                aria-label="Previous categories"
                className="w-8 h-8 rounded-full bg-mb-surface border border-mb-border text-mb-text hover:bg-mb-primary hover:text-white transition-all flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none shadow-xs cursor-pointer"
              >
                <Icon icon="lucide:chevron-left" className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={scrollNext}
                disabled={activeIndex >= categories.length - 1}
                aria-label="Next categories"
                className="w-8 h-8 rounded-full bg-mb-surface border border-mb-border text-mb-text hover:bg-mb-primary hover:text-white transition-all flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none shadow-xs cursor-pointer"
              >
                <Icon icon="lucide:chevron-right" className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Horizontal Scrollable Rail with Snap: Displays Live Database Categories */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory gap-3.5 sm:gap-4.5 pb-2 -mx-3 px-3 sm:mx-0 sm:px-0"
      >
        {categories.map((cat, idx) => {
          const href = `/category/${cat.slug || cat.id}`;
          return (
            <div
              key={cat.id || cat.slug || idx}
              className="snap-start flex-shrink-0 w-[46vw] sm:w-[32vw] md:w-[22vw] lg:w-[calc((100%-5*1.125rem)/6)]"
            >
              <Link
                href={href}
                className="group block overflow-hidden rounded-[2px] bg-mb-surface border border-mb-border shadow-card hover:shadow-dropdown hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#E8DDD0]">
                  {/* Reference Image Index Pill Badge (01, 02, 03...) */}
                  <div className="absolute top-2.5 sm:top-3 left-2.5 sm:left-3 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/40 dark:bg-black/40 backdrop-blur-md border border-white/30 flex items-center justify-center text-white text-[11px] sm:text-xs font-semibold shadow-xs">
                    {String(idx + 1).padStart(2, "0")}
                  </div>

                  {(() => {
                    const dynamicImg = getDynamicCategoryImage(cat, initialProducts);
                    return dynamicImg ? (
                      <img
                        src={dynamicImg}
                        alt={`${cat.name} — Handcrafted Luxury Modest Abaya Collection | Modest Studio`}
                        className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-b from-[#EFE5D9] to-[#DDD1C3] text-center">
                        <span className="font-serif text-3xl text-mb-primary/30 font-bold">
                          {cat.name.slice(0, 1).toUpperCase()}
                        </span>
                      </div>
                    );
                  })()}

                  {/* Reference Image Bottom Layout: Category Title + White Circular Arrow Button */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex items-end justify-between p-3.5 sm:p-4">
                    <span className="text-white font-serif text-sm sm:text-base font-semibold group-hover:text-[#D29A90] transition-colors drop-shadow-sm leading-tight pr-2">
                      {cat.name}
                    </span>
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-mb-surface text-mb-primary border border-mb-border shadow-md flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Icon icon="lucide:chevron-right" className="w-3.5 h-3.5 text-mb-primary" />
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}
