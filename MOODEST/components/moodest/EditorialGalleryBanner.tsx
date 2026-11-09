import React from "react";
import Link from "next/link";

export default function EditorialGalleryBanner() {
  return (
    <section className="w-full px-3 sm:px-6 my-16 sm:my-24 relative block clear-both" aria-label="Signature Visual Gallery">
      {/* Full Viewport Height & Width Reference Mosaic Gallery */}
      <div className="w-full h-auto grid grid-cols-1 md:grid-cols-12 gap-3.5 sm:gap-4.5">
        
        {/* Column 1: Left Tall Vertical Card (Reference: Two women by doorway with circular arrow button) */}
        <div className="md:col-span-4 h-[420px] sm:h-[480px] md:h-[620px] lg:h-[680px]">
          <Link
            href="/category/syrian-collection"
            className="group relative block w-full h-full overflow-hidden rounded-[20px] sm:rounded-[24px] bg-neutral-100 shadow-sm hover:shadow-xl transition-all"
            aria-label="Explore Syrian Collection"
          >
            <img
              src="/abaya/hero/hero-6.jpg"
              alt="Syrian Collection — Modest Silhouettes"
              className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.includes("/banners/top-promo-banner.jpg")) {
                  target.src = "/banners/top-promo-banner.jpg";
                }
              }}
            />
            {/* Gradient & Floating Circular Arrow Button */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent flex items-end justify-between p-5">
              <span className="font-serif text-base sm:text-lg font-semibold text-white drop-shadow-md">
                Syrian Edits
              </span>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white text-neutral-900 shadow-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        </div>

        {/* Column 2: Center 2 Stacked Cards (Reference: Top silk abayas, Bottom terracotta arch) */}
        <div className="md:col-span-4 flex flex-col gap-3.5 sm:gap-4.5 h-[500px] sm:h-[580px] md:h-[620px] lg:h-[680px]">
          {/* Top Card */}
          <Link
            href="/category/the-classics"
            className="group flex-1 relative block w-full h-full overflow-hidden rounded-[20px] sm:rounded-[24px] bg-neutral-100 shadow-sm hover:shadow-xl transition-all"
            aria-label="Explore The Classics Collection"
          >
            <img
              src="/abaya/hero/hero-2.jpg"
              alt="The Classics — Silk & Midnight Nida"
              className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.includes("/banners/category-highlights-banner.jpg")) {
                  target.src = "/banners/category-highlights-banner.jpg";
                }
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent flex items-end justify-between p-4 sm:p-5">
              <span className="font-serif text-base font-semibold text-white drop-shadow-md">
                The Classics
              </span>
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white text-neutral-900 shadow-md flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>

          {/* Bottom Card */}
          <Link
            href="/category/the-luxe-edit"
            className="group flex-1 relative block w-full h-full overflow-hidden rounded-[20px] sm:rounded-[24px] bg-neutral-100 shadow-sm hover:shadow-xl transition-all"
            aria-label="Explore The Luxe Edit"
          >
            <img
              src="/abaya/hero/hero-3.jpg"
              alt="The Luxe Edit — Earth Tones & Arches"
              className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.includes("/banners/timeless-beauty-banner.jpg")) {
                  target.src = "/banners/timeless-beauty-banner.jpg";
                }
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent flex items-end justify-between p-4 sm:p-5">
              <span className="font-serif text-base font-semibold text-white drop-shadow-md">
                The Luxe Edit
              </span>
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white text-neutral-900 shadow-md flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        </div>

        {/* Column 3: Right Tall Vertical Card (Reference: Woman in red gingham with floating circular button) */}
        <div className="md:col-span-4 h-[420px] sm:h-[480px] md:h-[620px] lg:h-[680px]">
          <Link
            href="/category/occasion-wear"
            className="group relative block w-full h-full overflow-hidden rounded-[20px] sm:rounded-[24px] bg-neutral-100 shadow-sm hover:shadow-xl transition-all"
            aria-label="Explore Occasion Wear"
          >
            <img
              src="/abaya/hero/hero-4.jpg"
              alt="Occasion Wear — Bespoke Celebratory Cuts"
              className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.includes("/banners/top-promo-banner.jpg")) {
                  target.src = "/banners/top-promo-banner.jpg";
                }
              }}
            />
            {/* Gradient & Floating Circular Arrow Button */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent flex items-end justify-between p-5">
              <span className="font-serif text-base sm:text-lg font-semibold text-white drop-shadow-md">
                Occasion Wear
              </span>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white text-neutral-900 shadow-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        </div>

      </div>
    </section>
  );
}
