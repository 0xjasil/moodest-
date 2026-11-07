# Moodest Backend (NestJS 11 + Prisma 6 + PostgreSQL)

Production-grade, single-brand abaya e-commerce backend for **Moodest Studio**.

## 1. Architecture Highlights

- **Framework**: NestJS 11 with Express runtime & TypeScript
- **Database ORM**: Prisma 6 connecting to PostgreSQL / Neon
- **Security**: Helmet HTTP headers, strict CORS, class-validator DTOs, global exception mapping
- **Authentication**: Stateless Passport-JWT Bearer authentication (Customer & Admin RBAC)
- **API Standards**: Global `/api` prefix, unified `{ success, data }` response interceptor
- **Resilience**: Graceful Redis degradation (zero crash if `REDIS_URL` is omitted)

---

## 2. Environment Setup

Create `.env` based on `.env.example`:

```bash
cp .env.example .env
```

Ensure `DATABASE_URL` and `JWT_SECRET` are populated.

---

## 3. Development Commands

```bash
# Install dependencies
npm install

# Start development server with hot-reload
npm run dev
# or
npm run start:dev

# Build for production
npm run build

# Start production server
npm run start:prod

# Run unit and E2E tests
npm run test
npm run test:e2e
```

---

## 4. Key Endpoints

- **Health Check**: `GET http://localhost:4000/api/health`
- **Swagger Documentation**: `GET http://localhost:4000/api/docs` (available in development mode)

---

## 5. Test Isolation with Neon Database Branches

To guarantee complete isolation between test execution and your main development/production data, configure a dedicated Neon branch:

### Steps in the Neon Console:
1. Log into your [Neon Console](https://console.neon.tech).
2. Select your project (`ep-dark-bar-be07z5n9`).
3. In the left navigation, click **Branches** -> **New Branch**.
4. Set **Branch Name**: `test` (or `test-branch`).
5. Choose **Parent branch**: `main` (creates an instant, zero-cost, copy-on-write clone with all schema migrations and tables intact).
6. Under **Connection Details**, copy the pooled connection string.
7. Paste this connection string into your `.env` file as:
   ```env
   TEST_DATABASE_URL="postgresql://neondb_owner:password@ep-test-branch-pooler.c-9.us-east-2.aws.neon.tech/neondb?sslmode=require"
   ```

When `NODE_ENV=test` (automatically activated when running `npm run test:e2e`), `PrismaService` automatically directs all database operations to `TEST_DATABASE_URL`.

---

## 6. Inventory Reservation Model & State Machine

Moodest implements the following concurrency-safe inventory architecture:

- **Physical Inventory**: `ProductVariant.qty` represents physical items on hand.
- **Available Inventory**: `Available = qty - SUM(quantity of RESERVED reservations with expiresAt > NOW())`.
- **Cart / Checkout (`reserve`)**:
  - `reserve()` **never** decrements `ProductVariant.qty`.
  - It creates/updates `StockReservation` rows with status `RESERVED` and a 10-minute lifetime (`expiresAt = NOW() + INTERVAL '10 minutes'`).
  - Sets `Order.reservationExpires` to the earliest active reservation expiry.
- **Payment Captured (`commit`)**:
  - Transitions `RESERVED` reservations to `COMMITTED`.
  - Decrements physical `ProductVariant.qty` exactly once upon captured payment.
  - Clears `Order.reservationExpires = null`.
  - Idempotent: repeated calls are a safe no-op.
  - Late payment after expiry: under row lock re-checks availability. If available, commits and decrements `qty`. If unavailable, throws `InsufficientStockForLatePaymentException` for refund processing.
- **Expiration & Cleanup (`releaseExpired` / `release`)**:
  - Transitions expired `RESERVED` rows to `RELEASED`.
  - **Never** changes physical `qty`.
  - In the same transaction, cancels unpaid `PENDING` orders (`orderStatus = CANCELLED`).
- **Post-Payment Cancellation / Return (`restockCommitted`)**:
  - Transitions `COMMITTED` reservations to `RELEASED`.
  - Increments physical `ProductVariant.qty` back by the restored quantity.
  - Idempotent: safe against duplicate calls.
- **Lock Hierarchy (Deadlock Prevention)**:
  - Level 1: `ProductVariant` rows sorted by `id ASC` (plain string comparison).
  - Level 2: `StockReservation` rows sorted by `id ASC` (plain string comparison).
  - Eliminates all PostgreSQL `40P01` deadlock conditions.


