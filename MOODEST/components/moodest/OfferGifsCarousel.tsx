import React, { useRef } from "react";
import Link from "next/link";

const gifBanners = [
  { img: "/abaya/hero/hero-1.jpg", title: "New Season Drops", link: "/category/all" },
  { img: "/abaya/hero/hero-2.jpg", title: "Two-Piece Sets", link: "/category/all" },
  { img: "/abaya/hero/hero-3.jpg", title: "Breathable Linen", link: "/category/all" },
  { img: "/abaya/hero/hero-4.jpg", title: "Festive Occasion", link: "/category/all" },
  { img: "/abaya/hero/hero-5.jpg", title: "Luxury Velvet Edits", link: "/category/all" }
];

export default function OfferGifsCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const offset = direction === "left" ? -280 : 280;
    scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
  };

  return (
    <div className="relative w-full px-3 sm:px-6 my-6">
      <div className="relative group">
        <button
          onClick={() => scroll("left")}
          aria-label="Previous offers"
          className="absolute left-1 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-mb-bg shadow-card border border-mb-border text-mb-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 hover:bg-mb-surface hover:scale-105"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth py-1"
        >
          {gifBanners.map((banner, idx) => (
            <Link
              key={idx}
              href={banner.link}
              className="flex-1 min-w-[220px] sm:min-w-[260px] rounded-[4px] sm:rounded-[6px] overflow-hidden border border-mb-border shadow-card hover:shadow-dropdown transition-all hover:-translate-y-0.5 bg-mb-surface"
            >
              <img
                src={banner.img}
                alt={banner.title}
                className="w-full h-auto object-cover rounded-[4px] sm:rounded-[6px]"
              
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (!target.src.includes("/abaya/hero/hero-1.jpg")) {
                        target.src = "/abaya/hero/hero-1.jpg";
                      }
                    }} />
            </Link>
          ))}
        </div>

        <button
          onClick={() => scroll("right")}
          aria-label="Next offers"
          className="absolute right-1 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-mb-bg shadow-card border border-mb-border text-mb-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 hover:bg-mb-surface hover:scale-105"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
