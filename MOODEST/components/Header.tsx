/**
 * Header — exact Modest Studio 3-tier structure from Playwright MCP snapshots:
 * Tier 1: announcement bar + [Get App, Store & Events, Gift Card, Help]
 * Tier 2: logo | primary nav [Categories, Brands, Luxe, Fashion, Beauty Advice] | search | [Sign in, Bag]
 * Tier 3: category nav [makeup, skin, hair, appliances, Bath & Body, Natural, mom & baby, Health & Wellness, men, fragrance, Fashion Selects, Offers]
 */
import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { products } from "@/components/ProductGrid";
import BrandLogo from "@/components/BrandLogo";
import { categoryAPI } from "@/lib/api";

/* ── SVG icons ────────────────────────────────────────────────── */
const MobileIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
    <line x1="12" y1="18" x2="12.01" y2="18" />
  </svg>
);
const LocationIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);
const GiftCardIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 12 20 22 4 22 4 12" />
    <rect x="2" y="7" width="20" height="5" />
    <line x1="12" y1="22" x2="12" y2="7" />
    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
    <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
  </svg>
);
const HelpIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

/* ── Data — exact Modest Studio labels from snapshots ─────────────────── */
const TOP_LINKS = [
  { label: "Get App",         href: "#", icon: MobileIcon },
  { label: "Store & Events",  href: "#", icon: LocationIcon },
  { label: "Gift Card",       href: "#", icon: GiftCardIcon },
  { label: "Help",            href: "#", icon: HelpIcon },
];

export interface NavCategoryItem {
  id?: string | number;
  label: string;
  href: string;
  children?: { id?: string | number; label: string; href: string }[];
  accent?: boolean;
}

const DEFAULT_CATEGORY_NAV: NavCategoryItem[] = [
  {
    label: "Everyday Abayas",
    href: "/category/everyday-abayas",
    children: [
      { label: "Front Open Abayas", href: "/category/front-open-abayas" },
      { label: "Pull-over Closed Abayas", href: "/category/pull-over-closed-abayas" },
    ],
  },
  {
    label: "Occasion & Luxury Abayas",
    href: "/category/occasion-luxury-abayas",
    children: [
      { label: "Hand-Embroidered Luxury", href: "/category/hand-embroidered-luxury" },
      { label: "Bridal Velvet Abayas", href: "/category/bridal-velvet-abayas" },
    ],
  },
  {
    label: "Jilbabs & Khimars",
    href: "/category/jilbabs-khimars",
    children: [
      { label: "French Khimars", href: "/category/french-khimars" },
    ],
  },
  {
    label: "Hijabs & Stoles",
    href: "/category/hijabs-stoles",
    children: [
      { label: "Malaysian Instant Stoles", href: "/category/malaysian-instant-stoles" },
    ],
  },
  {
    label: "All Collections",
    href: "/category/all",
    accent: true,
  },
];
const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const BagIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 01-8 0" />
  </svg>
);
const ChevronDown = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const MenuIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

/* ── Component ────────────────────────────────────────────────── */
export default function Header() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const [searchVal, setSearchVal] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const navContainerRef = useRef<HTMLElement>(null);
  const { itemCount } = useCart();
  const { wishlistCount } = useWishlist();

  // Dynamic categories from backend CMS / database
  const [navCategories, setNavCategories] = useState<NavCategoryItem[]>(DEFAULT_CATEGORY_NAV);

  useEffect(() => {
    let isSubscribed = true;
    categoryAPI
      .getAll()
      .then((data: any) => {
        if (!isSubscribed || !data) return;
        const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
        if (list.length === 0) return;
        const formatted: NavCategoryItem[] = list.map((cat: any) => ({
          id: cat.id,
          label: cat.name,
          href: `/category/${cat.slug || cat.id}`,
          children: Array.isArray(cat.children)
            ? cat.children.map((sub: any) => ({
                id: sub.id,
                label: sub.name,
                href: `/category/${sub.slug || sub.id}`,
              }))
            : undefined,
        }));
        formatted.push({ label: "All Collections", href: "/category/all", accent: true });
        setNavCategories(formatted);
      })
      .catch(() => {});
    return () => {
      isSubscribed = false;
    };
  }, []);

  // Search results
  const searchResults = React.useMemo(() => {
    const q = searchVal.trim().toLowerCase();
    if (!q) return [];
    return products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [searchVal]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchVal.trim()) return;
    setSearchFocused(false);
    router.push(`/category/all?q=${encodeURIComponent(searchVal.trim())}`);
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setSearchFocused(false);
        setActiveMenu(null);
        setUserDropdownOpen(false);
      }
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
      if (navContainerRef.current && !navContainerRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    window.addEventListener("keydown", h);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("keydown", h);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);



  return (
    <>
      {/* Skip link */}
      <a href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[200] focus:bg-mb-primary focus:text-mb-bg focus:px-3 focus:py-1.5 focus:rounded focus:text-xs focus:font-semibold">
        Skip to main content
      </a>

      <header className="sticky top-0 z-50 bg-mb-bg shadow-sm" role="banner">

        {/* ══ TIER 1: Announcement + top utility links ═════════ */}
        <div className="bg-mb-surface text-mb-primary border-b border-mb-border">
          <div className="mx-auto max-w-content px-4 md:px-6 h-8 flex items-center justify-between">
            {/* Announcement — clickable like Modest Studio "BEAUTY BONANZA" */}
            <Link href="#"
              className="text-[11px] font-semibold tracking-wide truncate hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-mb-accent">
              Get Extra 20% Off on First App Order! Use Code: MODEST20
            </Link>

            {/* Utility list — [Get App, Store & Events, Gift Card, Help] with icons and dividers */}
            <ul className="hidden md:flex items-center text-mb-primary" role="list">
              {TOP_LINKS.map((link, idx) => {
                const IconComponent = link.icon;
                return (
                  <React.Fragment key={link.label}>
                    {idx > 0 && <span className="text-mb-dusty text-[10px] select-none">|</span>}
                    <li role="listitem">
                      <a href={link.href}
                        className="flex items-center gap-1.5 px-2.5 text-[11px] font-medium hover:underline whitespace-nowrap focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-mb-accent">
                        <IconComponent />
                        <span>{link.label}</span>
                      </a>
                    </li>
                  </React.Fragment>
                );
              })}
            </ul>
          </div>
        </div>

        {/* ══ TIER 2: Logo | Primary nav | Search | Actions ════ */}
        <div className="bg-mb-bg border-b border-mb-border">
          <div className="mx-auto max-w-content px-4 md:px-6 h-14 flex items-center gap-3">

            {/* Logo — brand sheet logo: 40px mobile / 44px desktop */}
            <Link href="/" aria-label="Modest Studio — homepage"
              className="flex-shrink-0 mr-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mb-accent rounded flex items-center">
              <BrandLogo variant="secondary" className="h-10 md:h-12 w-auto min-w-[140px] max-w-[220px] md:max-w-[260px]" />
            </Link>

            {/* Primary nav — Categories + Top Dynamic Categories */}
            <nav ref={navContainerRef} className="hidden lg:flex items-center relative" aria-label="Primary navigation">
              <ul className="flex items-center" role="list">
                <li role="listitem" className="relative">
                  <button
                    type="button"
                    onClick={() => setActiveMenu(activeMenu === "Categories" ? null : "Categories")}
                    onMouseEnter={() => setActiveMenu("Categories")}
                    className={`flex items-center gap-1 px-3 py-1 text-[13px] font-medium transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mb-accent rounded ${
                      activeMenu === "Categories" ? "text-mb-primary border-b-2 border-mb-accent font-semibold" : "text-mb-primary hover:text-mb-accent-deep"
                    }`}
                  >
                    <span>Categories</span>
                    <ChevronDown />
                  </button>
                </li>
                {navCategories.filter(c => !c.accent).slice(0, 4).map(item => (
                  <li key={item.label} role="listitem">
                    <Link
                      href={item.href}
                      className="flex items-center gap-1 px-3 py-1 text-[13px] font-medium text-mb-primary hover:text-mb-accent-deep transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mb-accent rounded"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>

              {/* Mega-menu / Dropdown for Categories */}
              {activeMenu === "Categories" && (
                <div
                  onMouseLeave={() => setActiveMenu(null)}
                  className="absolute top-full left-0 mt-2 w-[480px] bg-mb-surface rounded-[6px] shadow-dropdown border border-mb-border p-4 z-50 grid grid-cols-2 gap-4"
                >
                  {navCategories.filter(c => !c.accent).map(cat => (
                    <div key={cat.label} className="space-y-1.5">
                      <Link
                        href={cat.href}
                        onClick={() => setActiveMenu(null)}
                        className="font-semibold text-xs text-mb-primary hover:text-mb-accent-deep block"
                      >
                        {cat.label}
                      </Link>
                      {cat.children && cat.children.length > 0 && (
                        <ul className="space-y-1 pl-2 border-l border-mb-border text-xs text-mb-muted">
                          {cat.children.map(sub => (
                            <li key={sub.label}>
                              <Link
                                href={sub.href}
                                onClick={() => setActiveMenu(null)}
                                className="hover:text-mb-primary block transition-colors"
                              >
                                {sub.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                  <div className="col-span-2 pt-3 border-t border-mb-border flex items-center justify-between text-xs">
                    <span className="text-mb-muted">Modest Studio Boutique</span>
                    <Link
                      href="/category/all"
                      onClick={() => setActiveMenu(null)}
                      className="font-semibold text-mb-primary hover:underline"
                    >
                      View All Collections →
                    </Link>
                  </div>
                </div>
              )}

              {/* Mega-menu / Dropdown for Brands */}
              {activeMenu === "Brands" && (
                <div
                  onMouseLeave={() => setActiveMenu(null)}
                  className="absolute top-full left-12 mt-2 w-[340px] bg-mb-bg rounded-md shadow-lg border border-mb-border p-4 z-50"
                >
                  <h3 className="text-xs font-bold text-mb-accent-deep uppercase tracking-wider mb-2">Featured Abaya Maisons</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs text-mb-text">
                    <Link href="/category/modest-studio" onClick={() => setActiveMenu(null)} className="font-semibold text-mb-accent-deep hover:underline">Modest Studio</Link>
                    <Link href="/category/nudra-dubai" onClick={() => setActiveMenu(null)} className="hover:text-mb-accent-deep">Nudra Dubai</Link>
                    <Link href="/category/noor-dubai" onClick={() => setActiveMenu(null)} className="hover:text-mb-accent-deep">Noor Dubai</Link>
                    <Link href="/category/zahra-couture" onClick={() => setActiveMenu(null)} className="hover:text-mb-accent-deep">Zahra Couture</Link>
                    <Link href="/category/aura-modest" onClick={() => setActiveMenu(null)} className="hover:text-mb-accent-deep">Aura Modest</Link>
                    <Link href="/category/amani-kaftans" onClick={() => setActiveMenu(null)} className="hover:text-mb-accent-deep">Amani Kaftans</Link>
                    <Link href="/category/al-jawhara" onClick={() => setActiveMenu(null)} className="hover:text-mb-accent-deep">Al-Jawhara</Link>
                    <Link href="/category/ruaa-luxury" onClick={() => setActiveMenu(null)} className="hover:text-mb-accent-deep">Ruaa Luxury</Link>
                  </div>
                </div>
              )}
            </nav>

            {/* Search — "Search on Modest Studio" placeholder from snapshot */}
            <div ref={searchContainerRef} className="flex-1 hidden md:block relative">
              <form
                onSubmit={handleSearchSubmit}
                className="flex items-center bg-mb-surface border border-mb-border rounded h-9 focus-within:border-mb-accent focus-within:ring-2 focus-within:ring-mb-accent transition-colors"
              >
                <label htmlFor="header-search" className="sr-only">Search on Modest Studio</label>
                <input
                  id="header-search"
                  type="search"
                  name="q"
                  placeholder="Search on Modest Studio"
                  autoComplete="off"
                  spellCheck={false}
                  value={searchVal}
                  onChange={e => setSearchVal(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  className="flex-1 min-w-0 bg-transparent pl-3 pr-1 text-[13px] text-mb-text placeholder-mb-placeholder outline-none"
                />
                <button
                  type="submit"
                  aria-label="Search"
                  className="flex-shrink-0 px-3 h-full text-mb-accent hover:text-mb-accent-deep transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mb-accent"
                >
                  <SearchIcon />
                </button>
              </form>

              {/* Live search suggestions dropdown */}
              {searchFocused && searchVal.trim().length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-mb-surface border border-mb-border rounded-md shadow-xl z-50 overflow-hidden">
                  <div className="p-2 border-b border-mb-border-lite text-[11px] font-semibold text-mb-body uppercase">
                    Products matching &quot;{searchVal}&quot;
                  </div>
                  {searchResults.length > 0 ? (
                    <div className="max-h-[300px] overflow-y-auto">
                      {searchResults.map(prod => (
                        <Link
                          key={prod.id}
                          href={`/product/${prod.id}`}
                          onClick={() => {
                            setSearchFocused(false);
                            setSearchVal("");
                          }}
                          className="flex items-center gap-3 px-3 py-2 hover:bg-mb-surface transition-colors border-b border-mb-border-lite last:border-0"
                        >
                          <img
                            src={prod.image}
                            alt=""
                            width={36}
                            height={36}
                            onError={(e) => {
                              const target = e.currentTarget;
                              if (!target.src.includes("/abaya/products/abaya-1.jpg")) {
                                target.src = "/abaya/products/abaya-1.jpg";
                              }
                            }}
                            className="w-9 h-9 object-contain bg-mb-surface rounded-sm p-0.5 border border-mb-border"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-mb-body font-semibold uppercase">{prod.brand}</p>
                            <p className="text-[12px] text-mb-text truncate font-medium">{prod.name}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-[12px] font-semibold text-mb-text">₹{prod.price}</span>
                            {prod.discount && (
                              <span className="block text-[10px] text-mb-accent-deep font-medium">{prod.discount}% Off</span>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-xs text-mb-body">
                      No products found. Press Enter to view all results.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right actions: Sign in + Shopping Bag (exact labels from snapshot) */}
            <div className="flex items-center gap-1 ml-auto md:ml-0">

              {/* Mobile search */}
              <button type="button" aria-label="Search"
                className="md:hidden p-2 text-mb-body hover:text-mb-accent-deep transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mb-accent rounded">
                <SearchIcon />
              </button>

              {/* Authenticated user menu or Sign in link */}
              {isAuthenticated && user ? (
                <div ref={userDropdownRef} className="relative hidden md:block">
                  <button
                    type="button"
                    onClick={() => setUserDropdownOpen((v) => !v)}
                    aria-expanded={userDropdownOpen}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-semibold text-mb-text bg-mb-surface hover:bg-mb-surface-hover border border-mb-border rounded shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mb-accent"
                  >
                    <span className="w-5 h-5 rounded-full bg-mb-primary text-mb-bg text-[10px] font-bold flex items-center justify-center">
                      {(user.firstName || user.email || "U")[0].toUpperCase()}
                    </span>
                    <span className="max-w-[100px] truncate">{user.firstName || "Account"}</span>
                    <ChevronDown />
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 top-full mt-1.5 w-48 bg-white border border-mb-border rounded-md shadow-lg py-1 z-50 text-xs">
                      <div className="px-3 py-2 border-b border-mb-border-lite">
                        <p className="font-semibold text-mb-text truncate">{user.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : (user.email.split('@')[0] || "Customer")}</p>
                        <p className="text-[11px] text-mb-placeholder truncate">{user.email}</p>
                      </div>
                      <Link
                        href="/orders"
                        onClick={() => setUserDropdownOpen(false)}
                        className="block px-3 py-2 text-mb-text hover:bg-mb-surface hover:text-mb-accent-deep transition-colors"
                      >
                        My Orders
                      </Link>
                      <Link
                        href="/addresses"
                        onClick={() => setUserDropdownOpen(false)}
                        className="block px-3 py-2 text-mb-text hover:bg-mb-surface hover:text-mb-accent-deep transition-colors"
                      >
                        Saved Addresses
                      </Link>
                      <Link
                        href="/wallet"
                        onClick={() => setUserDropdownOpen(false)}
                        className="block px-3 py-2 text-mb-text hover:bg-mb-surface hover:text-mb-accent-deep transition-colors"
                      >
                        My Wallet
                      </Link>
                      <Link
                        href="/wishlist"
                        onClick={() => setUserDropdownOpen(false)}
                        className="block px-3 py-2 text-mb-text hover:bg-mb-surface hover:text-mb-accent-deep transition-colors"
                      >
                        Wishlist ({wishlistCount})
                      </Link>
                      <div className="border-t border-mb-border-lite my-1" />
                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          logout();
                          router.push("/");
                        }}
                        className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 transition-colors font-medium"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  className="hidden md:inline-flex items-center justify-center px-4 py-1.5 text-[13px] font-semibold text-mb-bg bg-mb-primary hover:bg-mb-primary-hover transition-colors rounded shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mb-accent"
                >
                  Sign in
                </Link>
              )}

              {/* Wishlist */}
              <Link href="/wishlist"
                aria-label={`Wishlist, ${wishlistCount} items`}
                className="relative hidden md:flex p-2 text-mb-body hover:text-mb-accent-deep transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mb-accent rounded">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                </svg>
                {wishlistCount > 0 && (
                  <span aria-hidden="true"
                    className="absolute top-0 right-0 w-4 h-4 bg-mb-primary text-mb-bg text-[9px] font-bold rounded-full flex items-center justify-center">
                    {wishlistCount > 9 ? "9+" : wishlistCount}
                  </span>
                )}
              </Link>

              {/* Shopping Bag — exact label from snapshot */}
              <Link href="/cart"
                aria-label={`Shopping Bag, ${itemCount} items`}
                className="relative flex items-center gap-1.5 p-2 text-mb-body hover:text-mb-accent-deep transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mb-accent rounded">
                <BagIcon />
                <span aria-hidden="true"
                  className="absolute top-0 right-0 w-4 h-4 bg-mb-primary text-mb-bg text-[9px] font-bold rounded-full flex items-center justify-center">
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              </Link>

              {/* Mobile menu toggle */}
              <button type="button"
                aria-label="Toggle navigation menu"
                aria-expanded={menuOpen}
                aria-controls="mobile-nav"
                onClick={() => setMenuOpen(v => !v)}
                className="lg:hidden p-2 text-mb-body hover:text-mb-accent-deep transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mb-accent rounded">
                {menuOpen ? <CloseIcon /> : <MenuIcon />}
              </button>
            </div>
          </div>
        </div>

        {/* ══ TIER 3: Category nav ══════════════════════════════ */}
        {/* navigation "Secondary" > navigation "Main navigation menu" from snapshot */}
        <nav aria-label="Main navigation menu"
          className="hidden lg:block bg-mb-surface border-b border-mb-border">
          <div className="mx-auto max-w-content px-4 md:px-6">
            <ul className="flex items-center overflow-x-auto no-scrollbar gap-1" role="list">
              {navCategories.map(cat => (
                <li key={cat.label} role="listitem" className="relative group">
                  <Link href={cat.href}
                    className={`inline-flex items-center gap-1 px-3.5 py-2.5 text-[13px] font-medium whitespace-nowrap border-b-2 border-transparent group-hover:border-mb-accent group-hover:text-mb-accent-deep transition-colors capitalize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mb-accent ${
                      cat.accent ? "text-mb-accent-deep font-semibold" : "text-mb-text"
                    }`}>
                    <span>{cat.label}</span>
                    {cat.children && cat.children.length > 0 && (
                      <span className="opacity-40 group-hover:opacity-100 transition-opacity">
                        <ChevronDown />
                      </span>
                    )}
                  </Link>

                  {cat.children && cat.children.length > 0 && (
                    <div className="absolute top-full left-0 hidden group-hover:block z-50 min-w-[210px] bg-white border border-mb-border rounded-b-md shadow-lg py-1.5 animate-in fade-in-50 duration-150">
                      {cat.children.map(sub => (
                        <Link
                          key={sub.label}
                          href={sub.href}
                          className="block px-4 py-2 text-xs text-mb-text hover:bg-mb-surface hover:text-mb-accent-deep font-medium transition-colors"
                        >
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Mobile nav drawer */}
        {menuOpen && (
          <nav id="mobile-nav" aria-label="Mobile navigation"
            className="lg:hidden bg-mb-surface border-t border-mb-border shadow-md max-h-[80vh] overflow-y-auto">

            {/* Mobile search */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const input = form.elements.namedItem("q") as HTMLInputElement;
                if (input && input.value.trim()) {
                  setMenuOpen(false);
                  router.push(`/category/all?q=${encodeURIComponent(input.value.trim())}`);
                }
              }}
              className="px-4 py-3 border-b border-mb-border-lite"
            >
              <label htmlFor="mobile-search" className="sr-only">Search</label>
              <div className="flex items-center bg-mb-surface border border-mb-border rounded-sm h-9 focus-within:border-mb-accent">
                <input id="mobile-search" type="search" name="q" placeholder="Search on Modest Studio"
                  autoComplete="off"
                  className="flex-1 bg-transparent pl-3 text-[13px] outline-none" />
                <button type="submit" aria-label="Search" className="px-3 text-mb-placeholder hover:text-mb-accent-deep"><SearchIcon /></button>
              </div>
            </form>

            <ul role="list">
              {navCategories.map(cat => (
                <li key={cat.label} role="listitem">
                  <Link href={cat.href} onClick={() => setMenuOpen(false)}
                    className={`flex items-center justify-between px-4 py-3 text-[13px] font-medium border-b border-mb-border-lite hover:bg-mb-surface capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-mb-accent ${
                      cat.accent ? "text-mb-accent-deep font-semibold" : "text-mb-text"
                    }`}>
                    <span>{cat.label}</span>
                    {cat.children && cat.children.length > 0 && (
                      <span className="text-[11px] text-mb-placeholder font-normal">
                        ({cat.children.length})
                      </span>
                    )}
                  </Link>

                  {cat.children && cat.children.length > 0 && (
                    <div className="bg-mb-surface/40 border-b border-mb-border-lite pl-6 pr-4 py-1 space-y-1">
                      {cat.children.map(sub => (
                        <Link
                          key={sub.label}
                          href={sub.href}
                          onClick={() => setMenuOpen(false)}
                          className="block py-1.5 text-xs text-mb-body hover:text-mb-accent-deep transition-colors"
                        >
                          ↳ {sub.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </li>
              ))}
              {isAuthenticated && user ? (
                <>
                  <li role="listitem" className="px-4 py-3 bg-mb-surface border-b border-mb-border-lite">
                    <p className="text-xs font-semibold text-mb-text truncate">
                      Hi, {user.firstName || user.email.split('@')[0] || "Customer"}
                    </p>
                    <p className="text-[11px] text-mb-placeholder truncate">{user.email}</p>
                  </li>
                  <li role="listitem">
                    <Link href="/orders" onClick={() => setMenuOpen(false)} className="flex items-center px-4 py-3 text-[13px] font-medium border-b border-mb-border-lite hover:bg-mb-surface">
                      My Orders
                    </Link>
                  </li>
                  <li role="listitem">
                    <Link href="/addresses" onClick={() => setMenuOpen(false)} className="flex items-center px-4 py-3 text-[13px] font-medium border-b border-mb-border-lite hover:bg-mb-surface">
                      Saved Addresses
                    </Link>
                  </li>
                  <li role="listitem">
                    <Link href="/wallet" onClick={() => setMenuOpen(false)} className="flex items-center px-4 py-3 text-[13px] font-medium border-b border-mb-border-lite hover:bg-mb-surface">
                      My Wallet
                    </Link>
                  </li>
                  <li role="listitem">
                    <button
                      type="button"
                      onClick={() => { setMenuOpen(false); logout(); router.push("/"); }}
                      className="w-full text-left px-4 py-3 text-[13px] font-medium text-red-600 border-b border-mb-border-lite hover:bg-red-50"
                    >
                      Sign Out
                    </button>
                  </li>
                </>
              ) : (
                <li role="listitem">
                  <Link
                    href="/login"
                    onClick={() => setMenuOpen(false)}
                    className="block w-full text-left px-4 py-3 text-[13px] font-medium text-mb-accent-deep border-b border-mb-border-lite hover:bg-mb-surface"
                  >
                    Sign In / Register
                  </Link>
                </li>
              )}
            </ul>
          </nav>
        )}
      </header>


    </>
  );
}
