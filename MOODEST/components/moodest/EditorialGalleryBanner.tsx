import React from "react";
import Link from "next/link";

export default function EditorialGalleryBanner() {
  return (
    <section
      className="w-full px-3 sm:px-6 my-12 sm:my-20 relative block clear-both"
      aria-label="Signature Visual Gallery"
    >
      {/* 
        Reference Asymmetric 2-Column Mosaic Gallery (Mobile-First):
        - Left Column (50%): 1 Tall vertical card spanning full gallery height
        - Right Column (50%): 2 Stacked cards (top & bottom)
      */}
      <div className="w-full grid grid-cols-2 gap-2.5 sm:gap-4.5 h-[380px] sm:h-[480px] md:h-[580px] lg:h-[660px]">
        
        {/* Column 1: Left Tall Vertical Card (Reference: Full-height door portrait) */}
        <div className="h-full">
          <Link
            href="/category/syrian-collection"
            className="group relative block w-full h-full overflow-hidden rounded-[20px] sm:rounded-[28px] bg-neutral-100 shadow-sm hover:shadow-xl transition-all duration-300"
            aria-label="Explore Syrian Collection"
          >
            <img
              src="/abaya/hero/hero-6.jpg"
              alt="Syrian Collection — Modest Silhouettes & Artisanal Handwork | Modest Studio"
              className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.includes("/banners/top-promo-banner.jpg")) {
                  target.src = "/banners/top-promo-banner.jpg";
                }
              }}
            />
            {/* Gradient & Floating Circular Arrow Button */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end justify-between p-3.5 sm:p-5">
              <span className="font-serif text-sm sm:text-lg font-semibold text-white drop-shadow-md pr-2">
                Syrian Edits
              </span>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white text-neutral-900 shadow-lg flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        </div>

        {/* Column 2: Right 2 Stacked Cards (Reference: Top silk abayas, Bottom terracotta arch) */}
        <div className="flex flex-col gap-2.5 sm:gap-4.5 h-full">
          
          {/* Top Card */}
          <Link
            href="/category/the-classics"
            className="group flex-1 relative block w-full h-full overflow-hidden rounded-[20px] sm:rounded-[28px] bg-neutral-100 shadow-sm hover:shadow-xl transition-all duration-300"
            aria-label="Explore The Classics Collection"
          >
            <img
              src="/abaya/hero/hero-2.jpg"
              alt="The Classics — Silk & Midnight Nida Classic Abayas | Modest Studio"
              className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.includes("/banners/category-highlights-banner.jpg")) {
                  target.src = "/banners/category-highlights-banner.jpg";
                }
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end justify-between p-3.5 sm:p-5">
              <span className="font-serif text-sm sm:text-base font-semibold text-white drop-shadow-md pr-2">
                The Classics
              </span>
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-white text-neutral-900 shadow-md flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110">
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>

          {/* Bottom Card */}
          <Link
            href="/category/the-luxe-edit"
            className="group flex-1 relative block w-full h-full overflow-hidden rounded-[20px] sm:rounded-[28px] bg-neutral-100 shadow-sm hover:shadow-xl transition-all duration-300"
            aria-label="Explore The Luxe Edit"
          >
            <img
              src="/abaya/hero/hero-3.jpg"
              alt="The Luxe Edit — Earth Tones & Silk Organza Edits | Modest Studio"
              className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.includes("/banners/timeless-beauty-banner.jpg")) {
                  target.src = "/banners/timeless-beauty-banner.jpg";
                }
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end justify-between p-3.5 sm:p-5">
              <span className="font-serif text-sm sm:text-base font-semibold text-white drop-shadow-md pr-2">
                The Luxe Edit
              </span>
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-white text-neutral-900 shadow-md flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110">
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>

        </div>

      </div>
    </section>
  );
}
