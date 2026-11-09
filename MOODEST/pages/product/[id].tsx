import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import Header from "@/components/Header";
import ReviewForm from "@/components/ReviewForm";
import Footer from "@/components/Footer";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { productAPI, reviewAPI, mapBackendProductToProduct } from "@/lib/api";
import type { Product } from "@/components/ProductCard";
import type { Review } from "@/lib/types";

export default function ProductDetail({ initialProduct = null }: { initialProduct?: Product | null }) {
  const router = useRouter();
  const { id } = router.query;
  const [qty, setQty] = useState(1);
  const [flash, setFlash] = useState(false);
  const [liveProduct, setLiveProduct] = useState<Product | null>(initialProduct);
  const [selectedVariantId, setSelectedVariantId] = useState<any>(initialProduct?.variantId);
  const [selectedImage, setSelectedImage] = useState<string | null>(
    initialProduct?.variants?.find((v: any) => v.id === initialProduct?.variantId)?.image || initialProduct?.image || null
  );
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const refreshReviews = async () => {
    if (!id) return;
    try {
      const revData = await reviewAPI.getByProduct(id as string);
      if (revData && Array.isArray(revData.reviews)) {
        setReviews(revData.reviews);
        setShowReviewForm(false);
      }
    } catch {}
  };

  const { addItem, items } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();

  const product = liveProduct ?? initialProduct;

  // Fetch product and reviews from NestJS backend
  useEffect(() => {
    if (!id) return;
    let isSubscribed = true;

    (async () => {
      try {
        const raw = await productAPI.getById(id as string);
        if (isSubscribed && raw) {
          const mapped = mapBackendProductToProduct(raw);
          setLiveProduct(mapped);
          if (mapped.variantId) {
            setSelectedVariantId(mapped.variantId);
            const activeV = mapped.variants?.find((v: any) => v.id === mapped.variantId);
            if (activeV?.image) {
              setSelectedImage(activeV.image);
            } else if (mapped.image) {
              setSelectedImage(mapped.image);
            }
          } else if (mapped.image) {
            setSelectedImage(mapped.image);
          }
        }
      } catch {
        // Fallback to local item
      }

      try {
        const revData = await reviewAPI.getByProduct(id as string);
        if (isSubscribed && revData && Array.isArray(revData.reviews)) {
          setReviews(revData.reviews);
        }
      } catch {
        // Fallback
      }
    })();

    return () => {
      isSubscribed = false;
    };
  }, [id]);

  if (!product) return null;

  const inCart = items.some((i) => i.product.id === product.id);
  const wishlisted = isWishlisted(product.id);

  if (!product) {
    return (
      <>
        <Header />
        <main className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center bg-mb-bg">
          <h1 className="text-xl font-serif font-bold text-mb-text mb-2">Product Not Found</h1>
          <p className="text-sm text-mb-muted mb-6">The requested product could not be located in our catalog.</p>
          <Link href="/category/all" className="px-5 py-2.5 bg-[#5C1A24] text-white text-xs font-semibold rounded-lg hover:bg-[#42121B] transition-colors">
            Return to All Collections
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  const handleAddToCart = () => {
    const itemToAdd: Product = {
      ...product,
      variantId: selectedVariantId || product.variantId,
    };
    for (let i = 0; i < qty; i++) {
      addItem(itemToAdd);
    }
    setFlash(true);
    setTimeout(() => setFlash(false), 2500);
  };

  return (
    <>
      <Head>
        <title>{product.name} | Modest Studio</title>
        <meta
          name="description"
          content={`Experience ${product.name} by ${product.brand} at Modest Studio - Beauty Beyond Today.`}
        />
      </Head>
      <Header />
      <main id="main-content" className="min-h-screen bg-mb-bg py-8">
        <div className="mx-auto max-w-content px-4 md:px-6">

          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center gap-2 text-xs text-mb-muted" role="list">
              <li role="listitem">
                <Link
                  href="/"
                  className="hover:text-mb-primary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-mb-accent rounded"
                >
                  Home
                </Link>
              </li>
              <li role="listitem" aria-hidden="true" className="text-mb-dusty">/</li>
              <li role="listitem">
                <Link
                  href={`/category/${product.category}`}
                  className="capitalize hover:text-mb-primary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-mb-accent rounded"
                >
                  {product.category}
                </Link>
              </li>
              <li role="listitem" aria-hidden="true" className="text-mb-dusty">/</li>
              <li role="listitem" className="text-mb-text font-semibold truncate max-w-[260px]" aria-current="page">
                {product.name}
              </li>
            </ol>
          </nav>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-[460px_1fr]">

            {/* ── Image & Gallery ───────────────────────────── */}
            <div className="flex flex-col gap-3">
              <div className="bg-mb-surface rounded-[6px] md:rounded-[8px] border border-mb-border shadow-card p-8 flex items-center justify-center aspect-square md:aspect-auto md:min-h-[440px]">
                <img
                  src={selectedImage || product.image}
                  alt={product.name}
                  width={440}
                  height={440}
                  loading="eager"
                  fetchPriority="high"
                  className="max-h-[400px] w-auto object-contain transition-transform duration-500 hover:scale-105"
                />
              </div>

              {/* Gallery Thumbnails (De-duplicated valid photos including variant images) */}
              {(() => {
                const variantImages = (product.variants || []).map((v: any) => v.image).filter(Boolean);
                const uniqueImages = Array.from(
                  new Set(
                    [product.image, ...(product.images || []), ...variantImages].filter(
                      (url): url is string => Boolean(url && typeof url === "string" && !url.includes("placeholder.png"))
                    )
                  )
                );

                if (uniqueImages.length <= 1) return null;

                return (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Product image gallery">
                    {uniqueImages.map((imgUrl, idx) => {
                      const isSelected = (selectedImage || product.image) === imgUrl;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setSelectedImage(imgUrl);
                            const matchingVariant = product.variants?.find((v: any) => v.image === imgUrl);
                            if (matchingVariant) {
                              setSelectedVariantId(matchingVariant.id);
                            }
                          }}
                          aria-label={`View photo ${idx + 1}`}
                          className={`size-16 rounded-md border p-1 shrink-0 overflow-hidden bg-mb-surface transition-all ${
                            isSelected
                              ? "border-mb-primary ring-2 ring-mb-primary/30"
                              : "border-mb-border hover:border-mb-accent opacity-80 hover:opacity-100"
                          }`}
                        >
                          <img
                            src={imgUrl}
                            alt={`${product.name} thumbnail ${idx + 1}`}
                            className="size-full object-contain"
                          />
                        </button>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* ── Details ─────────────────────────────────── */}
            <div className="bg-mb-surface rounded-[6px] md:rounded-[8px] border border-mb-border shadow-card p-6 sm:p-8 flex flex-col justify-between">
              <div>
                {/* Brand + badge */}
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-mb-muted">
                    {product.brand}
                  </span>
                  {product.badge && (
                    <span className="bg-mb-gold-deep text-mb-bg text-[10px] font-bold px-2 py-0.5 rounded-[4px] shadow-sm uppercase tracking-wider">
                      {product.badge}
                    </span>
                  )}
                </div>

                {/* Name */}
                <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-mb-text leading-snug mb-3">
                  {product.name}
                </h1>

                {/* Rating */}
                <div className="flex items-center gap-3 mb-4">
                  <span
                    className="flex items-center gap-1 bg-mb-gold-deep text-mb-bg text-xs font-bold px-2 py-0.5 rounded-[4px] leading-none"
                    aria-label={`${product.rating} out of 5 stars`}
                  >
                    {product.rating}
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </span>
                  {(product.reviewCount || reviews.length) > 0 ? (
                    <span className="text-xs text-mb-muted">
                      {(product.reviewCount || reviews.length).toLocaleString()} verified reviews
                    </span>
                  ) : null}
                </div>

                {/* Variation-Aware Dynamic Price */}
                {(() => {
                  const activeVariant = product.variants?.find((v: any) => String(v.id) === String(selectedVariantId));
                  const displayPrice = activeVariant?.offerPrice ?? activeVariant?.price ?? product.price;
                  const displayOriginalPrice = activeVariant?.offerPrice && activeVariant?.price
                    ? activeVariant.price
                    : (!activeVariant ? product.originalPrice : undefined);
                  const discountPct =
                    activeVariant?.offerPrice && activeVariant?.price && Number(activeVariant.price) > Number(activeVariant.offerPrice)
                      ? Math.round(((Number(activeVariant.price) - Number(activeVariant.offerPrice)) / Number(activeVariant.price)) * 100)
                      : (!activeVariant ? product.discount : undefined);

                  return (
                    <div className="flex items-baseline gap-3 border-t border-mb-border-lite pt-4 mb-4">
                      <span className="text-3xl font-bold text-mb-text">
                        ₹{Number(displayPrice).toLocaleString()}
                      </span>
                      {displayOriginalPrice && Number(displayOriginalPrice) > Number(displayPrice) && (
                        <span className="text-sm text-mb-muted line-through">
                          ₹{Number(displayOriginalPrice).toLocaleString()}
                        </span>
                      )}
                      {discountPct ? (
                        <span className="text-sm font-bold text-mb-accent-deep">
                          {discountPct}% Off
                        </span>
                      ) : null}
                    </div>
                  );
                })()}

                {/* Variants Selection (Size & Color options with dynamic photo switching) */}
                {product.variants && product.variants.length > 0 && (
                  <div className="mb-5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-mb-body uppercase tracking-wider block">
                        Select Variation / Size:
                      </span>
                      {(() => {
                        const activeVariant = product.variants?.find((v: any) => String(v.id) === String(selectedVariantId));
                        return activeVariant ? (
                          <span className="text-xs text-mb-muted">
                            Selected:{" "}
                            <strong className="text-mb-text font-semibold">
                              {[activeVariant.size ? `Size ${activeVariant.size}` : null, activeVariant.color].filter(Boolean).join(" • ") || "Default"}
                            </strong>
                          </span>
                        ) : null;
                      })()}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {product.variants.map((v) => {
                        const isSelected = String(selectedVariantId) === String(v.id);
                        const label = [v.size ? `Size ${v.size}` : null, v.color].filter(Boolean).join(" • ") || `Option ${v.id}`;
                        const vPrice = v.offerPrice ?? v.price;
                        return (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => {
                              setSelectedVariantId(v.id);
                              if (v.image) {
                                setSelectedImage(v.image);
                              } else if (product.image) {
                                setSelectedImage(product.image);
                              }
                            }}
                            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg border transition-all ${
                              isSelected
                                ? "border-[#5C1A24] bg-[#5C1A24] text-white shadow-sm ring-1 ring-[#5C1A24]"
                                : "border-mb-border bg-white hover:border-[#5C1A24]/60 text-mb-text hover:bg-[#5C1A24]/5"
                            }`}
                          >
                            {v.image ? (
                              <img
                                src={v.image}
                                alt={label}
                                className="size-5 rounded-full object-cover border border-black/15 shrink-0"
                              />
                            ) : v.colorHex ? (
                              <span
                                className="size-3.5 rounded-full border border-black/20 shrink-0"
                                style={{ backgroundColor: v.colorHex }}
                              />
                            ) : null}
                            <span>{label}</span>
                            {vPrice ? (
                              <span
                                className={`text-[11px] font-semibold ${
                                  isSelected
                                    ? "text-amber-200"
                                    : v.offerPrice
                                    ? "text-emerald-600"
                                    : "text-mb-muted"
                                }`}
                              >
                                ₹{Number(vPrice).toLocaleString()}
                              </span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Description */}
                <p className="text-sm sm:text-base text-mb-body leading-relaxed mb-6">
                  {product.description || (
                    <>
                      Experience authentic elegance with{" "}
                      <strong className="text-mb-text font-semibold">{product.brand}</strong>.
                      Exquisitely tailored for modest luxury, comfort, and everyday sophistication.
                    </>
                  )}
                </p>
              </div>

              {/* Qty + CTAs */}
              <div className="flex flex-col gap-4 border-t border-mb-border-lite pt-6">

                {/* Quantity selector */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-mb-body uppercase tracking-wider">Quantity:</span>
                  <div
                    className="flex items-center border border-mb-border bg-mb-bg rounded-[8px] overflow-hidden"
                    role="group"
                    aria-label="Select quantity"
                  >
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      onClick={() => setQty((v) => Math.max(1, v - 1))}
                      className="px-3.5 py-1.5 text-sm font-bold text-mb-text hover:bg-mb-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-mb-accent"
                    >
                      −
                    </button>
                    <span className="px-3.5 py-1.5 text-sm font-semibold text-mb-text border-x border-mb-border min-w-[36px] text-center">
                      {qty}
                    </span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      onClick={() => setQty((v) => v + 1)}
                      className="px-3.5 py-1.5 text-sm font-bold text-mb-text hover:bg-mb-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-mb-accent"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Add to bag + wishlist */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    aria-label={flash ? "Added to bag" : "Add to bag"}
                    onClick={handleAddToCart}
                    className={`flex-1 py-3 text-sm font-semibold rounded-[10px] shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-mb-accent ${
                      flash || inCart
                        ? "bg-mb-success text-mb-bg"
                        : "bg-mb-primary hover:bg-mb-primary-hover text-mb-bg"
                    }`}
                  >
                    {flash ? "✓ Added to Bag!" : inCart ? "✓ In Your Bag" : "Add to Bag"}
                  </button>

                  <button
                    type="button"
                    aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                    aria-pressed={wishlisted}
                    onClick={() => toggleWishlist(product)}
                    className={`px-4 py-3 rounded-[10px] border text-base transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-mb-accent ${
                      wishlisted
                        ? "border-mb-accent bg-mb-bg text-mb-accent shadow-sm"
                        : "border-mb-border bg-mb-surface text-mb-muted hover:border-mb-accent hover:text-mb-primary"
                    }`}
                  >
                    {wishlisted ? "♥" : "♡"}
                  </button>
                </div>

                <Link
                  href="/cart"
                  className="block w-full text-center py-3 text-sm font-semibold rounded-[10px] border-[1.5px] border-mb-primary text-mb-primary hover:bg-mb-surface transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-mb-accent"
                >
                  View Shopping Bag
                </Link>
              </div>

              {/* Screen reader live region */}
              <span aria-live="polite" aria-atomic="true" className="sr-only">
                {flash ? `${qty} × ${product.name} added to bag` : ""}
              </span>
            </div>
          </div>

          {/* Customer Reviews Section */}
          <div className="mt-12 bg-mb-surface rounded-[6px] md:rounded-[8px] border border-mb-border shadow-card p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-mb-border-lite">
              <div>
                <h2 className="font-serif text-xl sm:text-2xl font-semibold text-mb-text">
                  Customer Reviews ({reviews.length})
                </h2>
                <p className="text-xs text-mb-muted mt-0.5">
                  Verified impressions from connoisseurs of Moreylla Beauté.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowReviewForm((v) => !v)}
                className="px-4 py-2 text-xs font-semibold rounded-md border border-mb-primary text-mb-primary hover:bg-mb-primary hover:text-white transition-colors self-start sm:self-auto"
              >
                {showReviewForm ? "Close Review Form" : "Write a Review"}
              </button>
            </div>

            {/* Review Form Drawer / Collapsible */}
            {showReviewForm && (
              <div className="mb-8">
                <ReviewForm
                  productId={Number(id)}
                  productName={product.name}
                  onSuccess={refreshReviews}
                />
              </div>
            )}

            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((rev) => (
                  <div key={rev.id} className="pb-4 border-b border-mb-border-lite last:border-b-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="flex items-center gap-0.5 text-xs font-bold text-mb-gold-deep">
                        {"★".repeat(rev.rating)}
                      </span>
                      <span className="text-xs font-semibold text-mb-text">
                        {rev.title || "Verified Purchase"}
                      </span>
                    </div>
                    {rev.body && (
                      <p className="text-xs sm:text-sm text-mb-body mt-1">{rev.body}</p>
                    )}
                    <span className="text-[10px] text-mb-muted mt-1 block">
                      By {rev.user?.firstName || "Customer"} • {new Date(rev.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-mb-muted">
                Be the first to share your thoughts on {product.name}. Click &quot;Write a Review&quot; above to submit your rating.
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params || {};
  if (!id || typeof id !== "string") {
    return { notFound: true };
  }

  try {
    const raw = await productAPI.getById(id);
    if (!raw) {
      return { notFound: true };
    }
    const initialProduct = mapBackendProductToProduct(raw);
    return {
      props: {
        initialProduct,
      },
    };
  } catch (error) {
    console.warn(`[getServerSideProps] Product ${id} not found:`, error);
    return {
      props: {
        initialProduct: null,
      },
    };
  }
};
