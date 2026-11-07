import React from "react";
import Link from "next/link";
// @ts-ignore
import { topBrands } from "@/data/TopBrands";

export default function TopBrandsSection() {
  const brands = (topBrands || []) as Array<{
    name: string;
    img: string;
    offer: string;
    description: string;
  }>;

  return (
    <section className="w-full px-3 sm:px-6 my-8" aria-label="Explore Our Top Brands">
      <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-mb-text mb-6 text-left">
        Explore Maison &amp; Premier Brands
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {brands.map((brand, i) => (
          <Link
            key={i}
            href={`/category/${brand.name.toLowerCase().replace(/\s+/g, "-")}`}
            className="group flex flex-col bg-mb-surface rounded-[4px] sm:rounded-[6px] border border-mb-border shadow-card hover:shadow-dropdown transition-all overflow-hidden p-3.5"
          >
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[4px] bg-mb-surface mb-3">
              <img
                src={brand.img}
                alt={brand.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (!target.src.includes("/abaya/brands/modest-studio.jpg")) {
                        target.src = "/abaya/brands/modest-studio.jpg";
                      }
                    }} />
            </div>
            <div className="flex flex-col flex-1 justify-between">
              <div>
                <h3 className="font-serif text-base sm:text-lg font-semibold text-mb-text leading-snug">
                  {brand.offer}
                </h3>
                <p className="text-xs sm:text-sm text-mb-body mt-1 line-clamp-2">
                  {brand.description}
                </p>
              </div>
              <span className="text-xs font-semibold text-mb-primary group-hover:text-mb-primary-hover mt-3 transition-colors flex items-center gap-1">
                Shop {brand.name} <span>→</span>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
