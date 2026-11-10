import React, { useState, useEffect, useCallback } from "react";

export interface HeroBanner {
  image: string;
  title: string;
  subtitle: string;
  link: string;
}

/* ── Icons ────────────────────────────────────────────────────── */
const ChevronLeft = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
const ChevronRight = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

/* ── Component ────────────────────────────────────────────────── */
export default function Hero() {
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = banners.length;

  // Live CMS integration: fetch updated banners from backend API
  useEffect(() => {
    let isMounted = true;
    async function fetchCmsBanners() {
      try {
        setLoading(true);
        const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "https://bkndmoodest.vercel.app").replace(/\/$/, "");
        const prefix = process.env.NEXT_PUBLIC_API_PREFIX || "/api";
        const res = await fetch(`${apiUrl}${prefix}/banners`);
        if (res.ok) {
          const json = await res.json();
          const list = Array.isArray(json) ? json : json.data || json.banners || [];
          if (isMounted && Array.isArray(list) && list.length > 0) {
            setBanners(
              list.map((b: any) => ({
                image: b.imageUrl || b.image,
                title: b.title || "Modest Studio",
                subtitle: b.subtitle || b.tag || b.description || "",
                link: b.linkUrl || b.buttonLink || b.link || "#",
              }))
            );
          } else if (isMounted) {
            setBanners([]);
          }
        } else if (isMounted) {
          setBanners([]);
        }
      } catch (err) {
        console.warn("[Hero] Could not load banners from backend:", err);
        if (isMounted) setBanners([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchCmsBanners();
    return () => {
      isMounted = false;
    };
  }, []);

  const next = useCallback(() => setActive(p => (p + 1) % total), [total]);
  const prev = useCallback(() => setActive(p => (p - 1 + total) % total), [total]);

  useEffect(() => {
    if (paused || total === 0) return;
    const id = setInterval(next, 4500);
    return () => clearInterval(id);
  }, [paused, next, total]);

  if (loading) {
    return (
      <section
        aria-label="Loading featured promotions"
        className="w-full bg-mb-surface border-b border-mb-border animate-pulse"
        style={{ height: "clamp(220px, 36vw, 440px)" }}
      >
        <div className="w-full h-full bg-mb-border/20 flex items-center justify-center">
          <div className="w-1/3 h-6 bg-mb-border/40 rounded" />
        </div>
      </section>
    );
  }

  if (total === 0) return null;

  return (
    <section
      aria-label="Featured promotions"
      className="relative w-full overflow-hidden bg-mb-surface border-b border-mb-border"
      style={{ height: "clamp(220px, 36vw, 440px)" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slides */}
      {banners.map((b, i) => (
        <div
          key={i}
          aria-hidden={i !== active}
          className="absolute inset-0 transition-opacity duration-500"
          style={{ opacity: i === active ? 1 : 0, pointerEvents: i === active ? "auto" : "none" }}
        >
          <a href={b.link} target="_blank" rel="noreferrer" tabIndex={i === active ? 0 : -1}>
            <img
              src={b.image}
              alt={b.title || "Modest Studio Luxury Abaya Featured Banner"}
              width={1440}
              height={440}
              loading={i === 0 ? "eager" : "lazy"}
              fetchPriority={i === 0 ? "high" : undefined}
              className="w-full h-full object-cover"
            />
          </a>
        </div>
      ))}

      {/* Prev / Next */}
      {total > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous slide"
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-mb-bg border border-mb-border text-mb-primary flex items-center justify-center shadow-card hover:bg-mb-surface hover:scale-105 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mb-accent"
          >
            <ChevronLeft />
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-mb-bg border border-mb-border text-mb-primary flex items-center justify-center shadow-card hover:bg-mb-surface hover:scale-105 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mb-accent"
          >
            <ChevronRight />
          </button>
        </>
      )}

      {/* Dots */}
      {total > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex gap-1.5" role="tablist" aria-label="Slide indicators">
          {banners.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setActive(i)}
              className={`h-2 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mb-primary ${
                i === active ? "w-6 bg-mb-primary" : "w-2 bg-mb-primary/30"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
