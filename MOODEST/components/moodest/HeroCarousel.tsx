import React, { useState, useEffect } from "react";
import Link from "next/link";

export const heroSlides = [
  {
    img: "/banners/top-promo-banner.jpg",
    link: "/category/all",
  },
  {
    img: "/banners/category-highlights-banner.jpg",
    link: "/category/all",
  },
  {
    img: "/banners/timeless-beauty-banner.jpg",
    link: "/category/all",
  },
  {
    img: "/abaya/hero/hero-1.jpg",
    link: "/category/the-classics",
  },
  {
    img: "/abaya/hero/hero-4.jpg",
    link: "/category/occasion-wear",
  },
  {
    img: "/abaya/hero/hero-6.jpg",
    link: "/category/open-abaya-edit",
  },
];

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const total = heroSlides.length;

  const nextSlide = () => {
    setCurrent((prev) => (prev + 1) % total);
  };

  const prevSlide = () => {
    setCurrent((prev) => (prev - 1 + total) % total);
  };

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(nextSlide, 4500);
    return () => clearInterval(interval);
  }, [isPaused, total]);

  return (
    <div
      className="relative w-full h-[70vh] sm:h-[80vh] md:h-[88vh] lg:h-[92vh] max-h-[960px] overflow-hidden select-none bg-neutral-900"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="region"
      aria-label="Hero Full Viewport Visual Slider"
    >
      {/* Slides Container */}
      <div
        className="flex h-full w-full transition-transform duration-700 ease-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {heroSlides.map((slide, idx) => (
          <div key={idx} className="relative w-full h-full flex-shrink-0">
            <Link
              href={slide.link}
              className="block w-full h-full relative cursor-pointer group"
              aria-label={`Featured Collection Slide ${idx + 1}`}
            >
              <img
                src={slide.img}
                alt={`Modest Studio Visual ${idx + 1}`}
                className="w-full h-full object-cover object-center transition-transform duration-1000 group-hover:scale-[1.02]"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.src.includes("/banners/top-promo-banner.jpg")) {
                    target.src = "/banners/top-promo-banner.jpg";
                  }
                }}
              />
              {/* Subtle top/bottom luxury vignette overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/15 pointer-events-none" />
            </Link>
          </div>
        ))}
      </div>

      {/* Prev Navigation Arrow */}
      <button
        type="button"
        onClick={prevSlide}
        aria-label="Previous Hero Image"
        className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/90 hover:bg-white text-neutral-900 shadow-xl backdrop-blur-sm flex items-center justify-center transition-all hover:scale-105 active:scale-95 focus:outline-none"
      >
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Next Navigation Arrow */}
      <button
        type="button"
        onClick={nextSlide}
        aria-label="Next Hero Image"
        className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/90 hover:bg-white text-neutral-900 shadow-xl backdrop-blur-sm flex items-center justify-center transition-all hover:scale-105 active:scale-95 focus:outline-none"
      >
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-5 sm:bottom-7 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {heroSlides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`transition-all duration-300 rounded-full ${
              current === i
                ? "w-8 h-2 bg-white shadow-md"
                : "w-2 h-2 bg-white/50 hover:bg-white/80"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
