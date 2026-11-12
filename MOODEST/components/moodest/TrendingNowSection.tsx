import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import ProductCard from "@/components/ProductCard";
import { productAPI, mapBackendProductToProduct } from "@/lib/api";
import type { Product } from "@/lib/types";

// Random shuffle helper
function shuffleList<T>(list: T[]): T[] {
  const result = [...list];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

interface TrendingNowSectionProps {
  initialProducts?: Product[];
}

export default function TrendingNowSection({ initialProducts }: TrendingNowSectionProps = {}) {
  const [products, setProducts] = useState<Product[]>(() => {
    if (initialProducts && initialProducts.length > 0) {
      const trending = initialProducts.filter(
        (p: any) => p.isCustomerFavorite || p.isTrending || p.isFeatured || p.isBestSeller
      );
      const remaining = initialProducts.filter(
        (p: any) => !(p.isCustomerFavorite || p.isTrending || p.isFeatured || p.isBestSeller)
      );
      return [...trending, ...remaining];
    }
    return [];
  });
  const [loading, setLoading] = useState(!initialProducts || initialProducts.length === 0);
  const [activeIndex, setActiveIndex] = useState(0);
  const railRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isSubscribed = true;
    (async () => {
      try {
        setLoading(true);
        // Connect live to https://admin-moodest-25.vercel.app/products/add (backed by /products API)
        const res = await productAPI.getAll({ limit: 40 });
        if (!isSubscribed) return;
        const items = Array.isArray(res?.items) ? res.items.map(mapBackendProductToProduct) : [];

        // Prioritize products marked as Trending / Customer Favorite / Featured / BestSeller
        const trending = items.filter(
          (p: any) => p.isCustomerFavorite || p.isTrending || p.isFeatured || p.isBestSeller
        );
        const remaining = items.filter(
          (p: any) => !(p.isCustomerFavorite || p.isTrending || p.isFeatured || p.isBestSeller)
        );

        const merged = [
          ...shuffleList(trending),
          ...shuffleList(remaining)
        ];

        setProducts(merged);
      } catch (err) {
        console.warn("[TrendingNowSection] Failed to load products from admin API:", err);
      } finally {
        if (isSubscribed) setLoading(false);
      }
    })();

    return () => {
      isSubscribed = false;
    };
  }, []);

  // Handle scroll to sync manual pagination dots
  const handleScroll = () => {
    if (!railRef.current) return;
    const container = railRef.current;
    const scrollLeft = container.scrollLeft;
    const childWidth = container.firstElementChild?.clientWidth || 280;
    const newIdx = Math.round(scrollLeft / (childWidth + 16));
    setActiveIndex(Math.min(Math.max(newIdx, 0), products.length - 1));
  };

  // Manual dot scroll
  const scrollToItem = (idx: number) => {
    if (!railRef.current) return;
    const container = railRef.current;
    const children = container.children;
    if (children[idx]) {
      children[idx].scrollIntoView({
        behavior: "smooth",
        inline: "start",
        block: "nearest",
      });
      setActiveIndex(idx);
    }
  };

  const scrollPrev = () => {
    scrollToItem(Math.max(activeIndex - 1, 0));
  };

  const scrollNext = () => {
    scrollToItem(Math.min(activeIndex + 1, products.length - 1));
  };

  return (
    <section className="w-full max-w-full px-3 sm:px-6 my-10 sm:my-16 relative block clear-both overflow-hidden" aria-label="Trending Now">
      {/* Section Header with Refined Header Size & Underlined DISCOVER MORE */}
      <div className="flex items-center justify-between mb-3.5 sm:mb-6">
        <div>
          <h2 className="font-serif text-lg sm:text-2xl md:text-3xl font-bold text-mb-text tracking-tight">
            Trending Now
          </h2>
          <p className="text-[11px] sm:text-sm text-mb-muted mt-0.5 sm:mt-1">
            Most Coveted Silhouettes &amp; Client Favorites
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/category/all?sort=trending"
            className="text-[11px] sm:text-sm font-bold uppercase tracking-wider text-mb-text hover:text-mb-primary underline underline-offset-4 decoration-1 decoration-mb-text/80 transition-colors"
          >
            DISCOVER MORE
          </Link>
          {/* Arrow navigation buttons — desktop only */}
          {products.length > 1 && (
            <div className="hidden sm:flex items-center gap-1.5 ml-2">
              <button
                type="button"
                onClick={scrollPrev}
                disabled={activeIndex === 0}
                aria-label="Previous trending items"
                className="w-8 h-8 rounded-full bg-mb-surface border border-mb-border text-mb-text hover:bg-mb-primary hover:text-white transition-all flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none shadow-xs cursor-pointer"
              >
                <Icon icon="lucide:chevron-left" className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={scrollNext}
                disabled={activeIndex >= products.length - 1}
                aria-label="Next trending items"
                className="w-8 h-8 rounded-full bg-mb-surface border border-mb-border text-mb-text hover:bg-mb-primary hover:text-white transition-all flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none shadow-xs cursor-pointer"
              >
                <Icon icon="lucide:chevron-right" className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Loading Skeletons */}
      {loading ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[3/4] rounded-[2px] bg-mb-surface border border-mb-border animate-pulse"
              />
            ))}
          </div>
          <div className="hidden sm:flex gap-4 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-[42vw] md:w-[30vw] lg:w-[260px] aspect-[3/4] rounded-[2px] bg-mb-surface border border-mb-border animate-pulse"
              />
            ))}
          </div>
        </>
      ) : products.length > 0 ? (
        <>
          {/* Mobile View: Exact same 2-column grid as New Arrivals */}
          <div className="grid grid-cols-2 gap-3 sm:hidden">
            {products.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Desktop View: Interactive Horizontal Rail Carousel */}
          <div className="hidden sm:block relative">
            <div
              ref={railRef}
              onScroll={handleScroll}
              className="flex overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory gap-4 sm:gap-5 pb-3 items-stretch"
            >
              {products.map((product) => (
                <div
                  key={product.id}
                  className="snap-start flex-shrink-0 sm:w-[44vw] md:w-[32vw] lg:w-[275px]"
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}
