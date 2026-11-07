---
name: moryelle-design
description: Design system skill for moryelle. Activate when building UI components, pages, or any visual elements. Provides exact color tokens, typography scale, spacing grid, component patterns, and craft rules. Read references/DESIGN.md before writing any CSS or JSX.
---

# moryelle Design System

You are building UI for **moryelle**. Light-themed, warm palette, sans-serif typography (sans-serif), compact density on a 4px grid.

## Design Philosophy

- **Layered depth** — use shadow tokens to create a sense of physical layering. Each elevation level has a specific shadow.
- **Solid colors only** — no gradients anywhere. Every surface is a single flat color.
- **Single typeface** — sans-serif carries all text. Hierarchy comes from size, weight, and color — never font mixing.
- **compact density** — 4px base grid. Every dimension is a multiple of 4.
- **warm palette** — the color temperature runs warm, matching the sans-serif typography.
- **Restrained accent** — `#e80071` is the only pop of color. Used exclusively for CTAs, links, focus rings, and active states.
- **Subtle motion** — transitions smooth state changes. Keep durations under 300ms, use ease-out curves.

## Color System

### Core Palette

| Role | Token | Hex | Use |
|------|-------|-----|-----|
| Background | `--background` | `#ffffff` | Page/app background |
| Surface | `--surface` | `#f4f4f4` | Cards, panels, modals |
| Text Primary | `--text-primary` | `#000000` | Headings, body text |
| Text Muted | `--text-muted` | `#595e63` | Captions, placeholders |
| Accent | `--accent` | `#e80071` | CTAs, links, focus rings |

### Extended Palette

- **nk-border:** `#cdd3d8`
- **nk-dim:** `#6f7981`
- **nk-blue-bg:** `#e0f7ff` — Light surface or highlight color
- `#e8e8e8` — Light surface or highlight color

### CSS Variable Tokens

```css
--color-surface-muted: var(--color-6);
--color-text-primary: var(--color-1);
--color-text-secondary: var(--color-3);
--color-text-muted: var(--color-5);
--color-accent: var(--color-4);
--color-border: var(--color-6);
```

## Typography

### Font Stack

- **sans-serif** — Heading 1, Heading 2, Heading 3, Body, Caption

### Type Scale

| Role | Family | Size | Weight |
|------|--------|------|--------|
| Heading 1 | sans-serif | 48px / 3rem | 700 |
| Heading 2 | sans-serif | 32px / 2rem | 600 |
| Heading 3 | sans-serif | 24px / 1.5rem | 600 |
| Body | sans-serif | 16px / 1rem | 400 |
| Caption | sans-serif | 12px / 0.75rem | 400 |

### Typography Rules

- All text uses **sans-serif** — never add another font family
- Max 3-4 font sizes per screen
- Headings: weight 600-700, body: weight 400
- Use color and opacity for text hierarchy, not additional font sizes
- Line height: 1.5 for body, 1.2 for headings

## Spacing & Layout

### Base Grid: 4px

Every dimension (margin, padding, gap, width, height) must be a multiple of **4px**.

### Spacing Scale

`2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 28, 32` px

### Spacing as Meaning

| Spacing | Use |
|---------|-----|
| 4-8px | Tight: related items (icon + label, avatar + name) |
| 12-16px | Medium: between groups within a section |
| 24-32px | Wide: between distinct sections |
| 48px+ | Vast: major page section breaks |

### Border Radius

Scale: `2px, 4px, 6px, 8px, 12px`
Default: `6px`

### Container

Max-width: `100%`, centered with auto margins.

### Breakpoints

| Name | Value |
|------|-------|
| sm | 640px |
| md | 768px |
| lg | 1024px |
| xl | 1280px |
| 2xl | 1536px |

Mobile-first: design for small screens, layer on responsive overrides.

## Component Patterns

### Card

```css
.card {
  background: #f4f4f4;
  border-radius: 6px;
  padding: 16px;
  box-shadow: rgba(0, 0, 0, 0.1) 0px 1px 10px 0px;
}
```

```html
<div class="card">
  <h3>Card Title</h3>
  <p>Card content goes here.</p>
</div>
```

### Button

```css
/* Primary */
.btn-primary {
  background: #e80071;
  color: #000000;
  border-radius: 6px;
  padding: 8px 16px;
  font-weight: 500;
  transition: opacity 150ms ease;
}
.btn-primary:hover { opacity: 0.9; }

/* Ghost */
.btn-ghost {
  background: transparent;
  border: 1px solid #cccccc;
  color: #000000;
  border-radius: 6px;
  padding: 8px 16px;
}
```

```html
<button class="btn-primary">Get Started</button>
<button class="btn-ghost">Learn More</button>
```

### Input

```css
.input {
  background: #ffffff;
  border: 1px solid #cccccc;
  border-radius: 6px;
  padding: 8px 12px;
  color: #000000;
  font-size: 14px;
}
.input:focus { border-color: #e80071; outline: none; }
```

```html
<input class="input" type="text" placeholder="Search..." />
```

### Badge / Chip

```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 500;
  background: #f4f4f4;
  color: #595e63;
}
```

```html
<span class="badge">New</span>
<span class="badge">Beta</span>
```

### Modal / Dialog

```css
.modal-backdrop { background: rgba(0, 0, 0, 0.6); }
.modal {
  background: #f4f4f4;
  border-radius: 12px;
  padding: 24px;
  max-width: 480px;
  width: 90vw;
  box-shadow: rgba(0, 0, 0, 0.1) 0px 1px 10px 0px;
}
```

```html
<div class="modal-backdrop">
  <div class="modal">
    <h2>Dialog Title</h2>
    <p>Dialog content.</p>
    <button class="btn-primary">Confirm</button>
    <button class="btn-ghost">Cancel</button>
  </div>
</div>
```

### Table

```css
.table { width: 100%; border-collapse: collapse; }
.table th {
  text-align: left;
  padding: 8px 12px;
  font-weight: 500;
  font-size: 12px;
  color: #595e63;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid #cccccc;
}
.table td {
  padding: 12px;
  border-bottom: 1px solid #cccccc;
}
```

```html
<table class="table">
  <thead><tr><th>Name</th><th>Status</th><th>Date</th></tr></thead>
  <tbody>
    <tr><td>Item One</td><td>Active</td><td>Jan 1</td></tr>
    <tr><td>Item Two</td><td>Pending</td><td>Jan 2</td></tr>
  </tbody>
</table>
```

### Navigation

```css
.nav {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
}
.nav-link {
  color: #595e63;
  padding: 8px 12px;
  border-radius: 6px;
  transition: color 150ms;
}
.nav-link:hover { color: #000000; }
.nav-link.active { color: #e80071; }
```

```html
<nav class="nav">
  <a href="/" class="nav-link active">Home</a>
  <a href="/about" class="nav-link">About</a>
  <a href="/pricing" class="nav-link">Pricing</a>
  <button class="btn-primary" style="margin-left: auto">Get Started</button>
</nav>
```

### Extracted Components

These components were found in the codebase:

**BrandSpotlight** (`components/BrandSpotlight.tsx`)
- Styles: `bg-[#F4F4F4]`, `rounded-lg`, `mb-4`, `text-center`

**Button** (`components/Button.tsx`)
- Variants: `primary`, `secondary`, `outline`, `sm`, `md`, `ghost`, `lg`
- Props: `children`, `variant`, `size`, `loading`, `href`, `className`
- Styles: `mr-2`, `opacity-25`

**Footer** (`components/Footer.tsx`)
- Styles: `bg-white`, `border-t`, `mx-auto`, `text-sm`

**Header** (`components/Header.tsx`)
- Styles: `bg-white`, `border-b`, `mx-auto`, `text-white`, `shadow-sm`

**Hero** (`components/Hero.tsx`)
- Variants: `MORYELLE`
- Props: `image`, `title`, `subtitle`, `link`
- Styles: `bg-[#F4F4F4]`, `rounded-full`, `gap-1`, `shadow`

**ProductCard** (`components/ProductCard.tsx`)
- Variants: `makeup`, `skincare`, `fragrance`, `haircare`
- Props: `product`
- Styles: `bg-white`, `border`, `gap-0.5`, `text-[#000000]`, `shadow-sm`

**ProductGrid** (`components/ProductGrid.tsx`)
- Props: `id`, `name`, `price`, `originalPrice`, `discount`, `rating`
- Styles: `bg-white`, `rounded`, `mb-4`, `text-base`

**ProductSections** (`components/ProductSections.tsx`)
- Styles: `bg-white`, `border-t`, `py-5`

**PromoGrid** (`components/PromoGrid.tsx`)
- Styles: `bg-[#FDE8F0]`, `rounded-lg`, `mb-4`, `text-center`

**Cart** (`pages/cart.tsx`)
- Props: `product`, `qty`
- Styles: `bg-[#F4F4F4]`, `rounded`, `mx-auto`, `text-xs`

## Animation & Motion

This project uses **subtle motion**. Transitions smooth state changes without calling attention.

### CSS Animations

- `animate-spin`

### Motion Guidelines

- **Duration:** 150-300ms for micro-interactions, 300-500ms for page transitions
- **Easing:** `ease-out` for enters, `ease-in` for exits
- **Direction:** Elements enter from bottom/right, exit to top/left
- **Reduced motion:** Always respect `prefers-reduced-motion` — disable animations when set

## Depth & Elevation

### Shadow Tokens

- **sm** (Floating (dropdowns, popovers)): `rgba(0, 0, 0, 0.1) 0px 1px 10px 0px`
- **md** (Floating (dropdowns, popovers)): `rgba(0, 0, 0, 0.15) 0px 2px 16px 0px`

## Anti-Patterns (Never Do)

- **No gradients** — solid colors only, everywhere
- **No blur effects** — no backdrop-blur, no filter: blur()
- **No zebra striping** — tables and lists use borders for separation
- **No invented colors** — every hex value must come from the palette above
- **No arbitrary spacing** — every dimension is a multiple of 4px
- **No extra fonts** — only sans-serif are allowed
- **No arbitrary border-radius** — use the scale: 2px, 4px, 6px, 8px, 12px
- **No opacity for disabled states** — use muted colors instead

## Workflow

1. **Read** `references/DESIGN.md` before writing any UI code
2. **Pick colors** from the Color System section — never invent new ones
3. **Set typography** — sans-serif only, using the type scale
4. **Build layout** on the 4px grid — check every margin, padding, gap
5. **Match components** to patterns above before creating new ones
6. **Apply elevation** — use shadow tokens
7. **Validate** — every value traces back to a design token. No magic numbers.

## Brand Spec

- **Brand color:** `#e80071`
- **Brand typeface:** sans-serif

## Quick Reference

```
Background:     #ffffff
Surface:        #f4f4f4
Text:           #000000 / #595e63
Accent:         #e80071
Border:         (not extracted)
Font:           sans-serif
Spacing:        4px grid
Radius:         6px
Frameworks:     Tailwind CSS, React, Next.js
Components:     16 detected
```

## When to Trigger

Activate this skill when:
- Creating new components, pages, or visual elements for moryelle
- Writing CSS, Tailwind classes, styled-components, or inline styles
- Building page layouts, templates, or responsive designs
- Reviewing UI code for design consistency
- The user mentions "moryelle" design, style, UI, or theme
- Generating mockups, wireframes, or visual prototypes

---

# Full Reference Files

> Every output file is embedded below. Claude has full design system context from /skills alone.

## Design System Tokens (DESIGN.md)

# moryelle DESIGN.md

> Auto-generated design system — reverse-engineered via static analysis by skillui.
> Frameworks: Tailwind CSS 3.4.6 + React 18.3.1 + Next.js 14.2.5
> Colors: 10 · Fonts: 1 · Components: 16
> Icon library: not detected · State: not detected
> Primary theme: light · Dark mode toggle: no · Motion: subtle

---

## 1. Visual Theme & Atmosphere

This is a **light-themed** interface with a warm, approachable feel. The light background emphasizes content clarity. Typography uses **sans-serif** throughout — a clean, modern choice that maintains consistency. Spacing follows a **4px base grid** (compact density), with scale: 2, 4, 6, 8, 10, 12, 14, 16px. The palette is predominantly monochromatic with **#e80071** as the single accent color — used sparingly for interactive elements and emphasis. Motion is subtle — smooth transitions (150-300ms) ease state changes without drawing attention.

---

## 2. Color Palette & Roles

| Token | Hex | Role | Use |
|---|---|---|---|
| nk-white | `#ffffff` | background | Page background, darkest surface |
| nk-bg | `#f4f4f4` | surface | Card and panel backgrounds |
| nk-text | `#000000` | text-primary | Headings and body text |
| nk-muted | `#595e63` | text-muted | Captions, placeholders, secondary info |
| nk-accent | `#e80071` | accent | CTAs, links, focus rings, active states |
| nk-link | `#0000ee` | accent | CTAs, links, focus rings, active states |
| nk-blue-bg | `#e0f7ff` | info | Informational highlights |
| nk-border | `#cdd3d8` | unknown | Palette color |
| nk-dim | `#6f7981` | unknown | Palette color |
| unknown | `#e8e8e8` | unknown | Palette color |

### CSS Variable Tokens

```css
--color-surface-muted: var(--color-6);
--color-text-primary: var(--color-1);
--color-text-secondary: var(--color-3);
--color-text-muted: var(--color-5);
--color-accent: var(--color-4);
--color-border: var(--color-6);
```


---

## 3. Typography Rules

**Font Stack:**
- **sans-serif** — Heading 1, Heading 2, Heading 3, Body, Caption

| Role | Font | Size | Weight |
|---|---|---|---|
| Heading 1 | sans-serif | 48px / 3rem | 700 |
| Heading 2 | sans-serif | 32px / 2rem | 600 |
| Heading 3 | sans-serif | 24px / 1.5rem | 600 |
| Body | sans-serif | 16px / 1rem | 400 |
| Caption | sans-serif | 12px / 0.75rem | 400 |

**Typographic Rules:**
- Use **sans-serif** for all text — do not mix font families
- Maintain consistent hierarchy: no more than 3-4 font sizes per screen
- Headings use bold (600-700), body uses regular (400)
- Line height: 1.5 for body text, 1.2 for headings
- Use color and opacity for secondary hierarchy, not additional font sizes


---

## 4. Component Stylings

### Layout (4)

**Footer** — `components/Footer.tsx`
- Key Styles: `rounded-md`, `border-[#CDD3D8]`, `bg-white`, `mx-auto`, `text-sm`, `font-semibold`, `hover:opacity-80`
- Animation: tw-transitions: transition-opacity, transition-colors

```tsx
<footer className="bg-white border-t border-[#CDD3D8]" role="contentinfo">

      {/* ── App + Social strip ──────────────────────────────── */}
      <div className="bg-[#F4F4F4] border-b border-[#CDD3D8]">
        <div className="mx-auto max-w-content px-4 md:px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#000000]">
              Get Extra 20% Off on Your First App Order
            </p>
            <p className="text-xs text-[#595E63] mt-0.5">Download the MORYELLE app today</p>
          </div>
          <div className="flex gap-2">
```

**Header** — `components/Header.tsx`
- Key Styles: `rounded`, `border-[#E8E8E8]`, `bg-white`, `mx-auto`, `font-semibold`, `shadow-sm`, `focus:not-sr-only`
- Animation: tw-transitions: transition-colors, transition-opacity
- State: useState, useRef

**ProductSections** — `components/ProductSections.tsx`
- Key Styles: `border-[#F4F4F4]`, `bg-white`, `py-5`

```tsx
<section className="bg-white py-5 px-4 md:px-6 border-t border-[#F4F4F4]" aria-labelledby={id}>
      <div className="mx-auto max-w-content">
        <SectionHeader title={title} subtitle={subtitle} viewAllHref={viewAllHref} />
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
          {products.map(p => (
            <ProductCard key={p.id} product={p} />
```

**Pages** — `pages/index.tsx`
- Variants: `brand`, `collection`
- Key Styles: `rounded-lg`, `bg-[#F4F4F4]`, `mx-auto`, `text-sm`, `font-semibold`, `hover:shadow-md`
- Animation: tw-transitions: transition-shadow, transition-transform, duration-300, hover-transforms

```tsx
<div className={`${bg} ${py}`}>
      <div className="mx-auto max-w-[1280px] px-4 md:px-6">
        {children}
      </div>
    </div>
```

### Navigation (11)

**BrandSpotlight** — `components/BrandSpotlight.tsx`
- Key Styles: `rounded-lg`, `border-[#E8D0D8]`, `bg-[#F4F4F4]`, `mb-4`, `text-sm`, `font-semibold`, `hover:shadow-md`
- Animation: tw-transitions: transition-shadow, transition-transform, duration-300, hover-transforms

```tsx
<h2 className="text-center text-sm font-semibold text-[#000000] uppercase tracking-widest mb-4 flex items-center justify-center gap-2">
      <span className="text-[#E80071]">✦</span>
      {children}
      <span className="text-[#E80071]">✦</span>
    </h2>
```

**Button** — `components/Button.tsx`
- Variants: `primary`, `secondary`, `outline`, `sm`, `md`, `ghost`, `lg`
- Props: `children`, `variant`, `size`, `loading`, `href`, `className`
- Key Styles: `mr-2`, `opacity-25`
- Animation: tw-animate-spin, tw-transitions: transition-colors

```tsx
<Link href={href} className={cls}>
        {children}
      </Link>
```

**Hero** — `components/Hero.tsx`
- Variants: `MORYELLE`
- Props: `image`, `title`, `subtitle`, `link`
- Key Styles: `rounded-full`, `bg-[#F4F4F4]`, `gap-1`, `shadow`, `hover:bg-white`
- Animation: tw-transitions: transition-opacity, duration-500, transition-all
- State: useState

**ProductCard** — `components/ProductCard.tsx`
- Variants: `makeup`, `skincare`, `fragrance`, `haircare`
- Props: `product`
- Key Styles: `rounded-full`, `border-[#E8E8E8]`, `bg-white`, `gap-0.5`, `font-bold`, `shadow-sm`, `hover:shadow-sm`
- Animation: tw-transitions: transition-shadow, transition-opacity, transition-transform, duration-300, transition-all, hover-transforms

```tsx
/* article — cursor=pointer, exactly like Modest Studio */
    <article className="group relative flex flex-col bg-white border border-[#E8E8E8] hover:shadow-sm transition-shadow cursor-pointer">

      {/* ── Badge list [AD, BESTSELLER, NEW] ── */}
      {/* <list> with <listitem> children in the snapshot */}
      {(product.badge || product.discount
```

**ProductGrid** — `components/ProductGrid.tsx`
- Props: `id`, `name`, `price`, `originalPrice`, `discount`, `rating`, `reviewCount`, `image` (+3 more)
- Key Styles: `rounded`, `bg-white`, `mb-4`, `text-base`, `font-semibold`, `hover:underline`
- Animation: tw-transitions: transition-colors
- State: useState

```tsx
<div className="flex items-end justify-between mb-4">
      <div>
        <h2 className="text-base font-semibold text-[#000000] leading-tight">{title}</h2>
        {subtitle && <p className="text-xs text-[#595E63] mt-0.5">{subtitle}</p>}
      </div>
      {viewAllHref && (
        <Link
          href={viewAllHref}
          className="text-xs font-medium text-[#E80071] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E80071] rounded"
        >
          View All →
        </Link>
```

**PromoGrid** — `components/PromoGrid.tsx`
- Key Styles: `rounded-lg`, `border-y`, `bg-[#FDE8F0]`, `mb-4`, `text-sm`, `font-semibold`, `hover:shadow-md`
- Animation: tw-transitions: transition-shadow, transition-transform, duration-300, transition-opacity, hover-transforms

```tsx
<h2 className="text-center text-sm font-semibold text-[#000000] uppercase tracking-widest mb-4 flex items-center justify-center gap-2">
      <span className="text-[#E80071]">✦</span>
      {children}
      <span className="text-[#E80071]">✦</span>
    </h2>
```

**Cart** — `pages/cart.tsx`
- Props: `product`, `qty`
- Key Styles: `rounded`, `border-[#CDD3D8]`, `bg-[#F4F4F4]`, `mx-auto`, `text-xs`, `font-medium`, `hover:text-[#E80071]`
- Animation: tw-transitions: transition-opacity, transition-colors

```tsx
<>
      <Header />
      <main id="main-content" className="min-h-screen bg-[#F4F4F4]">
        <div className="mx-auto max-w-content px-4 md:px-6 py-5">

          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex items-center gap-1.5 text-xs text-[#595E63]" role="list">
              <li role="listitem">
                <Link href="/" className="hover:text-[#E80071] hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#E80071] rounded">
                  Home
                </Link>
```

**[...slug]** — `pages/category/[...slug].tsx`
- Props: `sorted.length`
- Key Styles: `rounded`, `border-[#F4F4F4]`, `bg-[#F4F4F4]`, `px-3`, `font-medium`, `shadow-sm`, `hover:text-[#E80071]`
- Animation: tw-transitions: transition-transform, transition-colors
- State: useState

```tsx
<div className="border-b border-[#F4F4F4]">
      <button
        type="button"
        aria-expanded={open}
        onClick={(
```

*...and 3 more navigation components.*

### Other (1)

**App** — `pages/_app.tsx`
- Props: `Component`, `pageProps`

```tsx
<CartProvider>
      <WishlistProvider>
        <Component {...pageProps} />
      </WishlistProvider>
    </CartProvider>
```



---

## 5. Layout Principles

- **Base spacing unit:** 4px
- **Spacing scale:** 2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 28, 32
- **Border radius:** 2px, 4px, 6px, 8px, 12px
- **Max content width:** 100%
- **Grid usage:** `grid-cols-2`, `grid-cols-3`, `grid-cols-1`
- **Container:** Tailwind `container` class with responsive padding

**Spacing as Meaning:**
| Spacing | Use |
|---|---|
| 4-8px | Tight: related items within a group |
| 12-16px | Medium: between groups |
| 24-32px | Wide: between sections |
| 48px+ | Vast: major section breaks |


---

## 6. Depth & Elevation

### Floating — dropdowns, popovers, modals

- **sm:** `rgba(0, 0, 0, 0.1) 0px 1px 10px 0px`
- **md:** `rgba(0, 0, 0, 0.15) 0px 2px 16px 0px`



---

## 7. Animation & Motion

This project uses **subtle motion**. Transitions smooth state changes without demanding attention.

### CSS Animations

- `@keyframes animate-spin`

### Animated Components

- **BrandSpotlight**: tw-transitions: transition-shadow, transition-transform, duration-300, hover-transforms
- **Button**: tw-animate-spin, tw-transitions: transition-colors
- **Footer**: tw-transitions: transition-opacity, transition-colors
- **Header**: tw-transitions: transition-colors, transition-opacity
- **Hero**: tw-transitions: transition-opacity, duration-500, transition-all

### Motion Guidelines

- Duration: 150-300ms for micro-interactions, 300-500ms for page transitions
- Easing: `ease-out` for enters, `ease-in` for exits
- Always respect `prefers-reduced-motion`


---

## 8. Do's and Don'ts

### Do's

- Use `#e80071` for interactive elements (buttons, links, focus rings)
- Use `#ffffff` as the primary page background
- Use **sans-serif** for all UI text
- Follow the **4px** spacing grid for all margins, padding, and gaps
- Use the defined shadow tokens for elevation — see Section 6
- Use border-radius from the scale: 2px, 4px, 6px, 8px, 12px
- Reuse existing components from Section 4 before creating new ones

### Don'ts

- Don't introduce colors outside this palette — extend the design tokens first
- Don't mix font families — use sans-serif consistently
- Don't use arbitrary spacing values — stick to multiples of 4px
- Don't create custom box-shadow values outside the system tokens
- Don't use gradients — the design uses solid colors only
- Don't use arbitrary border-radius values — pick from the defined scale
- Don't duplicate component patterns — check Section 4 first
- Don't use backdrop-blur or blur effects

### Anti-Patterns (detected from codebase)

- No gradient backgrounds
- No blur or backdrop-blur effects
- No zebra striping on tables/lists


---

## 9. Responsive Behavior

| Name | Value | Source |
|---|---|---|
| sm | 640px | tailwind |
| md | 768px | tailwind |
| lg | 1024px | tailwind |
| xl | 1280px | tailwind |
| 2xl | 1536px | tailwind |

**Approach:** Mobile-first using Tailwind responsive prefixes (`sm:`, `md:`, `lg:`, `xl:`, `2xl:`).
Always design for mobile first, then layer on responsive overrides.


---

## 10. Agent Prompt Guide

Use these as starting points when building new UI:

### Build a Card

```
Background: #f4f4f4
Border: 1px solid var(--border)
Radius: 6px
Padding: 16px
Font: sans-serif
Use shadow tokens from Section 6.
```

### Build a Button

```
Primary: bg #e80071, text white
Ghost: bg transparent, border var(--border)
Padding: 8px 16px
Radius: 6px
Hover: opacity 0.9 or lighter shade
Focus: ring with #e80071
```

### Build a Page Layout

```
Background: #ffffff
Max-width: 100%, centered
Grid: 4px base
Responsive: mobile-first, breakpoints from Section 9
```

### Build a Stats Card

```
Surface: #f4f4f4
Label: #595e63 (muted, 12px, uppercase)
Value: #000000 (primary, 24-32px, bold)
Status: use success/warning/danger from Section 2
```

### Build a Form

```
Input bg: #ffffff
Input border: 1px solid var(--border)
Focus: border-color #e80071
Label: #595e63 12px
Spacing: 16px between fields
Radius: 6px
```

### General Component

```
1. Read DESIGN.md Sections 2-6 for tokens
2. Colors: only from palette
3. Font: sans-serif, type scale from Section 3
4. Spacing: 4px grid
5. Components: match patterns from Section 4
6. Elevation: shadow tokens
```

