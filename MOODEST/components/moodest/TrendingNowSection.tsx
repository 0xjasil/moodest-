import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
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

// Editorial Lookbook Cards displayed alongside products in the carousel rail
const EDITORIAL_CARDS = [
  {
    id: "luxe-edit",
    title: "The Luxe Edit",
    subtitle: "Pure Silk Satin & Flowing Cuts",
    href: "/category/the-luxe-edit",
    image: "/abaya/categories/silk-satin.jpg",
  },
  {
    id: "syrian-collection",
    title: "Syrian Collection",
    subtitle: "Artisanal Handwork & Delicate Stitch",
    href: "/category/syrian-collection",
    image: "/abaya/categories/handwork-abaya.jpg",
  },
  {
    id: "occasion-wear",
    title: "Occasion Wear",
    subtitle: "Crystal Beads & Opulent Drapes",
    href: "/category/occasion-wear",
    image: "/abaya/categories/bridal-occasion.jpg",
  },
];

export default function TrendingNowSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
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

        // Ensure all products uploaded via admin panel are displayed with their real Cloudinary images
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
    const totalItems = products.length + EDITORIAL_CARDS.length;
    setActiveIndex(Math.min(Math.max(newIdx, 0), totalItems - 1));
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
    const total = products.length + EDITORIAL_CARDS.length;
    scrollToItem(Math.min(activeIndex + 1, total - 1));
  };

  // Total items in the slider
  const totalItemsCount = products.length + EDITORIAL_CARDS.length;

  return (
    <section className="w-full px-3 sm:px-6 my-12 relative" aria-label="Trending Now">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-mb-text">
            Trending Now
          </h2>
          <p className="text-xs sm:text-sm text-mb-muted mt-0.5">
            Most Coveted Silhouettes &amp; Client Favorites
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/category/all?sort=trending"
            className="text-xs sm:text-sm font-semibold text-mb-primary hover:text-mb-primary-hover flex items-center gap-1 transition-colors group"
          >
            <span>Discover More</span> <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
          {/* Arrow navigation buttons */}
          <div className="hidden sm:flex items-center gap-1.5 ml-2">
            <button
              type="button"
              onClick={scrollPrev}
              disabled={activeIndex === 0}
              aria-label="Previous trending items"
              className="w-8 h-8 rounded-full bg-mb-surface border border-mb-border text-mb-text hover:bg-mb-primary hover:text-white transition-all flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none shadow-xs"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={scrollNext}
              disabled={activeIndex >= totalItemsCount - 1}
              aria-label="Next trending items"
              className="w-8 h-8 rounded-full bg-mb-surface border border-mb-border text-mb-text hover:bg-mb-primary hover:text-white transition-all flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none shadow-xs"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Loading Skeletons */}
      {loading ? (
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-[75vw] sm:w-[42vw] md:w-[30vw] lg:w-[260px] aspect-[3/4] rounded-[8px] bg-mb-surface border border-mb-border animate-pulse"
            />
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="relative">
          {/* Horizontal Rail Matching Attached Screenshot Reference (Product Card next to Editorial Card with > Button) */}
          <div
            ref={railRef}
            onScroll={handleScroll}
            className="flex overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory gap-4 sm:gap-5 pb-3 -mx-3 px-3 sm:mx-0 sm:px-0 items-stretch"
          >
            {/* Products Uploaded in Admin Panel */}
            {products.map((product) => (
              <div
                key={product.id}
                className="snap-start flex-shrink-0 w-[78vw] sm:w-[44vw] md:w-[32vw] lg:w-[275px]"
              >
                <ProductCard product={product} />
              </div>
            ))}

            {/* Editorial Lookbook Cards (Matching 'The Luxe Edit' in Attached Screenshot) */}
            {EDITORIAL_CARDS.map((card) => (
              <div
                key={card.id}
                className="snap-start flex-shrink-0 w-[78vw] sm:w-[44vw] md:w-[32vw] lg:w-[275px] relative"
              >
                <Link
                  href={card.href}
                  className="group relative block w-full h-full min-h-[380px] overflow-hidden rounded-[14px] sm:rounded-[18px] bg-neutral-900 border border-mb-border shadow-card hover:shadow-xl transition-all"
                >
                  <img
                    src={card.image}
                    alt={card.title}
                    className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105 opacity-85 group-hover:opacity-100"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (!target.src.includes("/abaya/categories/silk-satin.jpg")) {
                        target.src = "/abaya/categories/silk-satin.jpg";
                      }
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex flex-col justify-end p-5">
                    <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-[#D29A90] font-semibold mb-1">
                      Featured Edit
                    </span>
                    <h3 className="font-serif text-lg sm:text-xl font-semibold text-white drop-shadow-md">
                      {card.title}
                    </h3>
                    <p className="text-xs text-white/80 font-sans mt-0.5 line-clamp-1">
                      {card.subtitle}
                    </p>
                    <span className="text-[11px] text-[#D29A90] font-sans font-semibold mt-2 inline-flex items-center gap-1 group-hover:underline">
                      Explore Silhouette →
                    </span>
                  </div>
                </Link>

                {/* Floating Round Arrow Button Between Items (Matching Reference Screenshot) */}
                <button
                  type="button"
                  onClick={scrollNext}
                  aria-label="Next card"
                  className="absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white text-neutral-900 shadow-xl border border-neutral-200 flex items-center justify-center transition-transform duration-300 hover:scale-110 hidden sm:flex"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {/* Manual Dotting Area: Controllable Pagination Dots Below Trending Now Section */}
          {totalItemsCount > 1 && (
            <div
              className="flex items-center justify-center gap-2 mt-5 py-2"
              role="tablist"
              aria-label="Trending Now Carousel Pagination Dots"
            >
              {Array.from({ length: totalItemsCount }).map((_, idx) => {
                const isActive = activeIndex === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-label={`Go to slide ${idx + 1}`}
                    onClick={() => scrollToItem(idx)}
                    className={`transition-all duration-300 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mb-accent ${
                      isActive
                        ? "w-7 h-2 bg-mb-primary shadow-xs"
                        : "w-2 h-2 bg-mb-border hover:bg-mb-muted/60"
                    }`}
                  />
                );
              })}
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}
