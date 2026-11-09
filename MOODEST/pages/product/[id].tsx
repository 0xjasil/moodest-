import React, { useState, useEffect, useMemo } from "react";
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
  const [pincode, setPincode] = useState("");
  const [deliveryStatus, setDeliveryStatus] = useState<string | null>(null);
  const [showSizeGuide, setShowSizeGuide] = useState(false);

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

  const variants = product?.variants || [];

  // Extract unique colors and sizes like Flipkart
  const colors = useMemo(() => {
    const list: Array<{ name: string; hex?: string | null; image?: string | null }> = [];
    const seen = new Set<string>();
    variants.forEach((v: any, idx: number) => {
      const cName = v.color ? v.color.trim() : "";
      if (cName && !seen.has(cName.toLowerCase())) {
        seen.add(cName.toLowerCase());
        const fallbackImg = (product?.images && product.images[idx % product.images.length]) || product?.image;
        list.push({
          name: cName,
          hex: v.colorHex || null,
          image: v.image || fallbackImg || null,
        });
      }
    });
    return list;
  }, [variants, product]);

  const sizes = useMemo(() => {
    const list: string[] = [];
    const seen = new Set<string>();
    variants.forEach((v: any) => {
      const sName = v.size ? String(v.size).trim() : "";
      if (sName && !seen.has(sName)) {
        seen.add(sName);
        list.push(sName);
      }
    });
    return list;
  }, [variants]);

  const activeVariant = useMemo(() => {
    if (!selectedVariantId) return variants[0] || null;
    return variants.find((v: any) => String(v.id) === String(selectedVariantId)) || variants[0] || null;
  }, [variants, selectedVariantId]);

  const selectedColor = activeVariant?.color || (colors[0]?.name ?? "");
  const selectedSize = activeVariant?.size || (sizes[0] ?? "");

  // Update variant when color is clicked
  const handleSelectColor = (colorName: string) => {
    // Find matching variant with same size or fallback to first of that color
    const match =
      variants.find((v: any) => v.color?.toLowerCase() === colorName.toLowerCase() && String(v.size) === String(selectedSize)) ||
      variants.find((v: any) => v.color?.toLowerCase() === colorName.toLowerCase());

    if (match) {
      setSelectedVariantId(match.id);
      const vIdx = variants.indexOf(match);
      const vImg = match.image || (product?.images && product.images[vIdx % product.images.length]) || product?.image;
      if (vImg) setSelectedImage(vImg);
    }
  };

  // Update variant when size is clicked
  const handleSelectSize = (sizeName: string) => {
    // Find matching variant with same color or fallback to first of that size
    const match =
      variants.find((v: any) => String(v.size) === String(sizeName) && v.color?.toLowerCase() === selectedColor.toLowerCase()) ||
      variants.find((v: any) => String(v.size) === String(sizeName));

    if (match) {
      setSelectedVariantId(match.id);
      const vIdx = variants.indexOf(match);
      const vImg = match.image || (product?.images && product.images[vIdx % product.images.length]) || product?.image;
      if (vImg) setSelectedImage(vImg);
    }
  };

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

  const inCart = items.some((i) => i.product.id === product.id);
  const wishlisted = isWishlisted(product.id);

  // Dynamic Price calculations
  const displayPrice = activeVariant?.offerPrice ?? activeVariant?.price ?? product.price;
  const displayOriginalPrice =
    activeVariant?.offerPrice && activeVariant?.price
      ? activeVariant.price
      : !activeVariant
      ? product.originalPrice
      : activeVariant?.price && Number(activeVariant.price) > Number(displayPrice)
      ? activeVariant.price
      : undefined;

  const discountPct =
    displayOriginalPrice && Number(displayOriginalPrice) > Number(displayPrice)
      ? Math.round(((Number(displayOriginalPrice) - Number(displayPrice)) / Number(displayOriginalPrice)) * 100)
      : product.discount;

  const currentStock = activeVariant?.stock ?? activeVariant?.qty ?? 10;

  const handleAddToCart = () => {
    const itemToAdd: Product = {
      ...product,
      price: Number(displayPrice),
      originalPrice: displayOriginalPrice ? Number(displayOriginalPrice) : undefined,
      discount: discountPct,
      variantId: activeVariant?.id || product.variantId,
      image: selectedImage || product.image,
    };
    for (let i = 0; i < qty; i++) {
      addItem(itemToAdd);
    }
    setFlash(true);
    setTimeout(() => setFlash(false), 2500);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push("/checkout");
  };

  const handlePincodeCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (/^\d{6}$/.test(pincode.trim())) {
      setDeliveryStatus(`Express Delivery to ${pincode.trim()} by 3-5 Business Days. Free Delivery Available!`);
    } else {
      setDeliveryStatus("Please enter a valid 6-digit Indian delivery pincode.");
    }
  };

  const allGalleryImages = Array.from(
    new Set(
      [
        product.image,
        ...(product.images || []),
        ...variants.map((v: any) => v.image).filter(Boolean),
      ].filter((url): url is string => Boolean(url && typeof url === "string" && !url.includes("placeholder.png")))
    )
  );

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
      <main id="main-content" className="min-h-screen bg-mb-bg py-6 sm:py-8">
        <div className="mx-auto max-w-[1280px] px-4 md:px-6">

          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-5">
            <ol className="flex items-center gap-1.5 text-xs text-mb-muted" role="list">
              <li role="listitem">
                <Link href="/" className="hover:text-[#5C1A24] transition-colors">
                  Home
                </Link>
              </li>
              <li role="listitem" aria-hidden="true" className="text-mb-dusty">/</li>
              <li role="listitem">
                <Link href={`/category/${product.category}`} className="capitalize hover:text-[#5C1A24] transition-colors">
                  {product.category}
                </Link>
              </li>
              <li role="listitem" aria-hidden="true" className="text-mb-dusty">/</li>
              <li role="listitem" className="text-mb-text font-semibold truncate max-w-[280px]" aria-current="page">
                {product.name}
              </li>
            </ol>
          </nav>

          {/* Flipkart-Style Main Grid: Gallery on Left, Details on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* ── Left Side: Flipkart Gallery (Vertical Thumbnails + Main Viewport) ── */}
            <div className="lg:col-span-6 flex flex-col-reverse md:flex-row gap-4 sticky top-20">

              {/* Vertical Thumbnail Strip (Flipkart style on desktop) */}
              {allGalleryImages.length > 1 && (
                <div
                  className="flex md:flex-col gap-2.5 overflow-x-auto md:overflow-y-auto max-h-[520px] no-scrollbar shrink-0"
                  role="tablist"
                  aria-label="Product thumbnails"
                >
                  {allGalleryImages.map((imgUrl, idx) => {
                    const isSelected = (selectedImage || product.image) === imgUrl;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onMouseEnter={() => setSelectedImage(imgUrl)}
                        onClick={() => setSelectedImage(imgUrl)}
                        aria-label={`View photo ${idx + 1}`}
                        className={`size-16 sm:size-20 rounded-[6px] border p-1 shrink-0 overflow-hidden bg-white transition-all ${
                          isSelected
                            ? "border-[#5C1A24] ring-2 ring-[#5C1A24]/30 shadow-xs"
                            : "border-gray-200 hover:border-[#5C1A24]/60 opacity-80 hover:opacity-100"
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
              )}

              {/* Main Image Viewport with zoom preview */}
              <div className="flex-1 bg-white rounded-[8px] border border-mb-border shadow-card p-6 sm:p-8 flex items-center justify-center min-h-[420px] sm:min-h-[520px] relative overflow-hidden group">
                {wishlisted && (
                  <span className="absolute top-4 left-4 z-10 bg-[#5C1A24] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs uppercase tracking-wider">
                    Wishlisted
                  </span>
                )}
                <button
                  type="button"
                  aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                  onClick={() => toggleWishlist(product)}
                  className={`absolute top-4 right-4 z-10 size-9 rounded-full border flex items-center justify-center transition-all shadow-xs ${
                    wishlisted
                      ? "bg-[#5C1A24] border-[#5C1A24] text-white"
                      : "bg-white/90 border-gray-200 text-gray-500 hover:text-[#5C1A24] hover:bg-white"
                  }`}
                >
                  <span className="text-lg leading-none">{wishlisted ? "♥" : "♡"}</span>
                </button>

                <img
                  src={selectedImage || product.image}
                  alt={product.name}
                  loading="eager"
                  fetchPriority="high"
                  className="max-h-[480px] w-auto max-w-full object-contain transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.src.includes("unsplash.com")) {
                      target.src = "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80";
                    }
                  }}
                />
              </div>
            </div>

            {/* ── Right Side: Flipkart Style Product Info & Selectors ── */}
            <div className="lg:col-span-6 flex flex-col gap-5 bg-mb-surface rounded-[8px] border border-mb-border shadow-card p-6 sm:p-8">

              {/* Brand & Title */}
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#5C1A24]">
                    {product.brand || "Modest Studio"}
                  </span>
                  {product.badge && (
                    <span className="bg-[#C6A477] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs uppercase">
                      {product.badge}
                    </span>
                  )}
                </div>
                <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-mb-text leading-snug">
                  {product.name}
                </h1>

                {/* Rating & Review Counter */}
                <div className="flex items-center gap-3 mt-2.5">
                  <span
                    className="flex items-center gap-1 bg-[#5C1A24] text-white text-xs font-bold px-2 py-0.5 rounded leading-none"
                    aria-label={`${product.rating} out of 5 stars`}
                  >
                    {product.rating} ★
                  </span>
                  <span className="text-xs text-mb-muted font-medium">
                    {(product.reviewCount || reviews.length || 120).toLocaleString()} Verified Ratings &amp; Reviews
                  </span>
                </div>
              </div>

              {/* Flipkart Price Display */}
              <div className="border-y border-mb-border py-4">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl sm:text-4xl font-bold text-mb-text">
                    ₹{Number(displayPrice).toLocaleString()}
                  </span>
                  {displayOriginalPrice && Number(displayOriginalPrice) > Number(displayPrice) && (
                    <span className="text-base text-gray-400 line-through">
                      ₹{Number(displayOriginalPrice).toLocaleString()}
                    </span>
                  )}
                  {discountPct && discountPct > 0 ? (
                    <span className="text-base font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                      {discountPct}% off
                    </span>
                  ) : null}
                </div>
                <p className="text-[11px] text-gray-500 mt-1">Inclusive of all taxes</p>

                {/* Stock Status Badge */}
                <div className="mt-2.5 flex items-center gap-2">
                  {currentStock > 5 ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded">
                      <span className="size-1.5 rounded-full bg-emerald-600" />
                      In Stock ({currentStock} available)
                    </span>
                  ) : currentStock > 0 ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded">
                      <span className="size-1.5 rounded-full bg-amber-600" />
                      Only {currentStock} left in stock - order soon!
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 bg-red-50 px-2.5 py-1 rounded">
                      <span className="size-1.5 rounded-full bg-red-600" />
                      Out of Stock
                    </span>
                  )}
                </div>
              </div>

              {/* ── Flipkart Color Selector (If multiple colors exist) ── */}
              {colors.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-700 uppercase tracking-wider">
                      Color: <strong className="text-mb-text capitalize">{selectedColor}</strong>
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {colors.map((c) => {
                      const isSelected = c.name.toLowerCase() === selectedColor.toLowerCase();
                      return (
                        <button
                          key={c.name}
                          type="button"
                          onClick={() => handleSelectColor(c.name)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-[6px] border text-xs font-medium transition-all ${
                            isSelected
                              ? "border-[#5C1A24] bg-[#5C1A24]/5 text-[#5C1A24] ring-2 ring-[#5C1A24]/30 font-semibold"
                              : "border-gray-200 bg-white hover:border-[#5C1A24]/50 text-gray-700"
                          }`}
                        >
                          {c.image ? (
                            <img
                              src={c.image}
                              alt={c.name}
                              className="size-5 rounded-full object-cover border border-black/10"
                            />
                          ) : c.hex ? (
                            <span
                              className="size-4 rounded-full border border-black/20"
                              style={{ backgroundColor: c.hex }}
                            />
                          ) : null}
                          <span>{c.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Flipkart Size Selector ── */}
              {sizes.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-700 uppercase tracking-wider">
                      Select Size: <strong className="text-mb-text">{selectedSize ? `Size ${selectedSize}` : "Select"}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowSizeGuide(!showSizeGuide)}
                      className="text-xs font-semibold text-[#5C1A24] hover:underline"
                    >
                      Size Chart &amp; Guide
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    {sizes.map((s) => {
                      const isSelected = String(s) === String(selectedSize);
                      // Find variant for price difference preview
                      const vMatch = variants.find((v: any) => String(v.size) === String(s));
                      const vP = vMatch?.offerPrice ?? vMatch?.price;
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => handleSelectSize(s)}
                          className={`min-w-[64px] px-3.5 py-2 rounded-[6px] border text-xs font-bold transition-all text-center flex flex-col items-center justify-center ${
                            isSelected
                              ? "border-[#5C1A24] bg-[#5C1A24] text-white shadow-xs"
                              : "border-gray-200 bg-white hover:border-[#5C1A24]/60 text-gray-800 hover:bg-gray-50"
                          }`}
                        >
                          <span>Size {s}</span>
                          {vP ? (
                            <span className={`text-[10px] font-normal mt-0.5 ${isSelected ? "text-amber-200" : "text-gray-500"}`}>
                              ₹{Number(vP).toLocaleString()}
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>

                  {/* Size Guide Collapsible Modal */}
                  {showSizeGuide && (
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs space-y-1.5 animate-in fade-in duration-200">
                      <p className="font-bold text-gray-900">Abaya Length Recommendation Guide:</p>
                      <ul className="grid grid-cols-2 gap-1 text-[11px] text-gray-600">
                        <li>• Size 50: Height 5&apos;0&quot; - 5&apos;1&quot;</li>
                        <li>• Size 52: Height 5&apos;2&quot; - 5&apos;3&quot;</li>
                        <li>• Size 54: Height 5&apos;4&quot; - 5&apos;5&quot;</li>
                        <li>• Size 56: Height 5&apos;6&quot; - 5&apos;7&quot;</li>
                        <li>• Size 58: Height 5&apos;8&quot; - 5&apos;9&quot;</li>
                        <li>• Size 60: Height 5&apos;10&quot;+</li>
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Quantity */}
              <div className="flex items-center gap-3 pt-1">
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Quantity:</span>
                <div
                  className="flex items-center border border-gray-300 bg-white rounded-[6px] overflow-hidden"
                  role="group"
                  aria-label="Select quantity"
                >
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    onClick={() => setQty((v) => Math.max(1, v - 1))}
                    className="px-3.5 py-1.5 text-sm font-bold text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    −
                  </button>
                  <span className="px-3.5 py-1.5 text-xs font-bold text-gray-900 border-x border-gray-300 min-w-[36px] text-center">
                    {qty}
                  </span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    onClick={() => setQty((v) => Math.min(currentStock || 10, v + 1))}
                    className="px-3.5 py-1.5 text-sm font-bold text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* ── Flipkart Action Buttons: Add to Bag & Buy Now ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={currentStock <= 0}
                  className={`w-full py-3.5 px-4 text-sm font-bold rounded-[8px] transition-all flex items-center justify-center gap-2 shadow-sm ${
                    currentStock <= 0
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : flash || inCart
                      ? "bg-emerald-600 text-white"
                      : "bg-[#5C1A24] hover:bg-[#42121B] text-white"
                  }`}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 01-8 0" />
                  </svg>
                  <span>{flash ? "✓ Added to Bag!" : inCart ? "✓ In Your Bag" : "Add to Bag"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={currentStock <= 0}
                  className={`w-full py-3.5 px-4 text-sm font-bold rounded-[8px] transition-all flex items-center justify-center gap-2 shadow-sm ${
                    currentStock <= 0
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-[#C6A477] hover:bg-[#B59366] text-white"
                  }`}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                  <span>Buy Now</span>
                </button>
              </div>

              {/* Flipkart Delivery Pincode Checker */}
              <div className="border border-gray-200 bg-gray-50/70 rounded-lg p-3.5 space-y-2 mt-2">
                <span className="text-xs font-semibold text-gray-700 block">Delivery Options &amp; Services:</span>
                <form onSubmit={handlePincodeCheck} className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Enter 6-digit Pincode"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                    className="flex-1 px-3 py-1.5 text-xs bg-white border border-gray-300 rounded focus:outline-none focus:border-[#5C1A24]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-bold text-[#5C1A24] bg-white border border-[#5C1A24] hover:bg-[#5C1A24] hover:text-white rounded transition-colors"
                  >
                    Check
                  </button>
                </form>
                {deliveryStatus && (
                  <p className="text-xs text-emerald-700 font-medium pt-1">
                    {deliveryStatus}
                  </p>
                )}
                <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600 pt-1">
                  <span>🚚 Free Shipping over ₹999</span>
                  <span>💵 Cash on Delivery Available</span>
                  <span>🔄 7 Days Easy Return/Exchange</span>
                  <span>✨ 100% Quality Assurance</span>
                </div>
              </div>

              {/* Description & Specifications Table (Flipkart style) */}
              <div className="border-t border-gray-200 pt-4 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">Product Specifications</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden text-xs">
                  <div className="grid grid-cols-3 p-2.5 bg-gray-50 border-b border-gray-200">
                    <span className="text-gray-500">Fabric</span>
                    <span className="col-span-2 font-medium text-gray-900 capitalize">{product.fabric || "Premium Crepe / Linen"}</span>
                  </div>
                  <div className="grid grid-cols-3 p-2.5 bg-white border-b border-gray-200">
                    <span className="text-gray-500">Style / Category</span>
                    <span className="col-span-2 font-medium text-gray-900 capitalize">{product.category}</span>
                  </div>
                  <div className="grid grid-cols-3 p-2.5 bg-gray-50 border-b border-gray-200">
                    <span className="text-gray-500">Colorway</span>
                    <span className="col-span-2 font-medium text-gray-900 capitalize">{selectedColor || "Standard"}</span>
                  </div>
                  <div className="grid grid-cols-3 p-2.5 bg-white">
                    <span className="text-gray-500">Care Instructions</span>
                    <span className="col-span-2 font-medium text-gray-900">Dry Clean or Gentle Machine Wash</span>
                  </div>
                </div>

                {product.description && (
                  <div className="text-xs text-gray-600 leading-relaxed pt-2">
                    <strong className="text-gray-900 block mb-1">Product Details:</strong>
                    {product.description}
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Customer Reviews Section */}
          <div className="mt-12 bg-mb-surface rounded-[8px] border border-mb-border shadow-card p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-mb-border-lite">
              <div>
                <h2 className="font-serif text-xl sm:text-2xl font-semibold text-mb-text">
                  Customer Reviews ({reviews.length})
                </h2>
                <p className="text-xs text-mb-muted mt-0.5">
                  Verified impressions from connoisseurs of Modest Studio.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowReviewForm((v) => !v)}
                className="px-4 py-2 text-xs font-semibold rounded-md border border-[#5C1A24] text-[#5C1A24] hover:bg-[#5C1A24] hover:text-white transition-colors self-start sm:self-auto"
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
                  onSuccess={() => {
                    if (id) {
                      reviewAPI.getByProduct(id as string).then((d: any) => {
                        if (d && Array.isArray(d.reviews)) setReviews(d.reviews);
                        setShowReviewForm(false);
                      });
                    }
                  }}
                />
              </div>
            )}

            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((rev) => (
                  <div key={rev.id} className="pb-4 border-b border-mb-border-lite last:border-b-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="flex items-center gap-0.5 text-xs font-bold text-[#C6A477]">
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
