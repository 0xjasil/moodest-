import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import ProductCard, { type Product } from "@/components/ProductCard";
import { productAPI, mapBackendProductToProduct } from "@/lib/api";

/* ── Section header ───────────────────────────────────────────── */
export function SectionHeader({ title, subtitle, viewAllHref }: {
  title: string; subtitle?: string; viewAllHref?: string;
}) {
  return (
    <div className="flex items-end justify-between mb-5">
      <div>
        <h2 className="font-serif text-xl sm:text-2xl font-semibold text-mb-text leading-tight">{title}</h2>
        {subtitle && <p className="text-sm text-mb-muted mt-1">{subtitle}</p>}
      </div>
      {viewAllHref && (
        <Link href={viewAllHref}
          className="text-sm font-semibold text-mb-accent-deep hover:text-mb-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mb-accent rounded-sm">
          View All →
        </Link>
      )}
    </div>
  );
}

/* ── Category filter tabs ─────────────────────────────────────── */
const CATS = [
  { key: "all",               label: "All Products" },
  { key: "syrian",            label: "Syrian Collection" },
  { key: "classics",          label: "The Classics" },
  { key: "luxe",              label: "The Luxe Edit" },
  { key: "occasion",          label: "Occasion Wear" },
  { key: "kimono",            label: "Kimono & Kaftan" },
  { key: "open",              label: "Open Abaya Edit" },
];

/* ── ProductGrid ──────────────────────────────────────────────── */
export default function ProductGrid() {
  const [cat, setCat] = useState("all");
  const [items, setItems] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await productAPI.getAll({ limit: 40 });
      if (res?.items && Array.isArray(res.items)) {
        setItems(res.items.map(mapBackendProductToProduct));
      } else {
        setItems([]);
      }
    } catch (err: any) {
      console.error("[ProductGrid] Failed to fetch products:", err);
      setError("Unable to load products. Please check your connection and retry.");
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filtered = cat === "all" ? items : items.filter(p => {
    const pCat = (p.category || "").toLowerCase();
    return pCat.includes(cat) || cat.includes(pCat);
  });

  return (
    <section className="bg-mb-bg py-8 px-4 md:px-6 border-t border-mb-border-lite" aria-labelledby="pg-heading">
      <div className="mx-auto max-w-content">

        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h2 id="pg-heading" className="font-serif text-2xl sm:text-3xl font-semibold text-mb-text">Featured Curations</h2>
            <p className="text-sm text-mb-muted mt-1">Authentic luxury abayas and modest wears</p>
          </div>
          {/* Filter pills */}
          <div role="group" aria-label="Filter by category" className="flex gap-2 flex-wrap">
            {CATS.map(c => (
              <button key={c.key} type="button" role="radio" aria-checked={cat === c.key}
                onClick={() => setCat(c.key)}
                className={`px-4 py-1.5 text-xs font-semibold rounded-full border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mb-accent ${
                  cat === c.key
                    ? "bg-mb-primary border-mb-primary text-mb-bg shadow-sm"
                    : "bg-mb-surface border-mb-border text-mb-body hover:border-mb-accent hover:text-mb-primary"
                }`}>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading Skeletons */}
        {isLoading && (
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6" aria-label="Loading products">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-mb-surface border border-mb-border rounded-lg p-3 space-y-3 animate-pulse">
                <div className="aspect-square bg-mb-border/40 rounded-md" />
                <div className="h-4 bg-mb-border/40 rounded w-3/4" />
                <div className="h-3 bg-mb-border/30 rounded w-1/2" />
                <div className="h-4 bg-mb-border/40 rounded w-1/3" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="py-12 text-center flex flex-col items-center justify-center gap-3">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            <button
              type="button"
              onClick={fetchProducts}
              className="px-4 py-2 bg-mb-primary text-mb-bg text-xs font-semibold rounded-md hover:bg-mb-primary-hover transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Genuine Empty State */}
        {!isLoading && !error && filtered.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-base font-serif text-mb-text font-medium">No products found</p>
            <p className="text-xs text-mb-muted mt-1">There are currently no items in this category.</p>
          </div>
        )}

        {/* Product Grid */}
        {!isLoading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
            aria-label="Product listing">
            {filtered.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </section>
  );
}
