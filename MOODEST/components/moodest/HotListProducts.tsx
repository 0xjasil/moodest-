import React, { useRef } from "react";
import Link from "next/link";
import { useProducts } from "@/lib/hooks";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";

export default function HotListProducts() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { products, isLoading } = useProducts(1, 16);
  const { addItem, items } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const offset = direction === "left" ? -280 : 280;
    scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
  };

  const handleAddToCart = (e: React.MouseEvent, p: any) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(p);
  };

  return (
    <section className="w-full px-3 sm:px-6 my-8" aria-label="Hot List Super Sellers">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-5 gap-2">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-mb-text text-left">
            Hot List Icons
          </h2>
          <p className="text-xs sm:text-sm font-medium text-mb-muted mt-1">
            Modest Studio's Iconic Bestsellers
          </p>
        </div>
        <Link
          href="/category/all"
          className="text-xs sm:text-sm font-semibold text-mb-accent-deep hover:text-mb-primary flex items-center gap-1 transition-colors"
        >
          View Collection <span>→</span>
        </Link>
      </div>

      <div className="relative group">
        <button
          onClick={() => scroll("left")}
          aria-label="Previous products"
          className="absolute left-1 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-mb-bg border border-mb-border text-mb-primary shadow-card flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 hover:bg-mb-surface hover:scale-105"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth py-2"
        >
          {isLoading
            ? [...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-[190px] sm:w-[220px] bg-mb-surface rounded-[4px] sm:rounded-[6px] border border-mb-border p-3.5 animate-pulse"
                >
                  <div className="aspect-square w-full bg-mb-bg rounded-[4px] mb-2.5" />
                  <div className="h-3 bg-mb-border rounded w-full mb-2" />
                  <div className="h-2 bg-mb-border rounded w-2/3" />
                </div>
              ))
            : products.map((product) => {
                const inCart = items.some((item) => item.product.id === product.id);
                const wishlisted = isWishlisted(product.id);

                return (
                  <div
                    key={product.id}
                    className="flex-shrink-0 w-[190px] sm:w-[220px] bg-mb-surface rounded-[4px] sm:rounded-[6px] border border-mb-border shadow-card hover:shadow-dropdown transition-all flex flex-col justify-between p-3.5 relative group/card"
                  >
                    {/* Badges */}
                    <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1">
                      {product.badge && (
                        <span className="bg-mb-primary text-mb-bg text-[10px] font-bold px-2 py-0.5 rounded-[4px] shadow-sm uppercase tracking-wider">
                          {product.badge}
                        </span>
                      )}
                      {product.discount && (
                        <span className="bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-[4px] shadow-sm">
                          {product.discount}% OFF
                        </span>
                      )}
                    </div>

                    {/* Wishlist button */}
                    <button
                      type="button"
                      aria-label="Wishlist"
                      onClick={(e) => {
                        e.preventDefault();
                        toggleWishlist(product);
                      }}
                      className="absolute top-2.5 right-2.5 z-10 w-7 h-7 rounded-full bg-mb-bg border border-mb-border shadow-sm flex items-center justify-center text-mb-accent hover:text-mb-primary transition-colors hover:scale-110"
                    >
                      <svg
                        className={`w-3.5 h-3.5 ${
                          wishlisted ? "fill-mb-accent text-mb-accent" : "fill-none stroke-currentColor"
                        }`}
                        viewBox="0 0 24 24"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
                        />
                      </svg>
                    </button>

                    {/* Image */}
                    <div className="relative aspect-square w-full overflow-hidden rounded-[4px] bg-mb-surface flex items-center justify-center mb-2.5">
                      <img
                        src={product.image}
                        alt={`${product.name} — Handpicked Luxury Abaya Hot List | Modest Studio`}
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (!target.src.includes("/abaya/products/abaya-1.jpg")) {
                            target.src = "/abaya/products/abaya-1.jpg";
                          }
                        }}
                        className="w-full h-full object-cover object-top transition-transform duration-500 group-hover/card:scale-105"
                      />
                    </div>

                    {/* Content */}
                    <div className="flex flex-col flex-1 justify-between">
                      <div>
                        <h3
                          className="font-serif text-xs sm:text-sm font-semibold text-mb-text line-clamp-2 leading-snug mb-1"
                          title={product.name}
                        >
                          {product.name}
                        </h3>

                        {/* Price and offer */}
                        <div className="flex items-baseline gap-2 flex-wrap my-1.5">
                          <span className="text-sm font-bold text-mb-text">
                            ₹{product.price.toLocaleString("en-IN")}
                          </span>
                          {product.discount && (
                            <span className="text-[11px] font-bold text-mb-accent-deep">
                              {product.discount}% off
                            </span>
                          )}
                        </div>

                        {/* Brand and ratings */}
                        <div className="flex items-center gap-2 text-[10px] text-mb-muted mb-3">
                          <span>{product.brand}</span>
                          {product.rating && <span>⭐ {product.rating}</span>}
                        </div>
                      </div>

                      {/* Add to Bag CTA */}
                      <button
                        onClick={(e) => handleAddToCart(e, product)}
                        className={`w-full py-2 text-xs font-semibold rounded-[4px] sm:rounded-[6px] transition-all shadow-sm ${
                          inCart
                            ? "bg-mb-primary text-mb-bg border border-mb-primary"
                            : "bg-mb-primary hover:bg-mb-primary-hover text-mb-bg"
                        }`}
                      >
                        {inCart ? "✓ Added to Bag" : "Add to Bag"}
                      </button>
                    </div>
                  </div>
                );
              })}
        </div>

        <button
          onClick={() => scroll("right")}
          aria-label="Next products"
          className="absolute right-1 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-mb-bg border border-mb-border text-mb-primary shadow-card flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 hover:bg-mb-surface hover:scale-105"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </section>
  );
}
