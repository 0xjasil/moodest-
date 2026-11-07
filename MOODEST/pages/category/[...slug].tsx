import React, { useState, useMemo, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";
import ProductCard, { type Product } from "@/components/ProductCard";
import { products as fallbackProducts } from "@/components/ProductGrid";
import { productAPI, mapBackendProductToProduct } from "@/lib/api";

/* ── Filter sidebar config ────────────────────────────────────── */
const FILTER_GROUPS = [
  "Brand", "Price", "Category", "Discount", "Avg Customer Rating",
  "Country Of Origin", "Preference", "Formulation",
  "Finish", "Skin type", "Benefits", "Ingredient", "Concern"
];

const SORT_OPTIONS = [
  { value: "popularity",  label: "Popularity" },
  { value: "price-asc",   label: "Price: Low to High" },
  { value: "price-desc",  label: "Price: High to Low" },
  { value: "rating",      label: "Customer Rating" },
  { value: "discount",    label: "Discount" },
  { value: "newest",      label: "New Arrivals" },
];

/* ── Chevron icon ─────────────────────────────────────────────── */
const ChevronDown = ({ open }: { open: boolean }) => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
    className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
  <polyline points="6 9 12 15 18 9" />
  </svg>
);

/* ── Filter accordion item ────────────────────────────────────── */
function FilterGroup({ label }: { label: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-mb-border-lite last:border-b-0">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-mb-text hover:text-mb-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-mb-accent">
        {label}
        <ChevronDown open={open} />
      </button>
      {open && (
        <div className="px-4 pb-3 text-xs text-mb-muted">
          All options active for this collection.
        </div>
      )}
    </div>
  );
}

export default function Category() {
  const router = useRouter();
  const { slug, q } = router.query;
  const [sortBy, setSortBy] = useState("popularity");
  const [sortOpen, setSortOpen] = useState(false);
  const [catalogItems, setCatalogItems] = useState<Product[]>(fallbackProducts);

  const categorySlug = Array.isArray(slug) ? slug[0] : slug ?? "all";
  const searchQuery = typeof q === "string" ? q.trim().toLowerCase() : "";

  // Fetch live products from NestJS backend
  useEffect(() => {
    let isSubscribed = true;
    (async () => {
      try {
        const res = await productAPI.getAll({
          category: categorySlug === "all" ? undefined : categorySlug,
          search: searchQuery || undefined,
          limit: 50,
        });
        if (isSubscribed && res && Array.isArray(res.items) && res.items.length > 0) {
          const mapped = res.items.map(mapBackendProductToProduct);
          setCatalogItems(mapped);
        }
      } catch {
        // Fallback to initial mock data on network error
      }
    })();
    return () => {
      isSubscribed = false;
    };
  }, [categorySlug, searchQuery]);

  const categoryDisplay = searchQuery
    ? `Results for "${q}"`
    : categorySlug === "all"
    ? "All Creations"
    : categorySlug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  const baseProducts = useMemo(() => {
    let list = catalogItems;
    if (searchQuery) {
      list = list.filter(p =>
        p.name.toLowerCase().includes(searchQuery) ||
        p.brand.toLowerCase().includes(searchQuery) ||
        p.category.toLowerCase().includes(searchQuery)
      );
      return list;
    }
    if (categorySlug === "all") return catalogItems;
    const matched = catalogItems.filter(p =>
      p.category.toLowerCase() === categorySlug.toLowerCase() ||
      p.brand.toLowerCase().replace(/\s+/g, "-").includes(categorySlug.toLowerCase())
    );
    return matched.length > 0 ? matched : catalogItems;
  }, [categorySlug, searchQuery, catalogItems]);

  const sorted = useMemo(() => {
    const arr = [...baseProducts];
    switch (sortBy) {
      case "price-asc":  return arr.sort((a, b) => a.price - b.price);
      case "price-desc": return arr.sort((a, b) => b.price - a.price);
      case "rating":     return arr.sort((a, b) => b.rating - a.rating);
      case "discount":   return arr.sort((a, b) => (b.discount ?? 0) - (a.discount ?? 0));
      default:           return arr;
    }
  }, [baseProducts, sortBy]);

  return (
    <>
      <Head>
        <title>{categoryDisplay} | Modest Studio</title>
      </Head>
      <Header />
      <main id="main-content" className="min-h-screen bg-mb-bg py-8">
        <div className="mx-auto max-w-[1280px] px-4 md:px-6">

          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex items-center gap-2 text-xs text-mb-muted" role="list">
              <li role="listitem">
                <Link href="/" className="hover:text-mb-primary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-mb-accent rounded">
                  Home
                </Link>
              </li>
              <li role="listitem" aria-hidden="true" className="text-mb-dusty">/</li>
              <li role="listitem" className="text-mb-text font-semibold capitalize" aria-current="page">
                {categoryDisplay}
              </li>
            </ol>
          </nav>

          {/* Category Title */}
          <div className="mb-6">
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-mb-text">
              {categoryDisplay}
              <span aria-hidden="true" className="font-sans text-sm font-normal text-mb-muted ml-2">
                ({sorted.length} {sorted.length === 1 ? "creation" : "creations"})
              </span>
            </h1>
          </div>

          {/* ── Main layout: filters sidebar + product grid ── */}
          <div className="flex gap-6 items-start">

            {/* Sidebar Filters */}
            <nav
              aria-label="Side navigation — filters"
              className="hidden md:block flex-shrink-0 bg-mb-surface border border-mb-border rounded-[14px] shadow-card overflow-hidden"
              style={{ width: "230px", minWidth: "230px" }}>

              {/* Sort By selector */}
              <div className="border-b border-mb-border p-3">
                <div className="relative">
                  <button
                    type="button"
                    aria-expanded={sortOpen}
                    aria-label={`Sort By: ${SORT_OPTIONS.find(o => o.value === sortBy)?.label}`}
                    onClick={() => setSortOpen(v => !v)}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-mb-text bg-mb-bg border border-mb-border rounded-[8px] hover:border-mb-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mb-accent">
                    <span>Sort: <span className="font-normal text-mb-body">{SORT_OPTIONS.find(o => o.value === sortBy)?.label}</span></span>
                    <ChevronDown open={sortOpen} />
                  </button>
                  {sortOpen && (
                    <div className="absolute left-0 top-full mt-1 w-full bg-mb-bg border border-mb-border rounded-[8px] z-30 shadow-dropdown overflow-hidden">
                      {SORT_OPTIONS.map(o => (
                        <button
                          key={o.value}
                          type="button"
                          onClick={() => { setSortBy(o.value); setSortOpen(false); }}
                          className={`w-full text-left px-3 py-2 text-xs transition-colors hover:bg-mb-surface ${
                            sortBy === o.value ? "text-mb-primary font-bold bg-mb-surface" : "text-mb-text font-medium"
                          }`}>
                          {o.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Filter accordion groups */}
              {FILTER_GROUPS.map(label => (
                <FilterGroup key={label} label={label} />
              ))}
            </nav>

            {/* ── Product grid ── */}
            <div className="flex-1 min-w-0">

              {/* Mobile sort bar */}
              <div className="md:hidden flex items-center justify-between bg-mb-surface border border-mb-border rounded-[10px] px-4 py-2.5 mb-4 shadow-card">
                <label htmlFor="mobile-sort" className="text-xs text-mb-body font-semibold">
                  Sort By:
                </label>
                <select id="mobile-sort" name="sort" value={sortBy} onChange={e => setSortBy(e.target.value)}
                  className="text-xs border-0 outline-none bg-transparent text-mb-primary font-bold cursor-pointer">
                  {SORT_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {sorted.length === 0 ? (
                <div className="bg-mb-surface border border-mb-border rounded-[14px] shadow-card p-12 text-center">
                  <p className="text-sm text-mb-body">No products found in &quot;{categoryDisplay}&quot;.</p>
                  <Link href="/" className="inline-block mt-4 text-xs font-semibold bg-mb-primary text-mb-bg px-6 py-2.5 rounded-[10px] shadow-sm">
                    Back to Home
                  </Link>
                </div>
              ) : (
                <div
                  className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4"
                  aria-label={`${categoryDisplay} products`}>
                  {sorted.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
