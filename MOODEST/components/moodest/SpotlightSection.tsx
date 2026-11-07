import React from "react";
import Link from "next/link";

const spotlightItems = [
  { img: "/abaya/categories/classic-black.jpg", name: "Classic Black", slug: "classic-black" },
  { img: "/abaya/categories/front-open.jpg", name: "Front Open", slug: "front-open" },
  { img: "/abaya/categories/double-shrug.jpg", name: "Double Shrug", slug: "double-shrug" },
  { img: "/abaya/categories/embroidery-abaya.jpg", name: "Embroidery", slug: "embroidery-abaya" },
  { img: "/abaya/categories/daily-wear.jpg", name: "Daily Wear", slug: "daily-wear" },
  { img: "/abaya/categories/basic-kaftan.jpg", name: "Basic Kaftans", slug: "basic-kaftan" },
  { img: "/abaya/categories/hijabs-stoles.jpg", name: "Chiffon Stoles", slug: "hijabs-stoles" }
];

export default function SpotlightSection() {
  return (
    <section className="w-full px-3 sm:px-6 my-8" aria-label="In The Spotlight">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-mb-text">
            In The Spotlight
          </h2>
          <p className="text-xs sm:text-sm font-medium text-mb-muted mt-0.5">
            Luxury Handwork, Embroidery &amp; Coordinated Modest Sets
          </p>
        </div>
        <Link
          href="/category/all"
          className="text-xs sm:text-sm font-semibold text-mb-primary hover:text-mb-primary-hover flex items-center gap-1 transition-colors"
        >
          View All <span>→</span>
        </Link>
      </div>

      {/* Hero Banner with text — Responsive natural fit */}
      <div className="relative overflow-hidden rounded-[6px] md:rounded-[8px] shadow-card mb-6 group border border-mb-border">
        <Link href="/category/all" className="block">
          <img
            src="/banners/timeless-beauty-banner.jpg"
            alt="In The Spotlight Modest Wear"
            className="w-full h-auto max-h-[360px] object-cover object-center transition-transform duration-500 group-hover:scale-[1.01]"
            onError={(e) => {
              const target = e.currentTarget;
              if (!target.src.includes("/banners/top-promo-banner.jpg")) {
                target.src = "/banners/top-promo-banner.jpg";
              }
            }}
          />
          <div className="absolute bottom-4 left-4 bg-mb-primary/95 text-mb-bg px-5 py-3 rounded-[4px] md:rounded-[6px] shadow-card border border-mb-primary-hover">
            <p className="font-serif text-lg sm:text-xl font-bold leading-tight text-mb-bg">Up To 30% Off</p>
            <p className="text-xs text-mb-gold font-medium mt-0.5 uppercase tracking-wider">On Sanctuary Must-Haves</p>
          </div>
        </Link>
      </div>

      {/* Item Grid matching Ovais portrait card style */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 sm:gap-4">
        {spotlightItems.map((item, idx) => (
          <Link
            key={idx}
            href={`/category/${item.slug}`}
            className="group block overflow-hidden rounded-[4px] sm:rounded-[6px] bg-mb-surface border border-mb-border shadow-card hover:shadow-dropdown hover:-translate-y-1 transition-all duration-300"
          >
            <div className="relative aspect-[287/322] w-full overflow-hidden bg-[#EEE4D8]">
              <img
                src={item.img}
                alt={item.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.src.includes("/abaya/categories/classic-black.jpg")) {
                    target.src = "/abaya/categories/classic-black.jpg";
                  }
                }}
              />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
