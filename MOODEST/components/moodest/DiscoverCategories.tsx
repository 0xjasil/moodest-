import React, { useEffect, useState } from "react";
import Link from "next/link";
import { categoryAPI } from "@/lib/api";

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  image: string;
}

export default function DiscoverCategories() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isSubscribed = true;
    (async () => {
      try {
        setLoading(true);
        // Connect live to https://admin-moodest-25.vercel.app/products/categories-list (backed by /categories API)
        const data = await categoryAPI.getAll();
        if (!isSubscribed) return;
        const list = Array.isArray(data) ? data : Array.isArray((data as any)?.data) ? (data as any).data : [];
        if (list.length > 0) {
          const mapped: CategoryItem[] = list.map((cat: any) => ({
            id: String(cat.id),
            name: cat.name,
            slug: cat.slug || cat.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            // Use image uploaded in admin panel with clean fallback
            image:
              cat.image && typeof cat.image === "string" && cat.image.trim() !== ""
                ? cat.image.trim()
                : "/abaya/categories/classic-black.jpg",
          }));
          setCategories(mapped);
        } else {
          setCategories([]);
        }
      } catch (err) {
        console.warn("[DiscoverCategories] Failed to load categories from admin API:", err);
        if (isSubscribed) setCategories([]);
      } finally {
        if (isSubscribed) setLoading(false);
      }
    })();

    return () => {
      isSubscribed = false;
    };
  }, []);

  if (loading) {
    return (
      <section className="w-full px-3 sm:px-6 my-8" aria-label="Loading Abaya Categories">
        <div className="flex items-center justify-between mb-5">
          <div className="space-y-1">
            <div className="h-6 w-48 bg-mb-border/40 rounded animate-pulse" />
            <div className="h-4 w-72 bg-mb-border/30 rounded animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] rounded-[14px] bg-mb-surface border border-mb-border animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (categories.length === 0) return null;

  return (
    <section className="w-full px-3 sm:px-6 my-10" aria-label="Explore Abaya Categories">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-mb-text">
            Shop by Category
          </h2>
          <p className="text-xs sm:text-sm text-mb-muted mt-0.5">
            Signature Silhouettes — Syrian Collection, The Classics, Luxe Edit &amp; Occasion Wear
          </p>
        </div>
        <Link
          href="/category/all"
          className="text-xs sm:text-sm font-semibold text-mb-primary hover:text-mb-primary-hover flex items-center gap-1 transition-colors group"
        >
          <span>Discover More</span> <span className="transition-transform group-hover:translate-x-1">→</span>
        </Link>
      </div>

      {/* Single Line Fill with Enhanced Height and Large Rounded Corners */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4.5">
        {categories.map((cat) => {
          const href = `/category/${cat.slug || cat.id}`;
          return (
            <Link
              key={cat.id || cat.slug}
              href={href}
              className="group block overflow-hidden rounded-[14px] sm:rounded-[18px] bg-mb-surface border border-mb-border shadow-card hover:shadow-dropdown hover:-translate-y-1 transition-all duration-300"
            >
              <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#EEE4D8]">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.src.includes("/abaya/categories/classic-black.jpg")) {
                      target.src = "/abaya/categories/classic-black.jpg";
                    }
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent flex flex-col justify-end p-3.5 sm:p-4">
                  <span className="text-white font-serif text-sm sm:text-base font-semibold group-hover:text-[#D29A90] transition-colors drop-shadow-sm leading-tight">
                    {cat.name}
                  </span>
                  <span className="text-[11px] text-white/80 font-sans mt-1 inline-flex items-center gap-1 group-hover:underline">
                    Explore Collection →
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
