import React from "react";
import Link from "next/link";

interface NewArrivalCard {
  tag: string;
  title: string;
  subtitle: string;
  ctaText: string;
  href: string;
  image: string;
}

const CARDS: NewArrivalCard[] = [
  {
    tag: "FEATURED COLLECTION • AUTUMN / WINTER",
    title: "Double Shrug & Layered Silhouettes",
    subtitle: "Fluid coordinating inner slips matched with richly textured outer abaya coats.",
    ctaText: "Explore The Drop",
    href: "/category/the-classics",
    image: "/abaya/hero/hero-6.jpg",
  },
  {
    tag: "NEW ARRIVAL • CAPSULE EDIT",
    title: "Fluid Bisht Kaftans & Royal Kimonos",
    subtitle: "Dramatic sleeves in Korean satin and breathable matte Cey for effortless modest grace.",
    ctaText: "Shop Collection",
    href: "/category/kimono-kaftan",
    image: "/abaya/hero/hero-7.jpg",
  },
];

export default function NewArrivalsEditorial() {
  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 py-10 md:py-14 bg-mb-surface/50 border-t border-b border-mb-border/30" aria-labelledby="new-arrivals-heading">
      <div className="mx-auto max-w-content">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-8 md:mb-10">
          <div>
            <h2 id="new-arrivals-heading" className="font-serif text-2xl sm:text-3xl lg:text-4xl font-semibold text-mb-text tracking-tight">
              New Arrivals
            </h2>
            <p className="text-xs sm:text-sm text-mb-muted mt-1.5 max-w-xl font-normal">
              Discover the latest additions to our collection, thoughtfully selected for you.
            </p>
          </div>
          <Link
            href="/category/all"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-mb-accent-deep hover:text-mb-primary transition-colors self-start sm:self-auto group"
          >
            <span>View All New In</span>
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </div>

        {/* 2 Large Portrait Editorial Image Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {CARDS.map((card, idx) => (
            <Link
              key={idx}
              href={card.href}
              className="group relative block overflow-hidden rounded-2xl bg-[#EDE4DB] border border-mb-border/40 shadow-sm transition-all duration-500 hover:shadow-xl hover:-translate-y-1"
            >
              {/* Portrait Image Frame */}
              <div className="relative aspect-[4/5] sm:aspect-[3/4] lg:aspect-[4/5] w-full overflow-hidden">
                <img
                  src={card.image}
                  alt={card.title}
                  className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.src.includes("/abaya/hero/hero-1.jpg")) {
                      target.src = idx === 0 ? "/abaya/hero/hero-1.jpg" : "/abaya/hero/hero-3.jpg";
                    }
                  }}
                />

                {/* Subtle Luxury Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent transition-opacity duration-300 group-hover:from-black/90" />

                {/* Top Badge */}
                <div className="absolute top-4 left-4 sm:top-6 sm:left-6">
                  <span className="inline-block px-3 py-1 text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest text-mb-bg bg-black/40 backdrop-blur-md rounded-full border border-white/15">
                    {card.tag}
                  </span>
                </div>

                {/* Bottom Content Overlay */}
                <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 text-white">
                  <h3 className="font-serif text-xl sm:text-2xl lg:text-3xl font-semibold tracking-wide text-white group-hover:text-mb-gold transition-colors">
                    {card.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-white/80 font-light mt-1.5 line-clamp-2 max-w-lg">
                    {card.subtitle}
                  </p>

                  <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-full bg-white text-mb-primary group-hover:bg-mb-gold group-hover:text-mb-primary transition-all duration-300 shadow-sm">
                    <span>{card.ctaText}</span>
                    <span className="transition-transform group-hover:translate-x-1">→</span>
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
