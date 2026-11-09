import React from "react";
import Link from "next/link";

const GALLERY_TILES = [
  {
    image: "/abaya/hero/hero-4.jpg",
    title: "Occasion Silk Satin",
    subtitle: "Fluid Drapes & Opulent Sheen",
    href: "/category/occasion-wear",
  },
  {
    image: "/abaya/hero/hero-5.jpg",
    title: "Artisanal Velvet & Lace",
    subtitle: "Embroidered Midnight Silhouettes",
    href: "/category/syrian-collection",
  },
  {
    image: "/abaya/hero/hero-6.jpg",
    title: "Tailored Open Fronts",
    subtitle: "Minimalist Modern Cutaways",
    href: "/category/open-abaya-edit",
  },
];

export default function EditorialGalleryBanner() {
  return (
    <section className="w-full my-12" aria-label="Editorial Gallery">
      {/* Full viewport width editorial section */}
      <div className="w-full bg-[#111] text-white py-10 sm:py-14 px-3 sm:px-6">
        <div className="max-w-content mx-auto mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <span className="text-[10px] sm:text-xs text-[#D29A90] font-sans uppercase tracking-[0.25em] font-semibold block mb-1">
              Curated Craftsmanship
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-semibold text-white">
              The Atelier Gallery
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-xl">
              Hand-finished silhouettes draped in pure Japanese Nida, breathable Cey crepe, and bespoke embroidery.
            </p>
          </div>
          <Link
            href="/category/all"
            className="text-xs sm:text-sm font-semibold text-[#D29A90] hover:text-white transition-colors inline-flex items-center gap-1 group whitespace-nowrap"
          >
            <span>Explore All Couture</span>
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </div>

        {/* 3 High-Fashion Portrait Tiles */}
        <div className="max-w-content mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4">
          {GALLERY_TILES.map((tile, i) => (
            <Link
              key={i}
              href={tile.href}
              className="group relative block overflow-hidden rounded-[8px] bg-neutral-900 border border-white/10 aspect-[4/5] shadow-lg hover:shadow-2xl transition-all"
            >
              <img
                src={tile.image}
                alt={tile.title}
                className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.src.includes("/banners/timeless-beauty-banner.jpg")) {
                    target.src = "/banners/timeless-beauty-banner.jpg";
                  }
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent flex flex-col justify-end p-5">
                <span className="font-serif text-base sm:text-lg font-semibold text-white group-hover:text-[#D29A90] transition-colors">
                  {tile.title}
                </span>
                <span className="text-xs text-gray-300 font-sans mt-0.5">
                  {tile.subtitle}
                </span>
                <span className="text-[11px] text-[#D29A90] font-semibold font-sans mt-2 inline-flex items-center gap-1 group-hover:underline">
                  Discover Lookbook →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

