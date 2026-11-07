import React from "react";
import Link from "next/link";
// @ts-ignore
import { radar } from "@/data/TopBrands";

export default function RadarSection() {
  const items = (radar || []) as Array<{
    img: string;
    offer: string;
    description: string;
    link?: string;
  }>;

  return (
    <section className="w-full px-3 sm:px-6 my-8" aria-label="On Our Radar">
      <div className="mb-6">
        <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-mb-text text-left">
          On Our Radar
        </h2>
        <p className="text-xs sm:text-sm font-medium text-mb-muted mt-1">
          Handpicked Highlights &amp; Coveted Finds
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5 sm:gap-4">
        {items.slice(0, 10).map((el, i) => {
          const href = el.link || "/category/all";
          return (
            <Link
              key={i}
              href={href}
              className="group flex flex-col bg-mb-surface rounded-[12px] border border-mb-border shadow-card hover:shadow-dropdown transition-all p-3.5 text-center"
            >
              <div className="relative aspect-square w-full overflow-hidden rounded-[8px] bg-mb-surface mb-2.5 flex items-center justify-center">
                <img
                  src={el.img}
                  alt={el.description}
                  className="w-full h-full object-contain p-2 transition-transform duration-500 group-hover:scale-105"
                
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (!target.src.includes("/abaya/products/abaya-1.jpg")) {
                        target.src = "/abaya/products/abaya-1.jpg";
                      }
                    }} />
              </div>
              <h3 className="font-serif text-sm font-semibold text-mb-text group-hover:text-mb-primary transition-colors leading-tight">
                {el.offer}
              </h3>
              <p className="text-xs text-mb-body mt-1 line-clamp-1">
                {el.description}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
