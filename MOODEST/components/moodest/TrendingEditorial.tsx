import React from "react";
import Link from "next/link";

interface TrendingEditorialCard {
  tag: string;
  title: string;
  description: string;
  ctaText: string;
  href: string;
  image: string;
  colSpan: string;
}

const EDITORIAL_CARDS: TrendingEditorialCard[] = [
  {
    tag: "STORYTELLING • COVETED SILHOUETTE",
    title: "The Signature Open Abaya Silhouette",
    description: "Celebrated for its fluid drape and versatile layering. Designed in pure matte Korean Nida with bespoke button closures.",
    ctaText: "Shop The Edit",
    href: "/category/open-abaya-edit",
    image: "/abaya/hero/hero-2.jpg",
    colSpan: "lg:col-span-7",
  },
  {
    tag: "LIMITED RUN • ARTISAN WEAVING",
    title: "Embroidered Evening Radiance",
    description: "Hand-finished with tonal beadwork and shimmering lapel details for timeless celebratory presence.",
    ctaText: "Explore Evening Wear",
    href: "/category/occasion-wear",
    image: "/abaya/hero/hero-4.jpg",
    colSpan: "lg:col-span-5",
  },
];

export default function TrendingEditorial() {
  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 py-10 md:py-16 bg-[#EDE5DC]/40 border-t border-mb-border/30" aria-labelledby="trending-editorial-heading">
      <div className="mx-auto max-w-content">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-8 md:mb-10">
          <div>
            <h2 id="trending-editorial-heading" className="font-serif text-2xl sm:text-3xl lg:text-4xl font-semibold text-mb-text tracking-tight">
              Trending Now
            </h2>
            <p className="text-xs sm:text-sm text-mb-muted mt-1.5 max-w-xl font-normal">
              Explore the styles everyone is loving right now.
            </p>
          </div>
          <Link
            href="/category/all"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-mb-accent-deep hover:text-mb-primary transition-colors self-start sm:self-auto group"
          >
            <span>View Lookbook</span>
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </div>

        {/* 2 Large Asymmetrical Editorial Image Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
          {EDITORIAL_CARDS.map((card, idx) => (
            <div key={idx} className={`${card.colSpan} flex flex-col`}>
              <Link
                href={card.href}
                className="group relative flex-1 flex flex-col overflow-hidden rounded-2xl bg-[#EDE4DB] border border-mb-border/40 shadow-sm transition-all duration-500 hover:shadow-xl hover:-translate-y-1"
              >
                {/* Media Frame */}
                <div className="relative aspect-[16/10] sm:aspect-[16/9] lg:aspect-[16/11] w-full overflow-hidden">
                  <img
                    src={card.image}
                    alt={card.title}
                    className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (!target.src.includes("/abaya/hero/hero-9.jpg")) {
                        target.src = idx === 0 ? "/abaya/hero/hero-9.jpg" : "/abaya/hero/hero-8.jpg";
                      }
                    }}
                  />

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent transition-opacity duration-300 group-hover:from-black/90" />

                  {/* Top Tag */}
                  <div className="absolute top-4 left-4 sm:top-6 sm:left-6">
                    <span className="inline-block px-3 py-1 text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest text-mb-gold bg-black/50 backdrop-blur-md rounded-full border border-white/15">
                      {card.tag}
                    </span>
                  </div>

                  {/* Bottom Text Content */}
                  <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 text-white">
                    <h3 className="font-serif text-xl sm:text-2xl lg:text-3xl font-semibold tracking-wide text-white group-hover:text-mb-gold transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-white/85 font-light mt-1.5 line-clamp-2 max-w-lg">
                      {card.description}
                    </p>
                    <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-full bg-white text-mb-primary group-hover:bg-mb-gold group-hover:text-mb-primary transition-all duration-300 shadow-sm">
                      <span>{card.ctaText}</span>
                      <span className="transition-transform group-hover:translate-x-1">→</span>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
