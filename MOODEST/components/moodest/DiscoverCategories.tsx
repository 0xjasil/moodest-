import React from "react";
import Link from "next/link";
// @ts-ignore
import { category as abayaCategories } from "@/data/TopBrands";

export default function DiscoverCategories() {
  const categories = (abayaCategories || []) as Array<{
    img: string;
    offer: string;
    slug?: string;
  }>;

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

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4">
        {categories.slice(0, 12).map((cat, i) => {
          const href = `/category/${cat.slug || cat.offer.toLowerCase().replace(/\s+/g, "-")}`;
          return (
            <Link
              key={i}
              href={href}
              className="group block overflow-hidden rounded-[10px] sm:rounded-[12px] bg-mb-surface border border-mb-border shadow-card hover:shadow-dropdown hover:-translate-y-1 transition-all duration-300"
            >
              <div className="relative aspect-[287/322] w-full overflow-hidden bg-[#EEE4D8]">
                <img
                  src={cat.img}
                  alt={cat.offer}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.src.includes("/abaya/categories/front-open.jpg")) {
                      target.src = "/abaya/categories/front-open.jpg";
                    }
                  }}
                />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
