import React from "react";
import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";

/* ── Data ───────────────────────────────────────────────────────────── */
const LINKS = [
  {
    title: "Abaya Collections",
    items: [
      "Front Open Abayas",
      "Double Shrug Sets",
      "Basic Kaftans",
      "Daily Wear Abayas",
      "Kimono Silhouettes",
      "Embroidery Abayas",
      "Handwork & Bridal",
      "Malaysian Stoles",
    ],
  },
  {
    title: "Maison",
    items: ["About Modest Studio", "Our Artisans", "Press & Editorial", "Sustainable Fabrics", "Lookbook 2026"],
  },
  {
    title: "Concierge",
    items: ["Track Order", "Size Guide (50-62)", "Shipping & Delivery", "Returns & Exchanges", "Custom Stitching", "Contact Us"],
  },
  {
    title: "Account",
    items: ["Sign In", "Create Account", "Order History", "Wishlist", "Modest Studio Rewards"],
  },
  {
    title: "Boutiques",
    items: ["Dubai Flagship", "Abu Dhabi Boutique", "London Studio", "Mumbai Trunk Show", "Worldwide Delivery"],
  },
];

const SOCIALS = [
  { label: "Facebook",  abbr: "Fb" },
  { label: "Instagram", abbr: "In" },
  { label: "Twitter",   abbr: "Tw" },
  { label: "YouTube",   abbr: "Yt" },
  { label: "Pinterest", abbr: "Pi" },
];

/* ── Component ────────────────────────────────────────────────────────── */
export default function Footer() {
  return (
    <footer className="bg-mb-primary border-t border-white/10 text-mb-bg" role="contentinfo">

      {/* ── Brand & Tagline Header ──────────────────────────── */}
      <div className="border-b border-white/10 py-10 px-4">
        <div className="mx-auto max-w-content flex flex-col items-center justify-center text-center">
          <Link href="/" aria-label="Modest Studio" className="inline-block mb-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mb-gold rounded">
            <BrandLogo variant="gold" className="h-12 md:h-14 w-auto min-w-[96px] max-w-[200px]" />
          </Link>
          <p className="text-xs md:text-sm font-light text-mb-gold uppercase tracking-[0.3em]">
            Beauty Beyond Today
          </p>
        </div>
      </div>

      {/* ── App + Social strip ──────────────────────────────── */}
      <div className="border-b border-white/10 bg-mb-primary-hover/50">
        <div className="mx-auto max-w-content px-4 md:px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-base font-serif font-semibold text-white">
              Get Extra 20% Off on Your First Order
            </p>
            <p className="text-xs text-mb-gold mt-0.5">Experience Modest Studio on iOS &amp; Android</p>
          </div>
          <div className="flex gap-2">
            <a
              href="#"
              className="inline-block bg-mb-gold text-mb-primary text-xs font-semibold px-4 py-2 rounded hover:bg-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="Get Modest Studio on Google Play"
            >
              Google Play
            </a>
            <a
              href="#"
              className="inline-block bg-white/10 text-white border border-white/20 text-xs font-semibold px-4 py-2 rounded hover:bg-white hover:text-mb-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="Download Modest Studio on App Store"
            >
              App Store
            </a>
          </div>
          <nav aria-label="Social media links" className="flex gap-2">
            {SOCIALS.map(s => (
              <a
                key={s.label}
                href="#"
                aria-label={s.label}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/5 text-xs font-semibold text-mb-gold hover:bg-white hover:text-mb-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mb-gold"
              >
                {s.abbr}
              </a>
            ))}
          </nav>
        </div>
      </div>

      {/* ── Links grid ──────────────────────────────────────── */}
      <div className="mx-auto max-w-content px-4 md:px-6 py-12">
        <nav aria-label="Footer navigation">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:grid-cols-5">
            {LINKS.map(section => (
              <div key={section.title}>
                <h3 className="text-xs font-semibold text-mb-gold uppercase tracking-[0.2em] mb-4">
                  {section.title}
                </h3>
                <ul className="flex flex-col gap-2.5" role="list">
                  {section.items.map(item => (
                    <li key={item} role="listitem">
                      <Link
                        href="/category/all"
                        className="text-xs text-white/80 hover:text-mb-gold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-mb-gold rounded"
                      >
                        {item}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </nav>

        {/* Bottom bar divider and legal links */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-xs text-white/90 font-medium">
              Customer Concierge: 1800-267-4444
            </p>
            <p className="text-[11px] text-mb-gold/80 mt-0.5">Available 7 days a week, 8 AM – 10 PM IST</p>
          </div>
          <nav className="flex gap-5" aria-label="Legal links">
            {["Privacy Policy", "Terms of Service", "Sitemap"].map(l => (
              <a
                key={l}
                href="#"
                className="text-xs text-white/70 hover:text-mb-gold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-mb-gold rounded"
              >
                {l}
              </a>
            ))}
          </nav>
          <p className="text-xs text-white/60">© 2026 Modest Studio. All rights reserved.</p>
        </div>
      </div>

    </footer>
  );
}
