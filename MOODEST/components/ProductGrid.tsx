import React, { useState, useEffect } from "react";
import Link from "next/link";
import ProductCard, { type Product } from "@/components/ProductCard";
import productsData from "@/products.json";
import { productAPI, mapBackendProductToProduct } from "@/lib/api";

/* ── Products from JSON ───────────────────────────────────────── */
export const products: Product[] = (productsData as any[]).map((p: any, i: number) => ({
  id:            String(p.id ?? i + 1),
  name:          p.name,
  price:         p.price ?? 499,
  originalPrice: p.originalPrice ?? undefined,
  discount:      p.discount ?? undefined,
  rating:        p.rating ?? 4.2,
  reviewCount:   p.reviewCount ?? 120,
  image:         p.image,
  badge:         p.badge ?? undefined,
  category:      (p.category as Product["category"]) ?? "front-open",
  brand:         p.brand ?? "Modest Studio",
}));

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
  { key: "all",       label: "All Products" },
  { key: "makeup",    label: "Makeup" },
  { key: "skincare",  label: "Skincare" },
  { key: "fragrance", label: "Fragrance" },
  { key: "haircare",  label: "Hair" },
];

/* ── ProductGrid ──────────────────────────────────────────────── */
export default function ProductGrid() {
  const [cat, setCat] = useState("all");
  const [items, setItems] = useState<Product[]>(products);

  useEffect(() => {
    let isSubscribed = true;
    (async () => {
      try {
        const res = await productAPI.getAll({ limit: 40 });
        if (isSubscribed && res?.items && res.items.length > 0) {
          setItems(res.items.map(mapBackendProductToProduct));
        }
      } catch {
        // Fallback to static products
      }
    })();
    return () => {
      isSubscribed = false;
    };
  }, []);

  const filtered = cat === "all" ? items : items.filter(p => p.category === cat);

  return (
    <section className="bg-mb-bg py-8 px-4 md:px-6 border-t border-mb-border-lite" aria-labelledby="pg-heading">
      <div className="mx-auto max-w-content">

        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h2 id="pg-heading" className="font-serif text-2xl sm:text-3xl font-semibold text-mb-text">Featured Curations</h2>
            <p className="text-sm text-mb-muted mt-1">Authentic luxury beauty, curated by Moryelle Beauté</p>
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

        {/* Grid — generous spacing, luxury cards */}
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
          aria-label="Product listing">
          {filtered.map(p => <ProductCard key={p.id} product={p} />)}
        </div>

        {filtered.length === 0 && (
          <p className="py-12 text-center text-sm text-mb-muted">No products found in this category.</p>
        )}
      </div>
    </section>
  );
}
