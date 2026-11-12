/**
 * Header — exact Modest Studio 3-tier structure from Playwright MCP snapshots:
 * Tier 1: announcement bar + [Get App, Store & Events, Gift Card, Help]
 * Tier 2: logo | primary nav [Categories, Brands, Luxe, Fashion, Beauty Advice] | search | [Sign in, Bag]
 * Tier 3: category nav [makeup, skin, hair, appliances, Bath & Body, Natural, mom & baby, Health & Wellness, men, fragrance, Fashion Selects, Offers]
 */
import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Icon } from "@iconify/react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import BrandLogo from "@/components/BrandLogo";
import { categoryAPI, productAPI, mapBackendProductToProduct } from "@/lib/api";
import type { Product } from "@/components/ProductCard";

/* ── Iconify icons ────────────────────────────────────────────── */
const MobileIcon = () => <Icon icon="lucide:smartphone" className="w-3 h-3" />;
const LocationIcon = () => <Icon icon="lucide:map-pin" className="w-3 h-3" />;
const GiftCardIcon = () => <Icon icon="lucide:gift" className="w-3 h-3" />;
const HelpIcon = () => <Icon icon="lucide:help-circle" className="w-3 h-3" />;

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
  { label: "Syrian Collection", href: "/category/syrian-collection" },
  { label: "The Classics", href: "/category/the-classics" },
  { label: "The Luxe Edit", href: "/category/the-luxe-edit" },
  { label: "Occasion Wear", href: "/category/occasion-wear" },
  { label: "Kimono & Kaftan", href: "/category/kimono-kaftan" },
  { label: "Open Abaya Edit", href: "/category/open-abaya-edit" },
  { label: "All Collections", href: "/category/all", accent: true },
];
const SearchIcon = () => <Icon icon="lucide:search" className="w-4 h-4" />;
const BagIcon = () => <Icon icon="lucide:shopping-bag" className="w-[18px] h-[18px]" />;
const ChevronDown = () => <Icon icon="lucide:chevron-down" className="w-2.5 h-2.5" />;
const CloseIcon = () => <Icon icon="lucide:x" className="w-[18px] h-[18px]" />;
const MenuIcon = () => <Icon icon="lucide:menu" className="w-5 h-5" />;

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

  const mainCategories = React.useMemo(() => navCategories.filter(c => !c.accent), [navCategories]);
  const accentCategory = React.useMemo(() => navCategories.find(c => c.accent), [navCategories]);

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
                href: `/category/${cat.slug || cat.id}/${sub.slug || sub.id}`,
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

  // Live search results from backend API
  const [searchResults, setSearchResults] = useState<Product[]>([]);

  useEffect(() => {
    const q = searchVal.trim();
    if (!q) {
      setSearchResults([]);
      return;
    }
    let isSubscribed = true;
    const timer = setTimeout(async () => {
      try {
        const res = await productAPI.getAll({ search: q, limit: 6 });
        if (isSubscribed && Array.isArray(res?.items)) {
          setSearchResults(res.items.map(mapBackendProductToProduct));
        }
      } catch {}
    }, 250);
    return () => {
      isSubscribed = false;
      clearTimeout(timer);
    };
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

      <header className="sticky top-0 z-50 bg-mb-bg shadow-sm w-full max-w-full overflow-x-clip" role="banner">

        {/* ══ TIER 1: Announcement + top utility links (hidden on mobile) ═════════ */}
        <div className="hidden sm:block bg-mb-surface text-mb-primary border-b border-mb-border">
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

        {/* ══ TIER 2: Logo | Search | Actions ════ */}
        <div className="bg-mb-bg border-b border-mb-border w-full max-w-full overflow-x-clip">
          <div className="mx-auto max-w-content px-3 sm:px-4 md:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4 md:gap-6 lg:gap-8 w-full">

            {/* Logo — brand sheet logo */}
            <Link href="/" aria-label="Modest Studio — homepage"
              className="flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mb-accent rounded flex items-center">
              <BrandLogo variant="secondary" className="h-9 sm:h-10 md:h-11 w-auto max-w-[155px] sm:max-w-[185px] md:max-w-[220px] object-contain object-left" />
            </Link>

            {/* Search — "Search on Modest Studio" placeholder from snapshot */}
            <div ref={searchContainerRef} className="flex-1 hidden md:block min-w-0 relative">
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
                            alt={`${prod.name} — Luxury Abaya Search Preview`}
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

            {/* Right actions: Sign in + Wishlist + Shopping Bag */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">

              {/* Authenticated user menu or Sign in link */}
              {isAuthenticated && user ? (
                <>
                  {/* Desktop user dropdown */}
                  <div ref={userDropdownRef} className="relative hidden md:block">
                    <button
                      type="button"
                      onClick={() => setUserDropdownOpen((v) => !v)}
                      aria-expanded={userDropdownOpen}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-semibold text-mb-text bg-mb-surface hover:bg-mb-surface-hover border border-mb-border rounded-[2px] shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mb-accent"
                    >
                      <span className="w-5 h-5 rounded-full bg-mb-primary text-mb-bg text-[10px] font-bold flex items-center justify-center">
                        {(user.firstName || user.email || "U")[0].toUpperCase()}
                      </span>
                      <span className="max-w-[100px] truncate">{user.firstName || "Account"}</span>
                      <ChevronDown />
                    </button>

                    {userDropdownOpen && (
                      <div className="absolute right-0 top-full mt-1.5 w-48 bg-white border border-mb-border rounded-[2px] shadow-lg py-1 z-50 text-xs">
                        <div className="px-3 py-2 border-b border-mb-border-lite">
                          <p className="font-semibold text-mb-text truncate">{user.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : (user.email.split('@')[0] || "Customer")}</p>
                          <p className="text-[11px] text-mb-placeholder truncate">{user.email}</p>
                        </div>
                        <Link
                          href="/profile"
                          onClick={() => setUserDropdownOpen(false)}
                          className="block px-3 py-2 text-mb-text hover:bg-mb-surface hover:text-mb-accent-deep transition-colors"
                        >
                          My Profile
                        </Link>
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

                  {/* Mobile user icon button */}
                  <Link
                    href="/profile"
                    aria-label="My Account"
                    className="md:hidden p-1.5 text-mb-body hover:text-mb-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mb-accent rounded-[2px] flex-shrink-0"
                  >
                    <Icon icon="lucide:user" className="w-5 h-5" />
                  </Link>
                </>
              ) : (
                <>
                  {/* Desktop Sign in button */}
                  <Link
                    href="/login"
                    aria-label="Sign in"
                    className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[13px] font-semibold text-mb-bg bg-mb-primary hover:bg-mb-primary-hover transition-colors rounded-[2px] shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mb-accent flex-shrink-0 whitespace-nowrap"
                  >
                    <Icon icon="lucide:user" className="w-3.5 h-3.5" />
                    <span>Sign in</span>
                  </Link>

                  {/* Mobile Sign in — Suitable user silhouette symbol */}
                  <Link
                    href="/login"
                    aria-label="Sign in"
                    className="md:hidden p-1.5 text-mb-body hover:text-mb-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mb-accent rounded-[2px] flex-shrink-0"
                  >
                    <Icon icon="lucide:user" className="w-5 h-5" />
                    <span className="sr-only">Sign in</span>
                  </Link>
                </>
              )}

              {/* Wishlist */}
              <Link href="/wishlist"
                aria-label={`Wishlist, ${wishlistCount} items`}
                className="relative hidden md:flex p-2 text-mb-body hover:text-mb-accent-deep transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mb-accent rounded">
                <Icon icon="lucide:heart" className="w-[18px] h-[18px]" />
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
                className="relative flex items-center gap-1.5 p-1.5 sm:p-2 text-mb-body hover:text-mb-accent-deep transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mb-accent rounded flex-shrink-0">
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
                className="lg:hidden p-1.5 sm:p-2 text-mb-body hover:text-mb-accent-deep transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mb-accent rounded flex-shrink-0">
                {menuOpen ? <CloseIcon /> : <MenuIcon />}
              </button>
            </div>
          </div>

          {/* Mobile Search Capsule Bar (Matches Our Brand Theme) */}
          <div className="md:hidden px-3.5 pb-2.5 pt-0.5 bg-mb-bg">
            <form
              onSubmit={handleSearchSubmit}
              className="flex items-center bg-mb-surface text-mb-text rounded-full px-3.5 h-10 border border-mb-border shadow-2xs focus-within:ring-2 focus-within:ring-mb-accent/60 transition-all"
            >
              <span className="text-mb-primary mr-2 flex-shrink-0">
                <SearchIcon />
              </span>
              <input
                type="search"
                name="q"
                placeholder="What are you looking for?"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                className="flex-1 min-w-0 bg-transparent text-xs text-mb-text placeholder-mb-placeholder outline-none"
              />
              <button type="button" aria-label="Visual Search" className="text-mb-primary hover:text-mb-accent-deep transition-colors p-1 flex-shrink-0">
                <Icon icon="lucide:camera" className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* ══ TIER 3: Category nav ══════════════════════════════ */}
        {/* navigation "Secondary" > navigation "Main navigation menu" from snapshot */}
        {(mainCategories.length > 0 || accentCategory) && (
          <nav aria-label="Main navigation menu"
            className="hidden lg:block bg-mb-surface border-b border-mb-border">
            <div className="mx-auto max-w-content px-4 md:px-6">
              <ul className="flex items-center overflow-x-auto no-scrollbar gap-1" role="list">
                {mainCategories.map(cat => (
                  <li key={cat.label} role="listitem" className="relative group">
                    <Link href={cat.href}
                      className="inline-flex items-center gap-1 px-3.5 py-2.5 text-[13px] font-medium whitespace-nowrap border-b-2 border-transparent group-hover:border-mb-accent group-hover:text-mb-accent-deep transition-colors capitalize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mb-accent text-mb-text">
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

                {accentCategory && (
                  <li role="listitem" className="relative">
                    <Link href={accentCategory.href}
                      className="inline-flex items-center gap-1 px-3.5 py-2.5 text-[13px] font-semibold whitespace-nowrap border-b-2 border-transparent hover:border-mb-accent transition-colors capitalize text-mb-accent-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mb-accent">
                      <span>{accentCategory.label}</span>
                    </Link>
                  </li>
                )}
              </ul>
            </div>
          </nav>
        )}

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

            {/* Abaya Collection Card — exact Image 1 visual */}
            <div className="m-3 p-4 rounded-xl bg-[#0d0d0d] text-white border border-[#222] shadow-md">
              <div className="text-center mb-3">
                <h3 className="text-sm font-bold tracking-wider uppercase text-white">MODEST STUDIO</h3>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">THE ABAYA COLLECTION</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {mainCategories.map((cat) => (
                  <Link
                    key={cat.label}
                    href={cat.href}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-center text-center px-2 py-3 rounded-lg bg-[#222222] hover:bg-[#333333] active:bg-[#444444] text-xs font-medium text-white transition-all shadow-xs"
                  >
                    {cat.label}
                  </Link>
                ))}
              </div>
            </div>

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
                    <Link href="/profile" onClick={() => setMenuOpen(false)} className="flex items-center px-4 py-3 text-[13px] font-medium border-b border-mb-border-lite hover:bg-mb-surface">
                      My Profile
                    </Link>
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
