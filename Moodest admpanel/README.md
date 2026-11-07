# E-commerce Admin Template

A reusable e-commerce admin panel: **Next.js 15 (App Router) + Tailwind v4 + shadcn/ui + Prisma (MongoDB)**
in a **pnpm + Turborepo** monorepo. Bring your own REST backend (contract below) or build one against the shared Prisma schema.

```
apps/admin/       Next.js admin dashboard
packages/db/      Shared Prisma schema, seeds, client generation (@repo/db)
```

## Modules
Dashboard · Products (with variants/attributes) · Brands · Categories · Subcategories · Orders ·
Customers · Inventory · Coupons · Banners · Analytics · Order/Customer reports (PDF export) ·
Activity logs · Payment logs · Settings · Admin login (better-auth, role-based)

## Quick start
```bash
corepack enable                                   # or: npm i -g pnpm
pnpm install                                      # also runs `prisma generate`
cp packages/db/.env.example packages/db/.env
cp apps/admin/.env.example  apps/admin/.env.local # fill in values
pnpm dev                                          # http://localhost:3001
```
Other scripts: `pnpm build`, `pnpm lint`, `pnpm db:generate`, `pnpm db:seed`
> `db:seed` **deletes existing data** (catalog, orders, ...) before inserting sample data. Never run it against production.

## Make it yours (checklist)
1. **Name & description** — `apps/admin/src/config/app.ts` (`APP_CONFIG`). The sidebar logo initials come from `name`.
2. **Logo / favicon** — replace `apps/admin/public/favicon.svg` and `apps/admin/src/app/icon.svg`.
3. **Sidebar menu** — `navGroups` in `apps/admin/src/components/admin/admin-sidebar.tsx`.
4. **Theme** — colors and radius are CSS variables in `apps/admin/src/app/globals.css`.
5. **Image hosts** — allowed remote image domains in `apps/admin/next.config.ts`.
6. **Data model** — edit `packages/db/prisma/schema.prisma`, then `pnpm db:generate`.
7. **Package scope** — rename `@repo/db` and the `ecommerce-admin-template` root name if you like.

## API contract
The admin calls a backend at `NEXT_PUBLIC_API_URL` (default `http://localhost:5000/api`). In the browser,
requests go to `/api/*` on the admin origin, which `next.config.ts` rewrites to the backend, with cookies included.

| Area | Endpoints |
|------|-----------|
| Auth | `/api/auth-admin/*` (better-auth, incl. `get-session`); `/admin/profile`, `/admin/reset-password` |
| Catalog | `/products`, `/products/:id`, `/products/withvariant[/:id]`, `/brands[/:id]`, `/categories[/:id]`, `/categories/:id/subcategories`, `/subcategories[/:id]`, `/variants[/:id]`, `/attributes`, `/attributes/values` |
| Orders & customers | `/orders`, `/orders/:id`, `/orders/:id/status`, `/users`, `/users/:id`, `/users/:id/ban`, `/users/:id/unban` |
| Inventory & marketing | `/inventory`, `/coupons[/:id]`, `/banners[/:id]` |
| Analytics | `/analytics/{summary,metrics,sales-metrics,top-products,low-stock,recent-orders,orders-summary,customers-report,filters}` |
| Logs | `/logs/activity`, `/logs/payment` |

Order payment fields are named after Razorpay (`razorpayOrderId`, `razorpayPaymentId`, `razorpaySignature`) in the
schema and API responses. Rename them in the schema and in `apps/admin/src/{types/order.ts,components/admin/analytics,app/(sidebar)/reports}` if you use another gateway.
