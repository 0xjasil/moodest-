import React, { useState, useEffect } from "react";
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

export default function NewArrivalsSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isSubscribed = true;
    (async () => {
      try {
        setLoading(true);
        const res = await productAPI.getAll({ limit: 40 });
        if (!isSubscribed) return;
        const items = Array.isArray(res?.items) ? res.items.map(mapBackendProductToProduct) : [];
        
        // Prioritize products marked as isNewArrival, then shuffle to show randomized products on each visit
        const newArrivals = items.filter((p: any) => p.isNewArrival);
        const remaining = items.filter((p: any) => !p.isNewArrival);
        
        const randomized = [
          ...shuffleList(newArrivals),
          ...shuffleList(remaining)
        ].slice(0, 8); // 2 rows of 4 cards on desktop

        setProducts(randomized);
      } catch (err) {
        console.warn("[NewArrivalsSection] Failed to load products:", err);
      } finally {
        if (isSubscribed) setLoading(false);
      }
    })();

    return () => {
      isSubscribed = false;
    };
  }, []);

  return (
    <section className="w-full px-3 sm:px-6 my-10" aria-label="New Arrivals">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-mb-text">
            New Arrivals
          </h2>
          <p className="text-xs sm:text-sm text-mb-muted mt-0.5">
            Fresh Haute Couture &amp; Artisanal Modest Edits
          </p>
        </div>
        <Link
          href="/category/all?sort=newest"
          className="text-xs sm:text-sm font-semibold text-mb-primary hover:text-mb-primary-hover flex items-center gap-1 transition-colors group"
        >
          <span>Discover More</span> <span className="transition-transform group-hover:translate-x-1">→</span>
        </Link>
      </div>

      {/* 2 Rows Grid with Elevated Fashion Card Height */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] rounded-[8px] bg-mb-surface border border-mb-border animate-pulse" />
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : null}
    </section>
  );
}
