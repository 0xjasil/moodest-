import React from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";

import type { Product } from "@/lib/types";
export type { Product };

const StarIcon = () => <Icon icon="lucide:star" className="w-2.5 h-2.5 fill-current" />;

const HeartIcon = ({ filled }: { filled: boolean }) => (
  <Icon
    icon="lucide:heart"
    className={`w-3.5 h-3.5 ${filled ? "fill-current" : ""}`}
  />
);

export default function ProductCard({ product }: { product: Product }) {
  const { addItem, items } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const inCart = items.some(i => i.product.id === product.id);
  const wishlisted = isWishlisted(product.id);

  const onAdd = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); addItem(product); };
  const onWish = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); toggleWishlist(product); };

  const formatPrice = (val: number) => `Rs. ${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <article className="group relative flex flex-col bg-mb-surface border border-mb-border rounded-[2px] transition-all overflow-hidden select-none shadow-2xs hover:border-mb-accent/60">

      {/* ── Top Image Container ───────────────────────────────── */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-mb-surface border-b border-mb-border/60">
        
        {/* Top-Left: Badge following brand palette (2px subtle border radius) */}
        {product.discount ? (
          <span className="absolute top-2 sm:top-2.5 left-2 sm:left-2.5 z-10 bg-mb-accent-deep text-white text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-[2px] uppercase tracking-wider shadow-xs pointer-events-none">
            {product.discount}% OFF
          </span>
        ) : product.badge ? (
          <span className="absolute top-2 sm:top-2.5 left-2 sm:left-2.5 z-10 bg-mb-accent-deep text-white text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-[2px] uppercase tracking-wider shadow-xs pointer-events-none">
            {product.badge}
          </span>
        ) : null}

        {/* Top-Right: Brand Theme Circular Wishlist Button */}
        <button
          type="button"
          aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          aria-pressed={wishlisted}
          onClick={onWish}
          className="absolute top-2 sm:top-2.5 right-2 sm:right-2.5 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-mb-surface text-mb-text border border-mb-border shadow-xs flex items-center justify-center transition-transform hover:scale-110 active:scale-95 focus-visible:outline-none"
        >
          <HeartIcon filled={wishlisted} />
        </button>

        {/* Link wrapping image only */}
        <Link
          href={`/product/${product.id}`}
          aria-label={`${product.brand} ${product.name}, ${formatPrice(product.price)}`}
          className="block w-full h-full relative cursor-pointer"
        >
          <img
            src={product.image}
            alt={`${product.name} — ${product.brand || "Modest Studio"} Luxury Designer Abaya`}
            loading="lazy"
            onError={(e) => {
              const target = e.currentTarget;
              if (!target.src.includes("/abaya/products/abaya-1.jpg")) {
                target.src = "/abaya/products/abaya-1.jpg";
              }
            }}
            className={`w-full h-full object-cover object-top transition-all duration-700 ${
              product.images && product.images[1] ? "group-hover:opacity-0" : "group-hover:scale-105"
            }`}
          />
          {product.images && product.images[1] && (
            <img
              src={product.images[1]}
              alt={`${product.name} — ${product.brand || "Modest Studio"} Detailed Fabric & Silhouette View`}
              loading="lazy"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.includes("/abaya/products/abaya-1.jpg")) {
                  target.src = "/abaya/products/abaya-1.jpg";
                }
              }}
              className="absolute inset-0 w-full h-full object-cover object-top opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            />
          )}
        </Link>
      </div>

      {/* ── Product Details Below Image (Exact Reference Image Typography & Plus Button) ───────────────── */}
      <div className="p-2 sm:p-2.5 flex items-start justify-between gap-1.5 bg-mb-surface flex-1">
        <Link href={`/product/${product.id}`} className="flex-1 min-w-0 group/link">
          {/* Title: Decreased font size, clean & modern */}
          <h2 className="text-xs sm:text-[13px] font-medium text-mb-text group-hover/link:text-mb-primary line-clamp-1 mb-0.5 transition-colors">
            {product.name}
          </h2>

          {/* Regular Price */}
          <p className="text-xs sm:text-[13px] font-semibold text-mb-text leading-tight">
            {formatPrice(product.price)}
          </p>

          {/* Strikethrough Original Price */}
          {product.originalPrice && (
            <p className="text-[10px] sm:text-[11px] text-mb-muted line-through leading-tight mt-0.5">
              {formatPrice(product.originalPrice)}
            </p>
          )}

          {/* Red/Rust Discount Percentage (Brand Theme --color-error / #A83A45) */}
          {product.discount && (
            <p className="text-[10px] sm:text-[11px] font-bold text-mb-error leading-tight mt-0.5">
              {product.discount}% OFF
            </p>
          )}
        </Link>

        {/* Circular Plus Button (Brand Theme Palette) */}
        <button
          type="button"
          onClick={onAdd}
          aria-label={inCart ? `${product.name} in bag` : `Add ${product.name} to bag`}
          title={inCart ? "In Bag" : "Add to Bag"}
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border flex items-center justify-center transition-all flex-shrink-0 mt-0.5 shadow-2xs ${
            inCart
              ? "bg-mb-primary text-white border-mb-primary"
              : "border-mb-border bg-mb-surface text-mb-text hover:border-mb-primary hover:text-mb-primary hover:scale-105"
          }`}
        >
          {inCart ? (
            <Icon icon="lucide:check" className="w-3.5 h-3.5" />
          ) : (
            <Icon icon="lucide:plus" className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      <span aria-live="polite" aria-atomic="true" className="sr-only">
        {inCart ? `${product.name} added to bag` : ""}
      </span>
    </article>
  );
}
