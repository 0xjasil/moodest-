import React, { useState, useEffect } from "react";
import Link from "next/link";

export const heroData = [
  {
    img: "/abaya/hero/hero-1.jpg",
    offer: "Up To 30% Off",
    description: "Imperial Black Nidha Abayas",
    link: "/category/all"
  },
  {
    img: "/abaya/hero/hero-2.jpg",
    offer: "Bestseller Set",
    description: "Mocha Silk Kimono & Slip Dress",
    link: "/category/all"
  },
  {
    img: "/abaya/hero/hero-3.jpg",
    offer: "Summer Linen Edit",
    description: "Sage Breathable Casual Abayas",
    link: "/category/all"
  },
  {
    img: "/abaya/hero/hero-4.jpg",
    offer: "Festive Grandeur",
    description: "Champagne Satin Occasion Abayas",
    link: "/category/all"
  },
  {
    img: "/abaya/hero/hero-5.jpg",
    offer: "Haute Modesty",
    description: "Midnight Velvet Trim Abayas",
    link: "/category/all"
  },
  {
    img: "/abaya/hero/hero-6.jpg",
    offer: "Signature Flow",
    description: "Draped Butterfly Farasha Cuts",
    link: "/category/all"
  },
  {
    img: "/abaya/hero/hero-7.jpg",
    offer: "Special Occasion",
    description: "Pearl & Crystal Collar Abayas",
    link: "/category/all"
  },
  {
    img: "/abaya/hero/hero-8.jpg",
    offer: "Royal Heritage",
    description: "Moroccan Crepe Handwoven Kaftans",
    link: "/category/all"
  }
];

export default function HeroCarousel() {
  const [startIndex, setStartIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [cardsPerView, setCardsPerView] = useState(3);
  const total = heroData.length;

  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== "undefined") {
        if (window.innerWidth < 640) {
          setCardsPerView(1);
        } else if (window.innerWidth < 1024) {
          setCardsPerView(2);
        } else {
          setCardsPerView(3);
        }
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Maximum valid index ensures cards always fully fill the view without empty whitespace
  const maxIndex = Math.max(0, total - cardsPerView);

  const nextSlide = () => {
    setStartIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setStartIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  };

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(nextSlide, 4000);
    return () => clearInterval(interval);
  }, [isPaused, maxIndex]);

  // If window resize reduces maxIndex below current startIndex, clamp it
  useEffect(() => {
    if (startIndex > maxIndex) {
      setStartIndex(maxIndex);
    }
  }, [maxIndex, startIndex]);

  return (
    <div
      className="relative w-full px-3 sm:px-6 my-4 select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="region"
      aria-label="Promotional Highlights Carousel"
    >
      {/* Container for slides */}
      <div className="relative overflow-hidden rounded-[6px] md:rounded-[8px]">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{
            transform: `translateX(-${startIndex * (100 / total)}%)`,
            width: `${(total / cardsPerView) * 100}%`
          }}
        >
          {heroData.map((item, idx) => (
            <div
              key={idx}
              className="px-2"
              style={{ width: `${100 / total}%` }}
            >
              <Link
                href={item.link}
                className="group relative block overflow-hidden rounded-[4px] sm:rounded-[6px] bg-mb-surface border border-mb-border shadow-card hover:shadow-dropdown transition-all"
              >
                {/* Image */}
                <div className="relative aspect-[16/10] sm:aspect-[4/3] w-full overflow-hidden bg-mb-surface">
                  <img
                    src={item.img}
                    alt={item.description}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (!target.src.includes("/abaya/hero/hero-1.jpg")) {
                        target.src = "/abaya/hero/hero-1.jpg";
                      }
                    }} />
                </div>

                {/* Card text placed at bottom */}
                <div className="p-3.5 bg-mb-surface border-t border-mb-border">
                  <h3 className="font-serif text-sm sm:text-base font-semibold text-mb-text group-hover:text-mb-primary transition-colors leading-snug truncate">
                    {item.offer}
                  </h3>
                  <p className="text-xs text-mb-body mt-0.5 truncate font-medium">
                    {item.description}
                  </p>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Prev button */}
      <button
        type="button"
        onClick={prevSlide}
        aria-label="Previous slide"
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-mb-bg border border-mb-border text-mb-primary shadow-card hover:bg-mb-surface hover:scale-105 flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-mb-accent cursor-pointer"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Next button */}
      <button
        type="button"
        onClick={nextSlide}
        aria-label="Next slide"
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-mb-bg border border-mb-border text-mb-primary shadow-card hover:bg-mb-surface hover:scale-105 flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-mb-accent cursor-pointer"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
