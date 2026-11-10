import React, { useEffect, useState } from "react";
import Link from "next/link";
import { productAPI, mapBackendProductToProduct } from "@/lib/api";
import type { Product } from "@/components/ProductCard";

export default function RadarSection() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isSubscribed = true;
    (async () => {
      try {
        setLoading(true);
        const res = await productAPI.getAll({ limit: 5 });
        if (isSubscribed && res?.items && res.items.length > 0) {
          setItems(res.items.map(mapBackendProductToProduct));
        } else if (isSubscribed) {
          setItems([]);
        }
      } catch (err) {
        console.warn("[RadarSection] Could not load items:", err);
        if (isSubscribed) setItems([]);
      } finally {
        if (isSubscribed) setLoading(false);
      }
    })();

    return () => {
      isSubscribed = false;
    };
  }, []);

  if (loading || items.length === 0) return null;

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
        {items.map((p) => (
          <Link
            key={p.id}
            href={`/product/${p.id}`}
            className="group flex flex-col bg-mb-surface rounded-[4px] sm:rounded-[6px] border border-mb-border shadow-card hover:shadow-dropdown transition-all p-3.5 text-center"
          >
            <div className="relative aspect-square w-full overflow-hidden rounded-[4px] bg-mb-surface mb-2.5 flex items-center justify-center">
              <img
                src={p.image}
                alt={`${p.name} — Trending Luxury Modest Silhouette`}
                className="w-full h-full object-contain p-2 transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <h3 className="font-serif text-sm font-semibold text-mb-text group-hover:text-mb-primary transition-colors leading-tight line-clamp-1">
              {p.name}
            </h3>
            <p className="text-xs text-mb-accent-deep font-semibold mt-1">
              ₹{Number(p.price).toLocaleString()}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
