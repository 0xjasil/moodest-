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
        const data = await categoryAPI.getAll();
        if (!isSubscribed) return;
        const list = Array.isArray(data) ? data : Array.isArray((data as any)?.data) ? (data as any).data : [];
        if (list.length > 0) {
          const mapped: CategoryItem[] = list.map((cat: any) => ({
            id: String(cat.id),
            name: cat.name,
            slug: cat.slug || cat.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            image: cat.image || "/banners/category-highlights-banner.jpg",
          }));
          setCategories(mapped);
        } else {
          setCategories([]);
        }
      } catch (err) {
        console.warn("[DiscoverCategories] Failed to load categories:", err);
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
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] rounded-[8px] bg-mb-surface border border-mb-border animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (categories.length === 0) return null;

  return (
    <section className="w-full px-3 sm:px-6 my-8" aria-label="Explore Abaya Categories">
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
          className="text-xs sm:text-sm font-semibold text-mb-primary hover:text-mb-primary-hover flex items-center gap-1 transition-colors"
        >
          View All <span>→</span>
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
        {categories.map((cat) => {
          const href = `/category/${cat.slug || cat.id}`;
          return (
            <Link
              key={cat.id || cat.slug}
              href={href}
              className="group block overflow-hidden rounded-[8px] bg-mb-surface border border-mb-border shadow-card hover:shadow-dropdown hover:-translate-y-1 transition-all duration-300"
            >
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#EEE4D8]">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.src.includes("unsplash.com")) {
                      target.src = "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80";
                    }
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-3.5">
                  <span className="text-white font-serif text-sm sm:text-base font-semibold group-hover:text-[#D29A90] transition-colors drop-shadow-sm">
                    {cat.name}
                  </span>
                  <span className="text-[11px] text-white/80 font-sans mt-0.5 inline-flex items-center gap-1">
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
