# moodest-

Moodest Single-Brand Luxury Abaya E-Commerce Platform.

## Architecture

- **Backend (`/backend`):** NestJS 11, TypeScript, Prisma 6, PostgreSQL (Neon), JWT Authentication, Global Lock Hierarchy Concurrency Protection.
- **Storefront (`/MOODEST`):** Next.js 14, React 18, Tailwind CSS, Customer Catalog, Cart, Atomic Checkout, Razorpay Integration.
- **Admin Panel (`/Moodest admpanel`):** Turborepo Monorepo, Next.js 15, React 19, Product Management, Inventory Tracking, Order Fulfillment, Revenue Analytics.

## Setup & Running Locally

### 1. Backend
```bash
cd backend
npm install
npm run start:dev
# Running on http://localhost:4000/api
```

### 2. Storefront
```bash
cd MOODEST
npm install
npm run dev
# Running on http://localhost:3000
```

### 3. Admin Panel
```bash
cd "Moodest admpanel"
pnpm install
pnpm run dev
# Running on http://localhost:3001
```

