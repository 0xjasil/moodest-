import React, { useState } from "react";
import Head from "next/head";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";

import HeroCarousel from "@/components/moodest/HeroCarousel";
import DiscoverCategories from "@/components/moodest/DiscoverCategories";
import OfferGifsCarousel from "@/components/moodest/OfferGifsCarousel";
import TopBrandsSection from "@/components/moodest/TopBrandsSection";
import UnmissableOffers from "@/components/moodest/UnmissableOffers";
import CuratedAbayas from "@/components/moodest/CuratedAbayas";
import HotListProducts from "@/components/moodest/HotListProducts";
import SpotlightSection from "@/components/moodest/SpotlightSection";
import RadarSection from "@/components/moodest/RadarSection";

export default function Home() {
  const [showAppBanner, setShowAppBanner] = useState(true);

  return (
    <>
      <Head>
        <title>Modest Studio: Premium Abaya | Modest Wears &amp; Accessories</title>
        <meta
          name="description"
          content="Discover luxury abayas, open front kimonos, silk kaftans, and modest accessories at Modest Studio."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </Head>

      {/* 1. Header (Modest Studio) */}
      <Header />

      <main id="main-content" className="min-h-screen bg-mb-bg w-full overflow-x-hidden">
        {/* 2. Top Banner — 100% Full Width Edge-to-Edge Without Gaps */}
        <div className="w-full mb-4 sm:mb-6">
          <Link href="/category/all" className="block w-full">
            <img
              src="/banners/top-promo-banner.jpg"
              alt="Modest Studio — Premium Abaya & Modest Wear New Arrivals"
              className="w-full h-auto object-cover object-center"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.includes("/abaya/banners/top-promo-banner.jpg")) {
                  target.src = "/abaya/banners/top-promo-banner.jpg";
                }
              }}
            />
          </Link>
        </div>

        {/* 3. Hero Carousel Cards */}
        <HeroCarousel />

        {/* 4. Discover Categories (Ovais Abaya Collection Style) */}
        <DiscoverCategories />

        {/* 5. Category Highlights Banner — Full Width Left to Right Without Gaps */}
        <div className="w-full my-6 sm:my-8">
          <Link href="/category/all" className="block w-full">
            <img
              src="/banners/category-highlights-banner.jpg"
              alt="Curated Abaya Highlights — Modest Studio"
              className="w-full h-auto object-cover object-center"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.includes("/abaya/banners/category-highlights-banner.jpg")) {
                  target.src = "/abaya/banners/category-highlights-banner.jpg";
                }
              }}
            />
          </Link>
        </div>

        {/* 6. Animated Carousel */}
        <OfferGifsCarousel />

        {/* 7. Top Brands Section */}
        <TopBrandsSection />

        {/* 8. Unmissable Offers */}
        <UnmissableOffers />

        {/* 9. Curated Signature Abayas */}
        <CuratedAbayas />

        {/* 10. Hot List Icons */}
        <HotListProducts />

        {/* 11. In The Spotlight */}
        <SpotlightSection />

        {/* 12. On Our Radar */}
        <RadarSection />

        {/* 13. Bottom Feature Banner — Full Width Left to Right Without Gaps */}
        <div className="w-full my-8 sm:my-10">
          <Link href="/category/all" className="block w-full">
            <img
              src="/banners/timeless-beauty-banner.jpg"
              alt="Modest Studio — Grace In Every Fold"
              className="w-full h-auto object-cover object-center"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.includes("/abaya/banners/timeless-beauty-banner.jpg")) {
                  target.src = "/abaya/banners/timeless-beauty-banner.jpg";
                }
              }}
            />
          </Link>
        </div>

        {/* 14. Store Brand Statement with Brand Logo */}
        <div className="w-full px-4 sm:px-6 py-14 text-center bg-mb-surface border-t border-mb-border">
          <BrandLogo variant="primary" className="h-16 sm:h-20 w-auto mx-auto mb-3" />
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-mb-primary mb-2">
            Modest Studio
          </h2>
          <p className="text-xs sm:text-sm font-light text-mb-muted uppercase tracking-[0.3em]">
            Premium Abaya • Modest Wears • Accessories
          </p>
        </div>
      </main>

      {/* Floating Widgets */}
      {/* 1. App Promotion QR Widget (Bottom-Left) */}
      {showAppBanner && (
        <aside
          aria-label="App Download Promotion"
          className="fixed bottom-5 left-5 z-40 hidden md:flex items-center gap-3 bg-mb-surface p-3.5 rounded-[12px] shadow-dropdown border border-mb-border animate-fade-in"
        >
          <div className="w-12 h-12 bg-mb-bg border border-mb-border rounded-[8px] p-1 flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" className="w-full h-full text-mb-primary" fill="currentColor">
              <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm10-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm14 0h-4v2h2v2h-2v2h4v-2h2v-2h-2v-2zm-2-2h4v2h-4v-2zm2 6h2v2h-2v-2z" />
            </svg>
          </div>
          <div className="text-left pr-2">
            <p className="font-serif text-xs font-semibold text-mb-text leading-tight">Exclusive Offers On App</p>
            <p className="text-[11px] text-mb-muted mt-0.5">Scan to download Modest Studio App</p>
          </div>
          <button
            onClick={() => setShowAppBanner(false)}
            aria-label="Close app download banner"
            className="w-6 h-6 flex items-center justify-center text-mb-muted hover:text-mb-text transition-colors rounded-full hover:bg-mb-bg"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </aside>
      )}

      {/* 2. Customer Service Floating Concierge Button (Bottom-Right) */}
      <aside aria-label="Customer Support Concierge" className="fixed bottom-5 right-5 z-40">
        <button
          aria-label="Contact Modest Studio Concierge"
          onClick={() => alert("Modest Studio Concierge: Advisors available daily, 8 AM - 10 PM.")}
          className="group flex items-center gap-2.5 bg-mb-primary text-mb-bg px-4 py-3 rounded-full shadow-dropdown hover:bg-mb-primary-hover border border-mb-primary-hover transition-all duration-300 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mb-accent"
        >
          <svg className="w-5 h-5 flex-shrink-0 text-mb-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <span className="font-serif text-xs sm:text-sm font-semibold tracking-wide">
            Modest Concierge
          </span>
        </button>
      </aside>

      {/* 15. Footer (Modest Studio) */}
      <Footer />
    </>
  );
}
