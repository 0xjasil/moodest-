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
    <footer className="bg-mb-primary border-t border-mb-primary-hover text-mb-bg" role="contentinfo">

      {/* ── Brand & Tagline Header ──────────────────────────── */}
      <div className="border-b border-mb-primary-hover/60 py-8 px-4">
        <div className="mx-auto max-w-content flex flex-col items-center justify-center text-center">
          <Link href="/" aria-label="Modest Studio" className="inline-block mb-3">
            <BrandLogo variant="gold" className="h-14 md:h-16 w-auto min-w-[96px] max-w-[200px]" />
          </Link>
          <p className="text-xs md:text-sm font-light text-mb-gold uppercase tracking-[0.3em]">
            Beauty Beyond Today
          </p>
        </div>
      </div>

      {/* ── App + Social strip ──────────────────────────────── */}
      <div className="border-b border-mb-primary-hover/60">
        <div className="mx-auto max-w-content px-4 md:px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-base font-serif font-semibold text-mb-bg">
              Get Extra 20% Off on Your First Order
            </p>
            <p className="text-xs text-mb-gold mt-0.5">Experience Modest Studio on iOS &amp; Android</p>
          </div>
          <div className="flex gap-2">
            <a
              href="#"
              className="inline-block bg-mb-bg text-mb-primary text-xs font-semibold px-4 py-2.5 rounded-md hover:bg-mb-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mb-accent"
              aria-label="Get Modest Studio on Google Play"
            >
              Google Play
            </a>
            <a
              href="#"
              className="inline-block bg-mb-bg text-mb-primary text-xs font-semibold px-4 py-2.5 rounded-md hover:bg-mb-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mb-accent"
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
                className="flex h-8 w-8 items-center justify-center rounded-full border border-mb-gold/40 bg-mb-primary text-xs font-semibold text-mb-gold hover:bg-mb-bg hover:text-mb-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mb-accent"
              >
                {s.abbr}
              </a>
            ))}
          </nav>
        </div>
      </div>

      {/* ── Links grid ──────────────────────────────────────── */}
      <div className="mx-auto max-w-content px-4 md:px-6 py-10">
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
                        href="#"
                        className="text-xs text-mb-bg/90 hover:text-mb-gold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-mb-accent rounded"
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

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-mb-primary-hover/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-xs text-mb-bg font-medium">
              Customer Concierge: 1800-267-4444
            </p>
            <p className="text-[11px] text-mb-gold/80 mt-0.5">Available 7 days a week, 8 AM – 10 PM IST</p>
          </div>
          <nav className="flex gap-5" aria-label="Legal links">
            {["Privacy Policy", "Terms of Service", "Sitemap"].map(l => (
              <a
                key={l}
                href="#"
                className="text-xs text-mb-gold hover:text-mb-bg transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-mb-accent rounded"
              >
                {l}
              </a>
            ))}
          </nav>
          <p className="text-xs text-mb-gold/80">© 2026 Modest Studio. All rights reserved.</p>
        </div>
      </div>

    </footer>
  );
}
