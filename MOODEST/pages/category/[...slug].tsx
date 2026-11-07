import React, { useState, useMemo, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";
import ProductCard, { type Product } from "@/components/ProductCard";
import { products as fallbackProducts } from "@/components/ProductGrid";
import { productAPI, categoryAPI, mapBackendProductToProduct } from "@/lib/api";

const DEFAULT_CATEGORIES = [
  {
    id: "everyday-abayas",
    name: "Everyday Abayas",
    slug: "everyday-abayas",
    subcategories: [
      { id: "front-open", name: "Front Open Abayas", slug: "front-open-abayas" },
      { id: "pull-over", name: "Pull-over Closed Abayas", slug: "pull-over-closed-abayas" },
    ],
  },
  {
    id: "occasion-luxury",
    name: "Occasion & Luxury Abayas",
    slug: "occasion-luxury-abayas",
    subcategories: [
      { id: "hand-embroidered", name: "Hand-Embroidered Luxury", slug: "hand-embroidered-luxury" },
      { id: "bridal-velvet", name: "Bridal Velvet Abayas", slug: "bridal-velvet-abayas" },
    ],
  },
  {
    id: "jilbabs-khimars",
    name: "Jilbabs & Khimars",
    slug: "jilbabs-khimars",
    subcategories: [
      { id: "french-khimars", name: "French Khimars", slug: "french-khimars" },
    ],
  },
  {
    id: "hijabs-stoles",
    name: "Hijabs & Stoles",
    slug: "hijabs-stoles",
    subcategories: [
      { id: "malaysian-stoles", name: "Malaysian Instant Stoles", slug: "malaysian-instant-stoles" },
    ],
  },
];

const PRICE_RANGES = [
  { label: "All Prices", min: 0, max: Infinity },
  { label: "Under ₹2,000", min: 0, max: 2000 },
  { label: "₹2,000 – ₹5,000", min: 2000, max: 5000 },
  { label: "₹5,000 – ₹10,000", min: 5000, max: 10000 },
  { label: "Above ₹10,000", min: 10000, max: Infinity },
];

const SORT_OPTIONS = [
  { value: "popularity",  label: "Popularity" },
  { value: "price-asc",   label: "Price: Low to High" },
  { value: "price-desc",  label: "Price: High to Low" },
  { value: "rating",      label: "Customer Rating" },
  { value: "discount",    label: "Discount" },
  { value: "newest",      label: "New Arrivals" },
];

const ChevronDown = ({ open }: { open: boolean }) => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
    className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

export default function Category() {
  const router = useRouter();
  const { slug, q } = router.query;
  const [sortBy, setSortBy] = useState("popularity");
  const [sortOpen, setSortOpen] = useState(false);
  const [catalogItems, setCatalogItems] = useState<Product[]>(fallbackProducts);
  const [liveCategories, setLiveCategories] = useState(DEFAULT_CATEGORIES);
  const [priceRangeIndex, setPriceRangeIndex] = useState(0);
  const [minRating, setMinRating] = useState<number | null>(null);

  const categorySlug = Array.isArray(slug) ? slug[0] : slug ?? "all";
  const subcategorySlug = Array.isArray(slug) && slug.length > 1 ? slug[1] : undefined;
  const searchQuery = typeof q === "string" ? q.trim().toLowerCase() : "";

  // Fetch live categories from backend
  useEffect(() => {
    let isSubscribed = true;
    (async () => {
      try {
        const cats = await categoryAPI.getAll();
        if (isSubscribed && Array.isArray(cats) && cats.length > 0) {
          const formatted = cats.map(c => ({
            id: String(c.id),
            name: c.name,
            slug: c.slug || c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            subcategories: ((c.subcategories || c.children || []) as any[]).map(sc => ({
              id: String(sc.id),
              name: String(sc.name),
              slug: sc.slug || String(sc.name).toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            })),
          }));
          setLiveCategories(formatted);
        }
      } catch {
        // Keep DEFAULT_CATEGORIES
      }
    })();
    return () => {
      isSubscribed = false;
    };
  }, []);

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
        // Fallback to initial mock data
      }
    })();
    return () => {
      isSubscribed = false;
    };
  }, [categorySlug, searchQuery]);

  // Determine title display
  const categoryDisplay = useMemo(() => {
    if (searchQuery) return `Results for "${q}"`;
    if (categorySlug === "all") return "All Collections";
    
    const matchedCategory = liveCategories.find(c => c.slug === categorySlug || c.name.toLowerCase() === categorySlug.replace(/-/g, ' ').toLowerCase());
    if (subcategorySlug && matchedCategory) {
      const sub = matchedCategory.subcategories.find(sc => sc.slug === subcategorySlug);
      if (sub) return `${matchedCategory.name} — ${sub.name}`;
    }
    if (matchedCategory) return matchedCategory.name;

    return categorySlug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  }, [searchQuery, q, categorySlug, subcategorySlug, liveCategories]);

  // Filter products by category, subcategory, search query, price, rating
  const baseProducts = useMemo(() => {
    let list = catalogItems;

    // Search query filter
    if (searchQuery) {
      list = list.filter(p =>
        p.name.toLowerCase().includes(searchQuery) ||
        p.brand.toLowerCase().includes(searchQuery) ||
        p.category.toLowerCase().includes(searchQuery)
      );
      return list;
    }

    // Category / Subcategory filter
    if (categorySlug !== "all") {
      const targetSlug = categorySlug.toLowerCase();
      const targetSub = subcategorySlug?.toLowerCase();

      list = list.filter(p => {
        const catName = p.category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const brandName = p.brand.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const prodName = p.name.toLowerCase();

        const matchesCat = catName.includes(targetSlug) || brandName.includes(targetSlug) || prodName.includes(targetSlug.replace(/-/g, ' '));
        if (targetSub) {
          return matchesCat && prodName.includes(targetSub.replace(/-/g, ' '));
        }
        return matchesCat;
      });
      if (list.length === 0) list = catalogItems; // fallback if no specific match
    }

    // Price filter
    const activePrice = PRICE_RANGES[priceRangeIndex];
    if (activePrice && activePrice.max !== Infinity) {
      list = list.filter(p => p.price >= activePrice.min && p.price <= activePrice.max);
    } else if (activePrice && activePrice.min > 0) {
      list = list.filter(p => p.price >= activePrice.min);
    }

    // Rating filter
    if (minRating !== null) {
      list = list.filter(p => (p.rating || 0) >= minRating);
    }

    return list;
  }, [categorySlug, subcategorySlug, searchQuery, catalogItems, priceRangeIndex, minRating]);

  // Sort products
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

  const activeCategory = liveCategories.find(c => c.slug === categorySlug);

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
              <li role="listitem">
                <Link href="/category/all" className="hover:text-mb-primary transition-colors">
                  Collections
                </Link>
              </li>
              {categorySlug !== "all" && (
                <>
                  <li role="listitem" aria-hidden="true" className="text-mb-dusty">/</li>
                  <li role="listitem" className="text-mb-text font-semibold capitalize" aria-current="page">
                    {categoryDisplay}
                  </li>
                </>
              )}
            </ol>
          </nav>

          {/* Category Title */}
          <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3 border-b border-mb-border pb-4">
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-mb-text">
              {categoryDisplay}
              <span aria-hidden="true" className="font-sans text-xs font-normal text-mb-muted ml-2.5">
                ({sorted.length} {sorted.length === 1 ? "design" : "designs"})
              </span>
            </h1>
            {(priceRangeIndex !== 0 || minRating !== null) && (
              <button
                type="button"
                onClick={() => { setPriceRangeIndex(0); setMinRating(null); }}
                className="text-xs font-semibold text-[#5C1A24] hover:underline">
                Reset Filters
              </button>
            )}
          </div>

          {/* Main layout: filters sidebar + product grid */}
          <div className="flex gap-6 items-start">

            {/* Sidebar Filters */}
            <aside
              aria-label="Filter sidebar"
              className="hidden md:block flex-shrink-0 bg-mb-surface border border-mb-border rounded-[8px] shadow-card overflow-hidden"
              style={{ width: "240px", minWidth: "240px" }}>

              {/* Collections Navigation */}
              <div className="border-b border-mb-border p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#5C1A24] mb-3">
                  Categories
                </h3>
                <ul className="space-y-1.5 text-xs">
                  <li>
                    <Link
                      href="/category/all"
                      className={`block px-2.5 py-1.5 rounded-[6px] transition-colors ${
                        categorySlug === "all"
                          ? "bg-[#5C1A24] text-white font-medium"
                          : "text-mb-text hover:bg-mb-bg"
                      }`}>
                      All Collections
                    </Link>
                  </li>
                  {liveCategories.map(cat => {
                    const isSelected = categorySlug === cat.slug;
                    return (
                      <li key={cat.id || cat.slug}>
                        <Link
                          href={`/category/${cat.slug}`}
                          className={`block px-2.5 py-1.5 rounded-[6px] transition-colors ${
                            isSelected
                              ? "bg-[#5C1A24] text-white font-medium"
                              : "text-mb-text hover:bg-mb-bg"
                          }`}>
                          {cat.name}
                        </Link>
                        {/* Subcategories */}
                        {isSelected && cat.subcategories && cat.subcategories.length > 0 && (
                          <ul className="ml-3 mt-1 space-y-1 border-l-2 border-[#D29A90] pl-2 text-[11px]">
                            {cat.subcategories.map(sub => (
                              <li key={sub.id || sub.slug}>
                                <Link
                                  href={`/category/${cat.slug}/${sub.slug}`}
                                  className={`block py-1 hover:text-[#5C1A24] transition-colors ${
                                    subcategorySlug === sub.slug
                                      ? "text-[#5C1A24] font-bold"
                                      : "text-mb-muted"
                                  }`}>
                                  {sub.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Price Filter */}
              <div className="border-b border-mb-border p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#5C1A24] mb-3">
                  Price
                </h3>
                <div className="space-y-2 text-xs">
                  {PRICE_RANGES.map((range, idx) => (
                    <label key={range.label} className="flex items-center gap-2 cursor-pointer text-mb-text hover:text-mb-primary">
                      <input
                        type="radio"
                        name="price-filter"
                        checked={priceRangeIndex === idx}
                        onChange={() => setPriceRangeIndex(idx)}
                        className="accent-[#5C1A24] w-3.5 h-3.5 cursor-pointer"
                      />
                      <span>{range.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Rating Filter */}
              <div className="p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#5C1A24] mb-3">
                  Customer Rating
                </h3>
                <div className="space-y-2 text-xs">
                  {[4, 3].map(rating => (
                    <label key={rating} className="flex items-center gap-2 cursor-pointer text-mb-text hover:text-mb-primary">
                      <input
                        type="radio"
                        name="rating-filter"
                        checked={minRating === rating}
                        onChange={() => setMinRating(minRating === rating ? null : rating)}
                        className="accent-[#5C1A24] w-3.5 h-3.5 cursor-pointer"
                      />
                      <span className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={i < rating ? "text-[#C6A477]" : "text-mb-dusty"}>
                            ★
                          </span>
                        ))}
                        <span className="text-[11px] text-mb-muted ml-1">& above</span>
                      </span>
                    </label>
                  ))}
                  {minRating !== null && (
                    <button
                      type="button"
                      onClick={() => setMinRating(null)}
                      className="text-[11px] text-[#5C1A24] hover:underline pt-1 block">
                      Clear Rating
                    </button>
                  )}
                </div>
              </div>

            </aside>

            {/* Product grid */}
            <div className="flex-1 min-w-0">

              {/* Sort selector bar */}
              <div className="flex items-center justify-between bg-mb-surface border border-mb-border rounded-[8px] px-4 py-2.5 mb-6 shadow-card">
                <div className="text-xs text-mb-muted font-medium">
                  Showing <span className="font-bold text-mb-text">{sorted.length}</span> results
                </div>
                <div className="flex items-center gap-2">
                  <label htmlFor="sort-select" className="text-xs text-mb-muted font-medium">
                    Sort:
                  </label>
                  <select
                    id="sort-select"
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                    className="text-xs font-semibold bg-transparent text-[#5C1A24] border border-mb-border rounded-[6px] px-2.5 py-1.5 focus:outline-none focus:border-[#5C1A24] cursor-pointer">
                    {SORT_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {sorted.length === 0 ? (
                <div className="bg-mb-surface border border-mb-border rounded-[8px] shadow-card p-12 text-center">
                  <p className="text-sm text-mb-body font-medium">No designs found matching your selection.</p>
                  <button
                    onClick={() => { setPriceRangeIndex(0); setMinRating(null); }}
                    className="inline-block mt-4 text-xs font-semibold bg-[#5C1A24] hover:bg-[#42121B] text-white px-5 py-2.5 rounded-[8px] shadow-sm transition-colors">
                    Clear Filters
                  </button>
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
