import React, { useState, useEffect } from "react";
import Link from "next/link";
import type { Banner } from "@/lib/types";

export interface HeroSlideItem {
  id?: string;
  img: string;
  link: string;
  title?: string | null;
  subtitle?: string | null;
  alt?: string | null;
  buttonText?: string | null;
}

export const heroSlides: HeroSlideItem[] = [
  {
    img: "/banners/top-promo-banner.jpg",
    link: "/category/all",
    title: "New Arrivals Worth The Wait — Luxury Abayas",
    alt: "New Arrivals Worth The Wait — Luxury Handcrafted Abayas at Modest Studio",
  },
  {
    img: "/banners/category-highlights-banner.jpg",
    link: "/category/all",
    title: "Match The Mood — Handwork & Bridal Edits",
    alt: "Luxury Occasion & Bridal Abaya Collection — Handwork Embroidery & Crystals",
  },
  {
    img: "/banners/timeless-beauty-banner.jpg",
    link: "/category/all",
    title: "Beauty in Modesty — Timeless Elegance",
    alt: "Modest Studio Atelier — Everyday & Timeless Luxury Abayas",
  },
  {
    img: "/abaya/hero/hero-1.jpg",
    link: "/category/the-classics",
    title: "The Classics Collection",
    alt: "The Classics Collection — Pure Black Premium Nidha Abaya",
  },
  {
    img: "/abaya/hero/hero-4.jpg",
    link: "/category/occasion-wear",
    title: "Occasion Wear Abayas",
    alt: "Occasion Wear Abaya — Opulent Silk Satin and Beaded Trim",
  },
  {
    img: "/abaya/hero/hero-6.jpg",
    link: "/category/open-abaya-edit",
    title: "Open Abaya Edit",
    alt: "Front-Open Kimono Abaya with Tailored Lapels - Modest Studio",
  },
];

interface HeroCarouselProps {
  initialBanners?: Banner[];
}

export default function HeroCarousel({ initialBanners }: HeroCarouselProps) {
  const [banners, setBanners] = useState<Banner[]>(initialBanners || []);

  // Client-side fallback fetch if not provided via SSR
  useEffect(() => {
    if (!initialBanners || initialBanners.length === 0) {
      fetch("/api/banners")
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setBanners(data);
          }
        })
        .catch(() => {});
    }
  }, [initialBanners]);

  // Map CMS banners to slide objects with rich SEO alt support
  const cmsSlides: HeroSlideItem[] = banners
    .filter((b) => b.isActive !== false && (b.imageUrl || b.image))
    .map((b) => ({
      id: b.id,
      img: b.imageUrl || b.image || "/banners/top-promo-banner.jpg",
      link: b.buttonLink || b.linkUrl || b.link || "/category/all",
      title: b.title,
      alt: b.alt || b.title || (b.subtitle ? `${b.subtitle} — Modest Studio Luxury Abaya` : "Modest Studio Luxury Abaya Editorial Slide"),
      subtitle: b.subtitle || b.tag,
      buttonText: b.buttonText,
    }));

  const slides = cmsSlides.length > 0 ? cmsSlides : heroSlides;

  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const total = slides.length;

  const nextSlide = () => {
    setCurrent((prev) => (prev + 1) % total);
  };

  const prevSlide = () => {
    setCurrent((prev) => (prev - 1 + total) % total);
  };

  useEffect(() => {
    if (isPaused || total <= 1) return;
    const interval = setInterval(nextSlide, 4500);
    return () => clearInterval(interval);
  }, [isPaused, total]);

  // Reset current slide if total changes
  useEffect(() => {
    if (current >= total && total > 0) {
      setCurrent(0);
    }
  }, [total, current]);

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
        {slides.map((slide, idx) => (
          <div key={slide.id || idx} className="relative w-full h-full flex-shrink-0">
            <Link
              href={slide.link}
              className="block w-full h-full relative cursor-pointer group"
              aria-label={slide.title || `Featured Collection Slide ${idx + 1}`}
            >
              <img
                src={slide.img}
                alt={slide.alt || slide.title || `Modest Studio Luxury Abaya Banner ${idx + 1}`}
                className="w-full h-full object-contain object-center transition-transform duration-1000 group-hover:scale-[1.01]"
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
      {total > 1 && (
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
      )}

      {/* Next Navigation Arrow */}
      {total > 1 && (
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
      )}

      {/* Slide Indicators */}
      {total > 1 && (
        <div className="absolute bottom-5 sm:bottom-7 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          {slides.map((_, i) => (
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
      )}
    </div>
  );
}
