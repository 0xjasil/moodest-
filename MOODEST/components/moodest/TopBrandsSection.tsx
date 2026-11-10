import React, { useEffect, useState } from "react";
import Link from "next/link";
import { brandAPI } from "@/lib/api";

interface BrandItem {
  id: string;
  name: string;
  slug: string;
  image?: string;
  description?: string;
}

export default function TopBrandsSection() {
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isSubscribed = true;
    (async () => {
      try {
        setLoading(true);
        const res = await brandAPI.getAll();
        if (!isSubscribed) return;
        const list = Array.isArray(res) ? res : Array.isArray((res as any)?.data) ? (res as any).data : [];
        if (list.length > 0) {
          setBrands(
            list.map((b: any) => ({
              id: String(b.id),
              name: b.name,
              slug: b.slug || b.name.toLowerCase().replace(/\s+/g, "-"),
              image: b.image || "/abaya/brands/modest-studio.jpg",
              description: b.description || `Explore ${b.name} luxury abaya collection.`,
            }))
          );
        } else {
          setBrands([]);
        }
      } catch (err) {
        console.warn("[TopBrandsSection] Could not load brands:", err);
        if (isSubscribed) setBrands([]);
      } finally {
        if (isSubscribed) setLoading(false);
      }
    })();

    return () => {
      isSubscribed = false;
    };
  }, []);

  if (loading) {
    return (
      <section className="w-full px-3 sm:px-6 my-8" aria-label="Loading Brands">
        <div className="h-7 w-64 bg-mb-border/40 rounded mb-6 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-[16/10] rounded-[6px] bg-mb-surface border border-mb-border animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (brands.length === 0) return null;

  return (
    <section className="w-full px-3 sm:px-6 my-8" aria-label="Explore Our Top Brands">
      <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-mb-text mb-6 text-left">
        Explore Maison &amp; Premier Brands
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {brands.map((brand) => (
          <Link
            key={brand.id}
            href={`/category/${brand.slug}`}
            className="group flex flex-col bg-mb-surface rounded-[4px] sm:rounded-[6px] border border-mb-border shadow-card hover:shadow-dropdown transition-all overflow-hidden p-3.5"
          >
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[4px] bg-mb-surface mb-3">
              <img
                src={brand.image}
                alt={`${brand.name} — Luxury Modest Atelier & Design House`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="flex flex-col flex-1 justify-between">
              <div>
                <h3 className="font-serif text-base sm:text-lg font-semibold text-mb-text leading-snug">
                  {brand.name}
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
