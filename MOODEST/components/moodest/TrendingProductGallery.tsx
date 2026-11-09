import React, { useState, useEffect } from "react";
import Link from "next/link";
import { productAPI, mapBackendProductToProduct } from "@/lib/api";
import type { Product } from "@/components/ProductCard";

export default function TrendingProductGallery() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isSubscribed = true;
    (async () => {
      try {
        setLoading(true);
        const res = await productAPI.getAll({ limit: 8 });
        if (!isSubscribed) return;
        if (res?.items && Array.isArray(res.items) && res.items.length > 0) {
          setProducts(res.items.map(mapBackendProductToProduct));
        } else {
          setProducts([]);
        }
      } catch (err) {
        console.warn("[TrendingProductGallery] Failed to fetch products:", err);
        if (isSubscribed) setProducts([]);
      } finally {
        if (isSubscribed) setLoading(false);
      }
    })();

    return () => {
      isSubscribed = false;
    };
  }, []);

  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 py-10 md:py-16" aria-labelledby="trending-gallery-heading">
      <div className="mx-auto max-w-content">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-8 md:mb-10">
          <div>
            <h2 id="trending-gallery-heading" className="font-serif text-2xl sm:text-3xl lg:text-4xl font-semibold text-mb-text tracking-tight">
              Trending Now
            </h2>
            <p className="text-xs sm:text-sm text-mb-muted mt-1.5 max-w-xl font-normal">
              Most popular picks added to the collection.
            </p>
          </div>
          <Link
            href="/category/all"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-mb-accent-deep hover:text-mb-primary transition-colors self-start sm:self-auto group"
          >
            <span>Explore All Trending</span>
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </div>

        {/* Loading Skeletons */}
        {loading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl overflow-hidden bg-mb-surface border border-mb-border/40 p-3 space-y-3 animate-pulse">
                <div className="aspect-[3/4] bg-mb-border/30 rounded-lg w-full" />
                <div className="h-4 bg-mb-border/30 rounded w-3/4" />
                <div className="h-3 bg-mb-border/20 rounded w-1/2" />
                <div className="h-4 bg-mb-border/30 rounded w-1/3" />
              </div>
            ))}
          </div>
        )}

        {/* Product Gallery — Horizontal Scrolling on Mobile, Spacious Multi-Column on Desktop */}
        {!loading && products.length > 0 && (
          <div>
            {/* Mobile Rail (< 768px): Horizontal Scroll with Snap */}
            <div className="flex md:hidden overflow-x-auto no-scrollbar snap-x snap-mandatory gap-4 pb-4 -mx-4 px-4">
              {products.map((prod) => {
                const hasDiscount = Boolean(prod.originalPrice && Number(prod.originalPrice) > Number(prod.price));
                return (
                  <div key={prod.id} className="snap-start flex-shrink-0 w-[72vw] max-w-[280px]">
                    <Link
                      href={`/product/${prod.id}`}
                      className="group block rounded-xl overflow-hidden bg-mb-surface border border-mb-border/40 shadow-xs hover:shadow-md transition-all duration-300"
                    >
                      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#EFE8DF]">
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (!target.src.includes("/abaya/products/abaya-1.jpg")) {
                              target.src = "/abaya/products/abaya-1.jpg";
                            }
                          }}
                        />
                        {hasDiscount && (
                          <span className="absolute top-2.5 left-2.5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-mb-primary text-white rounded">
                            {prod.discount ? `${prod.discount}% OFF` : "SALE"}
                          </span>
                        )}
                      </div>

                      <div className="p-3.5 space-y-1">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-mb-muted">
                          {prod.brand || "Modest Studio"}
                        </p>
                        <h3 className="text-xs font-medium text-mb-text line-clamp-1 group-hover:text-mb-primary transition-colors">
                          {prod.name}
                        </h3>
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-sm font-semibold text-mb-primary">₹{prod.price}</span>
                          {hasDiscount && (
                            <span className="text-xs text-mb-muted line-through">₹{prod.originalPrice}</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>

            {/* Desktop & Tablet Grid (>= 768px): Spacious Multi-Column Curated Gallery */}
            <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((prod, idx) => {
                const hasDiscount = Boolean(prod.originalPrice && Number(prod.originalPrice) > Number(prod.price));
                return (
                  <Link
                    key={prod.id}
                    href={`/product/${prod.id}`}
                    className="group block rounded-2xl overflow-hidden bg-mb-surface border border-mb-border/40 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-400"
                  >
                    {/* Media Frame */}
                    <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#EFE8DF]">
                      <img
                        src={prod.image}
                        alt={prod.name}
                        className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (!target.src.includes("/abaya/products/abaya-1.jpg")) {
                            target.src = "/abaya/products/abaya-1.jpg";
                          }
                        }}
                      />

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                        {idx === 0 && (
                          <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-black/70 backdrop-blur-xs text-mb-gold rounded-full border border-white/10">
                            BESTSELLER
                          </span>
                        )}
                        {hasDiscount && (
                          <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-mb-primary text-white rounded-md">
                            {prod.discount ? `${prod.discount}% OFF` : "OFFER"}
                          </span>
                        )}
                      </div>

                      {/* Quick View Hover Button */}
                      <div className="absolute inset-x-3 bottom-3 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                        <div className="w-full py-2.5 text-center text-xs font-semibold rounded-lg bg-white/95 backdrop-blur-xs text-mb-primary hover:bg-mb-primary hover:text-white transition-colors shadow-md">
                          View Details
                        </div>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="p-4 space-y-1">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-mb-muted">
                        {prod.brand || "Modest Studio"}
                      </p>
                      <h3 className="font-serif text-sm font-medium text-mb-text line-clamp-1 group-hover:text-mb-primary transition-colors">
                        {prod.name}
                      </h3>
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-sm font-semibold text-mb-primary">₹{prod.price}</span>
                        {hasDiscount && (
                          <span className="text-xs text-mb-muted line-through">₹{prod.originalPrice}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty Fallback */}
        {!loading && products.length === 0 && (
          <div className="text-center py-12 bg-mb-surface/60 rounded-2xl border border-mb-border/40">
            <p className="text-sm text-mb-muted">Currently curating this week&apos;s trending pieces.</p>
            <Link href="/category/all" className="inline-block mt-3 text-xs font-semibold text-mb-primary hover:underline">
              Browse All Collections →
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
