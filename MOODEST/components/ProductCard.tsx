import React from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";

import type { Product } from "@/lib/types";
export type { Product };

const StarIcon = () => (
  <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
);

const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
  </svg>
);

export default function ProductCard({ product }: { product: Product }) {
  const { addItem, items } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const inCart = items.some(i => i.product.id === product.id);
  const wishlisted = isWishlisted(product.id);

  const onAdd = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); addItem(product); };
  const onWish = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); toggleWishlist(product); };

  const salePrice = product.discount
    ? Math.round(product.price * (1 - (product.discount * 0.12) / 100))
    : null;

  return (
    <article className="group relative flex flex-col bg-mb-surface border border-mb-border rounded-[12px] shadow-card hover:shadow-dropdown transition-all overflow-hidden">

      {/* ── Badges [BESTSELLER / NEW / FEATURED] ───────────────── */}
      {(product.badge || (product.discount && product.discount > 10)) && (
        <ul className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1" role="list" aria-label="Badges">
          {product.discount && product.discount > 10 && (
            <li role="listitem"
              className="bg-mb-gold-deep text-mb-bg text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[4px] shadow-sm">
              BESTSELLER
            </li>
          )}
          {product.badge && (
            <li role="listitem"
              className="bg-mb-primary text-mb-bg text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[4px] shadow-sm">
              {product.badge}
            </li>
          )}
        </ul>
      )}

      {/* ── Wishlist button ────────────────────────────────────── */}
      <button type="button"
        aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
        aria-pressed={wishlisted}
        onClick={onWish}
        className="absolute top-2.5 right-2.5 z-10 w-7 h-7 flex items-center justify-center bg-mb-bg border border-mb-border text-mb-accent hover:text-mb-primary rounded-full shadow-sm transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mb-accent">
        <HeartIcon filled={wishlisted} />
      </button>

      {/* ── Link: image + details ──────────────────────────────── */}
      <Link href={`/product/${product.id}`}
        aria-label={`${product.brand} ${product.name}, ₹${product.price.toLocaleString()}`}
        className="flex flex-col flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-mb-accent">

        {/* Product image */}
        <div className="relative bg-mb-surface overflow-hidden aspect-square flex items-center justify-center p-3">
          <img src={product.image} alt={product.name}
            loading="lazy"
            onError={(e) => {
              const target = e.currentTarget;
              if (!target.src.includes("/abaya/products/abaya-1.jpg")) {
                target.src = "/abaya/products/abaya-1.jpg";
              }
            }}
            className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
          />
        </div>

        {/* Info block */}
        <div className="flex flex-col flex-1 p-3 pt-2">

          {/* Brand — Jost uppercase light tracking */}
          <p className="text-[11px] font-medium text-mb-muted uppercase tracking-[0.15em] truncate mb-1">
            {product.brand}
          </p>

          {/* Title — Luxury Serif */}
          <h2 className="font-serif text-[14px] font-semibold text-mb-text line-clamp-2 mb-1.5 leading-snug"
            title={product.name}>
            {product.name}
          </h2>

          {/* Prices */}
          <div aria-hidden="true" className="flex items-baseline gap-2 flex-wrap mb-1.5">
            <span className="text-[14px] font-bold text-mb-text">
              ₹{product.price.toLocaleString()}
            </span>
            {product.originalPrice && (
              <span className="text-[12px] text-mb-muted line-through">
                ₹{product.originalPrice.toLocaleString()}
              </span>
            )}
            {product.discount && (
              <span className="text-[11px] text-mb-accent-deep font-bold">
                {product.discount}% Off
              </span>
            )}
          </div>

          <span className="sr-only">
            {product.originalPrice
              ? `Regular price ₹${product.originalPrice.toLocaleString()}. Discounted price ₹${product.price.toLocaleString()}. ${product.discount}% Off.`
              : `Price ₹${product.price.toLocaleString()}.`}
          </span>

          {/* Star rating — Gold Deep badge */}
          <div className="flex items-center gap-1.5 mb-2"
            aria-label={`${product.rating} out of 5 star rating`}>
            <span className="flex items-center gap-1 bg-mb-gold-deep text-mb-bg text-[10px] font-bold px-1.5 py-0.5 rounded-[4px] leading-none">
              {product.rating} <StarIcon />
            </span>
            <span className="text-[11px] text-mb-muted">
              ({product.reviewCount.toLocaleString()})
            </span>
          </div>

          {/* Sale price secondary row */}
          {salePrice && product.discount && (
            <div className="flex items-center gap-1.5 px-2 py-1 mt-auto bg-mb-bg border border-mb-border-lite rounded-[6px]">
              <span className="text-[10px] text-mb-muted uppercase tracking-wider">Sale</span>
              <span className="text-[12px] font-bold text-mb-text">₹{salePrice.toLocaleString()}</span>
              <span className="text-[10px] text-mb-accent-deep font-semibold">
                {Math.min(product.discount + 5, 65)}% Off
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* ── Add to Bag CTA ─────────────────────────────────────── */}
      <div className="p-3 pt-0">
        <button type="button"
          aria-label={inCart ? `${product.name} added to bag` : `Add ${product.name} to bag`}
          onClick={onAdd}
          className={`w-full py-2 text-[12px] font-semibold rounded-[10px] transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-mb-accent ${
            inCart
              ? "bg-mb-primary text-mb-bg border border-mb-primary"
              : "bg-mb-primary hover:bg-mb-primary-hover text-mb-bg"
          }`}>
          {inCart ? "✓ Added to Bag" : "Add to Bag"}
        </button>
      </div>

      <span aria-live="polite" aria-atomic="true" className="sr-only">
        {inCart ? `${product.name} added to bag` : ""}
      </span>
    </article>
  );
}
