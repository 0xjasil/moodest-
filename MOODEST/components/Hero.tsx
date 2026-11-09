import React, { useState, useEffect, useCallback } from "react";
import bannersData from "@/banners.json";

/* ── Data ─────────────────────────────────────────────────────── */
const defaultBanners = (bannersData as any[])
  .filter((b: any) => b.image)
  .slice(0, 6)
  .map((b: any) => ({
    image: b.image as string,
    title: ((b.callout || b.alt || b.title || "") as string).split("|")[0].trim() || "Modest Studio",
    subtitle: (b.title || "") as string,
    link: (b.link || "#") as string,
  }));

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
  const [banners, setBanners] = useState(defaultBanners);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = banners.length;

  // Live CMS integration: fetch updated banners from backend API
  useEffect(() => {
    let isMounted = true;
    async function fetchCmsBanners() {
      try {
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
          }
        }
      } catch {
        // Fallback to static default banners
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
              alt={b.title}
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
