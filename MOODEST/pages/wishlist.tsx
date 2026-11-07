import React from "react";
import Head from "next/head";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { useWishlist } from "@/context/WishlistContext";
import BrandLogo from "@/components/BrandLogo";

export default function Wishlist() {
  const { products, wishlistCount } = useWishlist();

  return (
    <>
      <Head>
        <title>My Wishlist | Modest Studio</title>
      </Head>
      <Header />
      <main id="main-content" className="min-h-screen bg-mb-bg py-8">
        <div className="mx-auto max-w-content px-4 md:px-6">

          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-5">
            <ol className="flex items-center gap-2 text-xs text-mb-muted" role="list">
              <li role="listitem">
                <Link href="/" className="hover:text-mb-primary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-mb-accent rounded">
                  Home
                </Link>
              </li>
              <li role="listitem" aria-hidden="true" className="text-mb-dusty">/</li>
              <li role="listitem" className="text-mb-text font-semibold" aria-current="page">
                Wishlist
              </li>
            </ol>
          </nav>

          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-mb-text mb-6">
            Saved Curations ({wishlistCount} {wishlistCount === 1 ? "item" : "items"})
          </h1>

          {products.length === 0 ? (
            /* ── Empty state with Emblem Only ───────────────── */
            <div className="bg-mb-surface rounded-[14px] border border-mb-border shadow-card p-12 text-center max-w-md mx-auto my-8">
              <div className="flex justify-center mb-4">
                <BrandLogo variant="emblem" className="w-16 h-16 opacity-80" />
              </div>
              <h2 className="font-serif text-xl font-semibold text-mb-text mb-2">Your Wishlist is Empty</h2>
              <p className="text-xs sm:text-sm text-mb-body mb-6">
                Save creations you desire by tapping the heart icon on any piece.
              </p>
              <Link
                href="/"
                className="inline-block bg-mb-primary hover:bg-mb-primary-hover text-mb-bg text-sm font-semibold px-8 py-3 rounded-[10px] shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mb-accent"
              >
                Discover Creations
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
