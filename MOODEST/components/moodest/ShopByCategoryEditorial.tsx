import React, { useEffect, useState } from "react";
import Link from "next/link";
import { categoryAPI } from "@/lib/api";

interface CategoryCard {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  image: string;
  itemCount?: number;
}

export default function ShopByCategoryEditorial() {
  const [categories, setCategories] = useState<CategoryCard[]>([
    {
      id: "syrian-collection",
      name: "Syrian Collection & Classics",
      slug: "syrian-collection",
      tagline: "Handcrafted heritage embroidery in midnight Nida and Crepe",
      image: "/abaya/categories/handwork-abaya.jpg",
      itemCount: 24,
    },
    {
      id: "the-luxe-edit",
      name: "The Luxe Edit & Occasion Wear",
      slug: "the-luxe-edit",
      tagline: "Opulent silk satin, layered shrugs, and crystal celebration silhouettes",
      image: "/abaya/categories/silk-satin.jpg",
      itemCount: 19,
    },
  ]);

  useEffect(() => {
    let isSubscribed = true;
    (async () => {
      try {
        const data = await categoryAPI.getAll();
        if (!isSubscribed || !data) return;
        const list = Array.isArray(data) ? data : Array.isArray((data as any)?.data) ? (data as any).data : [];
        if (list.length >= 2) {
          const firstTwo: CategoryCard[] = [
            {
              id: list[0].id || "cat-1",
              name: list[0].name || "Syrian Collection",
              slug: list[0].slug || "syrian-collection",
              tagline: list[0].description || "Handcrafted heritage embroidery in midnight Nida",
              image: list[0].image && !list[0].image.includes("unsplash") ? list[0].image : "/abaya/categories/handwork-abaya.jpg",
              itemCount: list[0].totalProducts || 24,
            },
            {
              id: list[1].id || "cat-2",
              name: list[1].name || "The Luxe Edit",
              slug: list[1].slug || "the-luxe-edit",
              tagline: list[1].description || "Opulent silk satin and crystal celebration silhouettes",
              image: list[1].image && !list[1].image.includes("unsplash") ? list[1].image : "/abaya/categories/silk-satin.jpg",
              itemCount: list[1].totalProducts || 19,
            },
          ];
          setCategories(firstTwo);
        }
      } catch (err) {
        console.warn("[ShopByCategoryEditorial] Failed to fetch dynamic categories:", err);
      }
    })();

    return () => {
      isSubscribed = false;
    };
  }, []);

  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 py-10 md:py-14" aria-labelledby="shop-by-category-heading">
      <div className="mx-auto max-w-content">
        {/* Section Header — Theenby3 inspired typography & spacing */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-8 md:mb-10">
          <div>
            <h2 id="shop-by-category-heading" className="font-serif text-2xl sm:text-3xl lg:text-4xl font-semibold text-mb-text tracking-tight">
              Shop by Category
            </h2>
            <p className="text-xs sm:text-sm text-mb-muted mt-1.5 max-w-xl font-normal">
              Explore our curated collections and find styles that match your personality.
            </p>
          </div>
          <Link
            href="/category/all"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-mb-accent-deep hover:text-mb-primary transition-colors self-start sm:self-auto group"
          >
            <span>Discover More</span>
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </div>

        {/* 2 Large Editorial Visual Image Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {categories.map((cat, idx) => (
            <Link
              key={cat.id || idx}
              href={`/category/${cat.slug || cat.id}`}
              className="group relative block overflow-hidden rounded-2xl bg-[#EDE4DB] border border-mb-border/40 shadow-sm transition-all duration-500 hover:shadow-xl hover:-translate-y-1"
            >
              {/* Image Frame with Zoom Transition */}
              <div className="relative aspect-[4/3] sm:aspect-[16/11] lg:aspect-[16/10] w-full overflow-hidden">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.src.includes("/abaya/categories/classic-black.jpg")) {
                      target.src = idx === 0 ? "/abaya/categories/classic-black.jpg" : "/abaya/categories/silk-satin.jpg";
                    }
                  }}
                />

                {/* Subtle Editorial Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent transition-opacity duration-300 group-hover:from-black/85" />

                {/* Card Content Overlay */}
                <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 flex flex-col justify-end text-white">
                  <div className="flex items-center justify-between gap-3 mb-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-mb-gold">
                      Curated Edit {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                    </span>
                    <span className="text-[11px] text-white/70 font-medium bg-black/30 backdrop-blur-xs px-2.5 py-1 rounded-full border border-white/10">
                      Explore Silhouette
                    </span>
                  </div>

                  <h3 className="font-serif text-xl sm:text-2xl lg:text-3xl font-semibold text-white tracking-wide group-hover:text-mb-gold transition-colors">
                    {cat.name}
                  </h3>

                  <p className="text-xs sm:text-sm text-white/80 line-clamp-1 mt-1 font-light max-w-md">
                    {cat.tagline}
                  </p>

                  <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between">
                    <span className="text-xs font-semibold text-white/90 group-hover:text-white transition-colors">
                      Shop Now
                    </span>
                    <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white group-hover:bg-mb-gold group-hover:text-mb-primary transition-all duration-300 group-hover:translate-x-1">
                      →
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
