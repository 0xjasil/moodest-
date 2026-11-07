import React, { useEffect, useState } from "react";
import Link from "next/link";
import { categoryAPI } from "@/lib/api";

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  image: string;
}

const FALLBACK_CATEGORIES: CategoryItem[] = [
  {
    id: "everyday-abayas",
    name: "Everyday Abayas",
    slug: "everyday-abayas",
    image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "occasion-luxury-abayas",
    name: "Occasion & Luxury Abayas",
    slug: "occasion-luxury-abayas",
    image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "jilbabs-khimars",
    name: "Jilbabs & Khimars",
    slug: "jilbabs-khimars",
    image: "https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "hijabs-stoles",
    name: "Hijabs & Stoles",
    slug: "hijabs-stoles",
    image: "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&w=800&q=80",
  },
];

export default function DiscoverCategories() {
  const [categories, setCategories] = useState<CategoryItem[]>(FALLBACK_CATEGORIES);

  useEffect(() => {
    let isSubscribed = true;
    (async () => {
      try {
        const data = await categoryAPI.getAll();
        if (!isSubscribed || !data) return;
        const list = Array.isArray(data) ? data : Array.isArray((data as any)?.data) ? (data as any).data : [];
        if (list.length > 0) {
          const mapped: CategoryItem[] = list.map((cat: any) => ({
            id: String(cat.id),
            name: cat.name,
            slug: cat.slug || cat.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            image: cat.image || "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80",
          }));
          setCategories(mapped);
        }
      } catch {
        // Retain fallback abaya categories on network failure
      }
    })();

    return () => {
      isSubscribed = false;
    };
  }, []);

  return (
    <section className="w-full px-3 sm:px-6 my-8" aria-label="Explore Abaya Categories">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-mb-text">
            Shop by Category
          </h2>
          <p className="text-xs sm:text-sm text-mb-muted mt-0.5">
            Signature Silhouettes — Front Open, Double Shrug, Kaftans &amp; Bridal Edits
          </p>
        </div>
        <Link
          href="/category/all"
          className="text-xs sm:text-sm font-semibold text-mb-primary hover:text-mb-primary-hover flex items-center gap-1 transition-colors"
        >
          View All <span>→</span>
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3.5 sm:gap-4">
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
