import * as dotenv from 'dotenv';
dotenv.config();

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { PrismaClient, Role, DiscountType, ReservationStatus, OrderStatus, PaymentStatus } from '@prisma/client';
import { execSync } from 'child_process';
import { AppModule } from '../src/app.module';
import {
  StockReservationService,
  InsufficientStockForLatePaymentException,
} from '../src/inventory/stock-reservation.service';
import { CartValidationService } from '../src/orders/cart-validation.service';
import { OrderValidationService } from '../src/orders/order-validation.service';
import { PaymentEventService } from '../src/payments/payment-event.service';
import { PrismaService } from '../src/database/prisma.service';

// Allow sufficient timeout for remote Neon PostgreSQL queries
jest.setTimeout(120000);

// Configurable race iteration count (default 10)
const RACE_ITERATIONS = parseInt(process.env.RACE_ITERATIONS || '10', 10);

describe('MOODEST — Production Logic & Database Integrity Audit Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let stockReservationService: StockReservationService;
  let cartValidationService: CartValidationService;
  let orderValidationService: OrderValidationService;
  let paymentEventService: PaymentEventService;

  beforeAll(async () => {
    if (!process.env.TEST_DATABASE_URL) {
      throw new Error(
        '\n❌ [TEST SAFETY HALT]: TEST_DATABASE_URL is not set in environment.\n' +
        'To protect database integrity, tests are blocked from running against DATABASE_URL.\n' +
        'Set TEST_DATABASE_URL to a dedicated test database/branch.\n',
      );
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    stockReservationService = moduleFixture.get<StockReservationService>(StockReservationService);
    cartValidationService = moduleFixture.get<CartValidationService>(CartValidationService);
    orderValidationService = moduleFixture.get<OrderValidationService>(OrderValidationService);
    paymentEventService = moduleFixture.get<PaymentEventService>(PaymentEventService);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  // ============================================================================
  // 1. ADMIN SEED SECURITY & IDEMPOTENCY TESTS
  // ============================================================================
  describe('1. Admin Seed Security & Idempotency', () => {
    it('must fail safely when SEED_ADMIN_PASSWORD is missing', () => {
      let failed = false;
      try {
        execSync('npx ts-node prisma/seed.ts', {
          cwd: 'F:/Moodest/backend',
          env: {
            ...process.env,
            DATABASE_URL: process.env.TEST_DATABASE_URL,
            DIRECT_DATABASE_URL: process.env.TEST_DATABASE_URL,
            SEED_ADMIN_EMAIL: 'admin@moodest.com',
            SEED_ADMIN_PASSWORD: '', // Missing
          },
          stdio: 'pipe',
        });
      } catch (error: any) {
        failed = true;
        const output = error.stderr?.toString() || error.stdout?.toString();
        expect(output).toContain('Both SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD are required');
      }
      expect(failed).toBe(true);
    });

    it('must fail safely when SEED_ADMIN_EMAIL is missing', () => {
      let failed = false;
      try {
        execSync('npx ts-node prisma/seed.ts', {
          cwd: 'F:/Moodest/backend',
          env: {
            ...process.env,
            DATABASE_URL: process.env.TEST_DATABASE_URL,
            DIRECT_DATABASE_URL: process.env.TEST_DATABASE_URL,
            SEED_ADMIN_EMAIL: '', // Missing
            SEED_ADMIN_PASSWORD: 'ValidSecurePassword123!',
          },
          stdio: 'pipe',
        });
      } catch (error: any) {
        failed = true;
        const output = error.stderr?.toString() || error.stdout?.toString();
        expect(output).toContain('Both SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD are required');
      }
      expect(failed).toBe(true);
    });

    it('seed twice produces no duplicates and preserves password when SEED_ADMIN_RESET_PASSWORD=false', async () => {
      const email = `audit-admin-${Date.now()}@moodest.com`;
      const initialUser = await prisma.user.create({
        data: {
          email,
          passwordHash: 'original-secret-hash',
          name: 'Original Admin',
          role: Role.ADMIN,
        },
      });

      // Execute seed with SEED_ADMIN_RESET_PASSWORD=false for this admin
      execSync('npx ts-node prisma/seed.ts', {
        cwd: 'F:/Moodest/backend',
        env: {
          ...process.env,
          DATABASE_URL: process.env.TEST_DATABASE_URL,
          DIRECT_DATABASE_URL: process.env.TEST_DATABASE_URL,
          SEED_ADMIN_EMAIL: email,
          SEED_ADMIN_PASSWORD: 'NewAttemptedPassword123!',
          SEED_ADMIN_RESET_PASSWORD: 'false',
        },
        stdio: 'pipe',
      });

      const afterUser = await prisma.user.findUnique({ where: { email } });
      expect(afterUser).toBeDefined();
      expect(afterUser?.id).toBe(initialUser.id);
      // Password hash must be preserved unchanged
      expect(afterUser?.passwordHash).toBe('original-secret-hash');

      const totalAdmins = await prisma.user.count({ where: { email } });
      expect(totalAdmins).toBe(1);

      // Cleanup
      await prisma.user.delete({ where: { id: initialUser.id } });
    });
  });

  // ============================================================================
  // 2. POSTGRESQL CHECK CONSTRAINTS TESTS
  // ============================================================================
  describe('2. PostgreSQL Database CHECK Constraints', () => {
    let checkProduct: any;
    let checkUser: any;

    beforeAll(async () => {
      checkProduct = await prisma.product.create({
        data: {
          name: 'Check Constraint Product',
          slug: `check-constraint-${Date.now()}`,
          image: '/check.jpg',
        },
      });
      checkUser = await prisma.user.create({
        data: {
          email: `check-user-${Date.now()}@moodest.com`,
          passwordHash: 'dummyhash',
        },
      });
    });

    afterAll(async () => {
      if (checkProduct?.id) {
        await prisma.productVariant.deleteMany({ where: { productId: checkProduct.id } });
        await prisma.review.deleteMany({ where: { productId: checkProduct.id } });
        await prisma.product.deleteMany({ where: { id: checkProduct.id } });
      }
      if (checkUser?.id) {
        await prisma.cartItem.deleteMany({ where: { cart: { userId: checkUser.id } } });
        await prisma.cart.deleteMany({ where: { userId: checkUser.id } });
        await prisma.review.deleteMany({ where: { userId: checkUser.id } });
        await prisma.user.deleteMany({ where: { id: checkUser.id } });
      }
    });

    it('must reject negative variant stock (chk_product_variant_qty_non_negative)', async () => {
      let rejected = false;
      try {
        await prisma.productVariant.create({
          data: {
            productId: checkProduct.id,
            sku: `AUDIT-SKU-NEG-${Date.now()}`,
            size: '54',
            color: 'Black',
            price: 1000,
            qty: -5, // VIOLATION
          },
        });
      } catch (err: any) {
        rejected = true;
        expect(err.message).toContain('chk_product_variant_qty_non_negative');
      }
      expect(rejected).toBe(true);
    });

    it('must reject non-positive price (chk_product_variant_price_positive)', async () => {
      let rejected = false;
      try {
        await prisma.productVariant.create({
          data: {
            productId: checkProduct.id,
            sku: `AUDIT-SKU-ZERO-PRICE-${Date.now()}`,
            size: '54',
            color: 'Black',
            price: 0, // VIOLATION
            qty: 10,
          },
        });
      } catch (err: any) {
        rejected = true;
        expect(err.message).toContain('chk_product_variant_price_positive');
      }
      expect(rejected).toBe(true);
    });

    it('must reject offerPrice greater than regular price (chk_product_variant_offer_price_valid)', async () => {
      let rejected = false;
      try {
        await prisma.productVariant.create({
          data: {
            productId: checkProduct.id,
            sku: `AUDIT-SKU-OFFER-${Date.now()}`,
            size: '54',
            color: 'Black',
            price: 2000,
            offerPrice: 2500, // VIOLATION: offerPrice > price
            qty: 10,
          },
        });
      } catch (err: any) {
        rejected = true;
        expect(err.message).toContain('chk_product_variant_offer_price_valid');
      }
      expect(rejected).toBe(true);
    });

    it('must reject cart item non-positive quantity (chk_cart_item_quantity_positive)', async () => {
      const cart = await prisma.cart.create({ data: { userId: checkUser.id } });
      const variant = await prisma.productVariant.create({
        data: {
          productId: checkProduct.id,
          sku: `AUDIT-CART-VAR-${Date.now()}`,
          size: '54',
          color: 'Black',
          price: 1000,
          qty: 10,
        },
      });

      let rejected = false;
      try {
        await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId: checkProduct.id,
            variantId: variant.id,
            quantity: 0, // VIOLATION
          },
        });
      } catch (err: any) {
        rejected = true;
        expect(err.message).toContain('chk_cart_item_quantity_positive');
      }

      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
      await prisma.cart.delete({ where: { id: cart.id } });
      await prisma.productVariant.delete({ where: { id: variant.id } });
      expect(rejected).toBe(true);
    });

    it('must reject review rating outside 1..5 range (chk_review_rating_range)', async () => {
      let rejected = false;
      try {
        await prisma.review.create({
          data: {
            productId: checkProduct.id,
            userId: checkUser.id,
            rating: 6, // VIOLATION: > 5
            comment: 'Out of range review rating',
          },
        });
      } catch (err: any) {
        rejected = true;
        expect(err.message).toContain('chk_review_rating_range');
      }
      expect(rejected).toBe(true);
    });

    it('must reject coupon percentage over 100% (chk_coupon_percentage_range)', async () => {
      let rejected = false;
      try {
        await prisma.coupon.create({
          data: {
            code: `AUDIT-PCT-${Date.now()}`,
            discountType: DiscountType.PERCENTAGE,
            discountValue: 120, // VIOLATION: > 100%
            startDate: new Date('2026-01-01'),
            endDate: new Date('2026-12-31'),
          },
        });
      } catch (err: any) {
        rejected = true;
        expect(err.message).toContain('chk_coupon_percentage_range');
      }
      expect(rejected).toBe(true);
    });

    it('must reject coupon with endDate before startDate (chk_coupon_date_range)', async () => {
      let rejected = false;
      try {
        await prisma.coupon.create({
          data: {
            code: `AUDIT-DATE-${Date.now()}`,
            discountType: DiscountType.FIXED,
            discountValue: 100,
            startDate: new Date('2026-12-31'),
            endDate: new Date('2026-01-01'), // VIOLATION: endDate < startDate
          },
        });
      } catch (err: any) {
        rejected = true;
        expect(err.message).toContain('chk_coupon_date_range');
      }
      expect(rejected).toBe(true);
    });
  });

  // ============================================================================
  // 3. CART & ORDER VALIDATION SERVICES (PRODUCTION CODE)
  // ============================================================================
  describe('3. Production CartValidationService & OrderValidationService', () => {
    let productA: any;
    let productB: any;
    let variantB: any;
    let testUser: any;
    let testAddress: any;
    let testOrder: any;

    beforeAll(async () => {
      testUser = await prisma.user.create({
        data: {
          email: `validation-test-${Date.now()}@moodest.com`,
          passwordHash: 'dummyhash',
          name: 'Validation Test User',
        },
      });

      testAddress = await prisma.address.create({
        data: {
          userId: testUser.id,
          name: 'Validation Address',
          phone: '9876543210',
          street: '123 Test St',
          city: 'Calicut',
          state: 'Kerala',
          pincode: '673001',
        },
      });

      productA = await prisma.product.create({
        data: {
          name: 'Audit Product A',
          slug: `audit-product-a-${Date.now()}`,
          image: '/test-a.jpg',
        },
      });

      productB = await prisma.product.create({
        data: {
          name: 'Audit Product B',
          slug: `audit-product-b-${Date.now()}`,
          image: '/test-b.jpg',
        },
      });

      variantB = await prisma.productVariant.create({
        data: {
          productId: productB.id,
          sku: `AUDIT-VAR-B-${Date.now()}`,
          size: '54',
          color: 'Navy Blue',
          price: 2500,
          offerPrice: 1999,
          qty: 25,
        },
      });

      testOrder = await prisma.order.create({
        data: {
          orderNumber: `ORD-VAL-${Date.now()}`,
          userId: testUser.id,
          addressId: testAddress.id,
          subtotal: 1999,
          totalAmount: 1999,
        },
      });
    });

    afterAll(async () => {
      if (testOrder?.id) {
        await prisma.orderItem.deleteMany({ where: { orderId: testOrder.id } });
        await prisma.order.deleteMany({ where: { id: testOrder.id } });
      }
      if (variantB?.id) {
        await prisma.productVariant.deleteMany({ where: { id: variantB.id } });
      }
      const productIds = [productA?.id, productB?.id].filter(Boolean);
      if (productIds.length > 0) {
        await prisma.product.deleteMany({ where: { id: { in: productIds } } });
      }
      if (testAddress?.id) {
        await prisma.address.deleteMany({ where: { id: testAddress.id } });
      }
      if (testUser?.id) {
        await prisma.user.deleteMany({ where: { id: testUser.id } });
      }
    });

    it('cart product/variant mismatch rejected by CartValidationService', async () => {
      // Calling production CartValidationService: variantB belongs to productB, NOT productA
      await expect(
        cartValidationService.validateCartItem(productA.id, variantB.id, 1),
      ).rejects.toThrow('Integrity Error: Selected variant does not belong to the selected product');
    });

    it('order product/variant mismatch rejected by OrderValidationService', async () => {
      // Calling production OrderValidationService: variantB belongs to productB, NOT productA
      await expect(
        orderValidationService.validateOrderItem({
          productId: productA.id,
          variantId: variantB.id,
          quantity: 1,
        }),
      ).rejects.toThrow('Integrity Error: Order variant does not match product');
    });

    it('client-submitted price ignored and resolved strictly from database (offerPrice ?? price)', async () => {
      const spoofedClientPrice = 1.00;

      // Calling production OrderValidationService with spoofed client price
      const validatedSnapshot = await orderValidationService.validateOrderItem({
        productId: productB.id,
        variantId: variantB.id,
        quantity: 2,
        clientSubmittedPrice: spoofedClientPrice,
      });

      // Must derive offerPrice (1999.00) from database; client price (1.00) ignored
      expect(Number(validatedSnapshot.unitPrice)).toBe(1999.00);
      expect(Number(validatedSnapshot.totalPrice)).toBe(3998.00); // 1999 * 2
      expect(Number(validatedSnapshot.unitPrice)).not.toBe(spoofedClientPrice);

      // Snapshot into database via production OrderValidationService
      const orderItem = await orderValidationService.createValidatedOrderItem(testOrder.id, {
        productId: productB.id,
        variantId: variantB.id,
        quantity: 2,
        clientSubmittedPrice: spoofedClientPrice,
      });

      expect(orderItem.id).toBeDefined();
      expect(Number(orderItem.unitPrice)).toBe(1999.00);
      expect(Number(orderItem.totalPrice)).toBe(3998.00);
    });
  });

  // ============================================================================
  // 4. STOCK RESERVATION CONCURRENCY & LIFECYCLE (PRODUCTION CODE)
  // ============================================================================
  describe('4. Production StockReservationService Concurrency & Lifecycle (Target Model)', () => {
    let testUser: any;
    let testAddress: any;
    let product: any;

    beforeAll(async () => {
      testUser = await prisma.user.create({
        data: {
          email: `audit-stock-${Date.now()}@moodest.com`,
          passwordHash: 'dummyhash',
        },
      });

      testAddress = await prisma.address.create({
        data: {
          userId: testUser.id,
          name: 'Stock Address',
          phone: '9876543210',
          street: '456 Silk Rd',
          city: 'Calicut',
          state: 'Kerala',
          pincode: '673001',
        },
      });

      product = await prisma.product.create({
        data: {
          name: 'Audit Concurrency Abaya',
          slug: `audit-concurrency-${Date.now()}`,
          image: '/concurrency.jpg',
        },
      });
    });

    afterAll(async () => {
      if (testUser?.id) {
        const userOrders = await prisma.order.findMany({ where: { userId: testUser.id } });
        const orderIds = userOrders.map((o) => o.id);
        if (orderIds.length > 0) {
          await prisma.stockReservation.deleteMany({ where: { orderId: { in: orderIds } } });
          await prisma.orderItem.deleteMany({ where: { orderId: { in: orderIds } } });
          await prisma.paymentLog.deleteMany({ where: { orderId: { in: orderIds } } });
          await prisma.order.deleteMany({ where: { id: { in: orderIds } } });
        }
      }
      if (product?.id) {
        await prisma.stockReservation.deleteMany({ where: { variant: { productId: product.id } } });
        await prisma.productVariant.deleteMany({ where: { productId: product.id } });
        await prisma.product.deleteMany({ where: { id: product.id } });
      }
      if (testAddress?.id) {
        await prisma.address.deleteMany({ where: { id: testAddress.id } });
      }
      if (testUser?.id) {
        await prisma.user.deleteMany({ where: { id: testUser.id } });
      }
    });

    // 1. 5 concurrent reserve() for stock 2: exactly 2 succeed, physical qty remains 2 (never negative), active reserved = 2 (<= qty)
    it('1. 5 concurrent reserve() for stock 2: exactly 2 succeed, physical qty remains 2, active reserved = 2 (<= qty)', async () => {
      const limitedVariant = await prisma.productVariant.create({
        data: {
          productId: product.id,
          sku: `AUDIT-CONCUR-2-${Date.now()}`,
          size: '56',
          color: 'Bronze',
          price: 3200,
          qty: 2,
        },
      });

      const orders = await Promise.all(
        [1, 2, 3, 4, 5].map((i) =>
          prisma.order.create({
            data: {
              orderNumber: `ORD-CONCUR-${Date.now()}-${i}`,
              userId: testUser.id,
              addressId: testAddress.id,
              subtotal: 3200,
              totalAmount: 3200,
            },
          }),
        ),
      );

      const results = await Promise.allSettled(
        orders.map((order) =>
          stockReservationService.reserve(order.id, [{ variantId: limitedVariant.id, quantity: 1 }]),
        ),
      );

      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');

      expect(fulfilled).toHaveLength(2);
      expect(rejected).toHaveLength(3);

      for (const rej of rejected) {
        expect((rej as PromiseRejectedResult).reason?.message).toMatch(
          /insufficient stock|transaction already closed|unable to start a transaction/i,
        );
      }

      // Fresh DB query: physical stock NEVER changed by reserve()
      const updatedVariant = await prisma.productVariant.findUniqueOrThrow({
        where: { id: limitedVariant.id },
      });
      expect(updatedVariant.qty).toBe(2);

      // Fresh DB query: active reserved count and sum
      const [{ activeReservedSum }] = await prisma.$queryRaw<Array<{ activeReservedSum: number }>>`
        SELECT COALESCE(SUM("quantity"), 0)::int AS "activeReservedSum"
        FROM "StockReservation"
        WHERE "variantId" = ${limitedVariant.id}
          AND "status" = 'RESERVED'
          AND "expiresAt" > NOW();
      `;
      expect(Number(activeReservedSum)).toBe(2);
      expect(Number(activeReservedSum)).toBeLessThanOrEqual(updatedVariant.qty);

      // Cleanup
      const orderIds = orders.map((o) => o.id);
      await prisma.stockReservation.deleteMany({ where: { orderId: { in: orderIds } } });
      await prisma.order.deleteMany({ where: { id: { in: orderIds } } });
      await prisma.productVariant.delete({ where: { id: limitedVariant.id } });
    });

    // 2. commit twice: qty decrements from 10 to 7 on first commit; second commit is idempotent no-op (qty remains 7)
    it('2. commit twice: qty decrements from 10 to 7 on first commit; second commit is idempotent no-op (qty remains 7)', async () => {
      const variant = await prisma.productVariant.create({
        data: {
          productId: product.id,
          sku: `AUDIT-COMMIT-${Date.now()}`,
          size: '54',
          color: 'Gold',
          price: 4000,
          qty: 10,
        },
      });

      const order = await prisma.order.create({
        data: {
          orderNumber: `ORD-COMMIT-${Date.now()}`,
          userId: testUser.id,
          addressId: testAddress.id,
          subtotal: 12000,
          totalAmount: 12000,
        },
      });

      // Reserve 3 units: physical qty remains 10
      const res = await stockReservationService.reserve(order.id, [{ variantId: variant.id, quantity: 3 }]);
      expect(res.reservations).toHaveLength(1);
      const afterReserveVariant = await prisma.productVariant.findUniqueOrThrow({ where: { id: variant.id } });
      expect(afterReserveVariant.qty).toBe(10);

      // First commit call: transitions to COMMITTED and decrements qty from 10 to 7
      const firstCommit = await stockReservationService.commit(order.id);
      expect(firstCommit.status).toBe('COMMITTED');
      expect(firstCommit.committedCount).toBe(1);

      const afterFirstCommitVariant = await prisma.productVariant.findUniqueOrThrow({ where: { id: variant.id } });
      expect(afterFirstCommitVariant.qty).toBe(7);

      const resAfterFirst = await prisma.stockReservation.findFirstOrThrow({ where: { orderId: order.id } });
      expect(resAfterFirst.status).toBe(ReservationStatus.COMMITTED);

      const orderAfterFirst = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
      expect(orderAfterFirst.reservationExpires).toBeNull();

      // Second commit call: idempotent no-op, qty remains 7
      const secondCommit = await stockReservationService.commit(order.id);
      expect(secondCommit.status).toBe('ALREADY_COMMITTED');
      expect(secondCommit.committedCount).toBe(0);

      const afterSecondCommitVariant = await prisma.productVariant.findUniqueOrThrow({ where: { id: variant.id } });
      expect(afterSecondCommitVariant.qty).toBe(7);

      // Cleanup
      await prisma.stockReservation.deleteMany({ where: { orderId: order.id } });
      await prisma.order.delete({ where: { id: order.id } });
      await prisma.productVariant.delete({ where: { id: variant.id } });
    });

    // 3. commit vs releaseExpired race x RACE_ITERATIONS (default 10): run in parallel for an expiring reservation
    it('3. commit vs releaseExpired race x RACE_ITERATIONS (default 10): no 40P01 deadlock, consistent final state', async () => {
      for (let i = 0; i < RACE_ITERATIONS; i++) {
        const v = await prisma.productVariant.create({
          data: {
            productId: product.id,
            sku: `AUDIT-RACE-COM-EXP-${Date.now()}-${i}`,
            size: '54',
            color: 'Emerald',
            price: 3800,
            qty: 10,
          },
        });

        const o = await prisma.order.create({
          data: {
            orderNumber: `ORD-RACE-CE-${Date.now()}-${i}`,
            userId: testUser.id,
            addressId: testAddress.id,
            subtotal: 7600,
            totalAmount: 7600,
            orderStatus: 'PENDING',
            paymentStatus: 'PENDING',
          },
        });

        await stockReservationService.reserve(o.id, [{ variantId: v.id, quantity: 2 }]);

        // Force reservation to be expired using database clock
        await prisma.$executeRaw`
          UPDATE "StockReservation"
          SET "expiresAt" = NOW() - INTERVAL '1 second'
          WHERE "orderId" = ${o.id};
        `;

        // Concurrently launch commit() and releaseExpired()
        const [commitRes, releaseRes] = await Promise.allSettled([
          stockReservationService.commit(o.id),
          stockReservationService.releaseExpired(),
        ]);

        // Check neither operation failed with 40P01 deadlock
        if (commitRes.status === 'rejected') {
          const err = commitRes.reason?.message || '';
          expect(err).not.toMatch(/deadlock detected|40P01/i);
        }
        if (releaseRes.status === 'rejected') {
          const err = releaseRes.reason?.message || '';
          expect(err).not.toMatch(/deadlock detected|40P01/i);
        }

        // Fresh DB query: final state is consistent (COMMITTED and qty=8, or RELEASED and qty=10)
        const reservation = await prisma.stockReservation.findFirstOrThrow({ where: { orderId: o.id } });
        const finalVar = await prisma.productVariant.findUniqueOrThrow({ where: { id: v.id } });

        if (reservation.status === ReservationStatus.COMMITTED) {
          expect(finalVar.qty).toBe(8);
        } else if (reservation.status === ReservationStatus.RELEASED) {
          expect(finalVar.qty).toBe(10);
        } else {
          throw new Error(`Unexpected reservation status: ${reservation.status}`);
        }

        // Cleanup this iteration
        await prisma.stockReservation.deleteMany({ where: { orderId: o.id } });
        await prisma.order.delete({ where: { id: o.id } });
        await prisma.productVariant.delete({ where: { id: v.id } });
      }
    }, 180000);

    // 4. reserve vs releaseExpired race x RACE_ITERATIONS: run in parallel. No 40P01, stock never negative, sum(active reserved) <= qty
    it('4. reserve vs releaseExpired race x RACE_ITERATIONS: no 40P01 deadlock, stock never negative, active <= qty', async () => {
      const v = await prisma.productVariant.create({
        data: {
          productId: product.id,
          sku: `SKU-RACE-RES-EXP-${Date.now()}`,
          size: 'M',
          color: 'Black',
          price: 2900,
          qty: 2,
        },
      });

      for (let i = 0; i < RACE_ITERATIONS; i++) {
        const o1 = await prisma.order.create({
          data: {
            orderNumber: `ORD-RACE-RE1-${Date.now()}-${i}`,
            userId: testUser.id,
            addressId: testAddress.id,
            subtotal: 5800,
            totalAmount: 5800,
            orderStatus: 'PENDING',
            paymentStatus: 'PENDING',
          },
        });

        const o2 = await prisma.order.create({
          data: {
            orderNumber: `ORD-RACE-RE2-${Date.now()}-${i}`,
            userId: testUser.id,
            addressId: testAddress.id,
            subtotal: 5800,
            totalAmount: 5800,
            orderStatus: 'PENDING',
            paymentStatus: 'PENDING',
          },
        });

        // O1 reserves 2 units
        await stockReservationService.reserve(o1.id, [{ variantId: v.id, quantity: 2 }]);

        // Force O1's reservation to expired
        await prisma.$executeRaw`
          UPDATE "StockReservation"
          SET "expiresAt" = NOW() - INTERVAL '1 second'
          WHERE "orderId" = ${o1.id};
        `;

        // Launch concurrent reserve(o2) vs releaseExpired()
        const [resReserve, resReleaseExp] = await Promise.allSettled([
          stockReservationService.reserve(o2.id, [{ variantId: v.id, quantity: 2 }]),
          stockReservationService.releaseExpired(),
        ]);

        if (resReserve.status === 'rejected') {
          const err = resReserve.reason?.message || '';
          expect(err).not.toMatch(/deadlock detected|40P01/i);
        }
        if (resReleaseExp.status === 'rejected') {
          const err = resReleaseExp.reason?.message || '';
          expect(err).not.toMatch(/deadlock detected|40P01/i);
        }

        // Fresh DB query: physical qty remains 2 (reserve NEVER decrements physical qty)
        const currentVar = await prisma.productVariant.findUniqueOrThrow({ where: { id: v.id } });
        expect(currentVar.qty).toBe(2);

        // Sum of active unexpired reserved reservations must never exceed physical qty (2)
        const [{ activeSum }] = await prisma.$queryRaw<Array<{ activeSum: number }>>`
          SELECT COALESCE(SUM("quantity"), 0)::int AS "activeSum"
          FROM "StockReservation"
          WHERE "variantId" = ${v.id}
            AND "status" = 'RESERVED'
            AND "expiresAt" > NOW();
        `;
        expect(Number(activeSum)).toBeLessThanOrEqual(currentVar.qty);

        // Cleanup this iteration
        await prisma.stockReservation.deleteMany({ where: { orderId: { in: [o1.id, o2.id] } } });
        await prisma.order.deleteMany({ where: { id: { in: [o1.id, o2.id] } } });
      }

      await prisma.productVariant.delete({ where: { id: v.id } });
    }, 180000);

    // 5. Expired reservation: a second reserve reuses the row; late commit succeeds only if stock remains, fails with InsufficientStockForLatePaymentException if not
    it('5. expired reservation: second reserve reuses row; late commit succeeds if stock remains, fails with InsufficientStockForLatePaymentException if not', async () => {
      // PART A & B: Single variant with sufficient stock
      const variantA = await prisma.productVariant.create({
        data: {
          productId: product.id,
          sku: `AUDIT-REUSE-LATE-${Date.now()}`,
          size: '58',
          color: 'Taupe',
          price: 3500,
          qty: 10,
        },
      });

      const order1 = await prisma.order.create({
        data: {
          orderNumber: `ORD-REUSE-LATE-1-${Date.now()}`,
          userId: testUser.id,
          addressId: testAddress.id,
          subtotal: 7000,
          totalAmount: 7000,
        },
      });

      // 1. Initial reservation
      const firstRes = await stockReservationService.reserve(order1.id, [{ variantId: variantA.id, quantity: 2 }]);
      const firstResId = firstRes.reservations[0].id;

      // Force expiry
      await prisma.$executeRaw`
        UPDATE "StockReservation"
        SET "expiresAt" = NOW() - INTERVAL '5 seconds'
        WHERE "orderId" = ${order1.id};
      `;

      // 2. Second reserve reuses the row without unique violation
      const secondRes = await stockReservationService.reserve(order1.id, [{ variantId: variantA.id, quantity: 2 }]);
      expect(secondRes.reservations).toHaveLength(1);
      expect(secondRes.reservations[0].id).toBe(firstResId); // SAME ROW REUSED
      expect(secondRes.reservations[0].status).toBe(ReservationStatus.RESERVED);

      // Verify strictly 1 row in DB
      const rowCount = await prisma.stockReservation.count({
        where: { orderId: order1.id, variantId: variantA.id },
      });
      expect(rowCount).toBe(1);

      // 3. Late commit when stock remains:
      // Force expiry again
      await prisma.$executeRaw`
        UPDATE "StockReservation"
        SET "expiresAt" = NOW() - INTERVAL '5 seconds'
        WHERE "orderId" = ${order1.id};
      `;

      // Commit should succeed as COMMITTED_LATE because available = 10 - 0 = 10 >= 2
      const lateCommitResult = await stockReservationService.commit(order1.id);
      expect(lateCommitResult.status).toBe('COMMITTED_LATE');
      expect(lateCommitResult.committedCount).toBe(1);

      // Fresh DB query: physical stock decremented to 8
      const varACheck = await prisma.productVariant.findUniqueOrThrow({ where: { id: variantA.id } });
      expect(varACheck.qty).toBe(8);

      // PART C: Late commit when stock is insufficient -> InsufficientStockForLatePaymentException
      const variantB = await prisma.productVariant.create({
        data: {
          productId: product.id,
          sku: `AUDIT-LATE-FAIL-${Date.now()}`,
          size: '56',
          color: 'Navy',
          price: 3000,
          qty: 2,
        },
      });

      const order2 = await prisma.order.create({
        data: {
          orderNumber: `ORD-LATE-FAIL-2-${Date.now()}`,
          userId: testUser.id,
          addressId: testAddress.id,
          subtotal: 6000,
          totalAmount: 6000,
        },
      });

      const order3 = await prisma.order.create({
        data: {
          orderNumber: `ORD-LATE-FAIL-3-${Date.now()}`,
          userId: testUser.id,
          addressId: testAddress.id,
          subtotal: 6000,
          totalAmount: 6000,
        },
      });

      // Order 2 reserves the 2 available units
      await stockReservationService.reserve(order2.id, [{ variantId: variantB.id, quantity: 2 }]);

      // Force Order 2 to expire
      await prisma.$executeRaw`
        UPDATE "StockReservation"
        SET "expiresAt" = NOW() - INTERVAL '5 seconds'
        WHERE "orderId" = ${order2.id};
      `;

      // Order 3 reserves the 2 units (succeeds because Order 2 is expired)
      await stockReservationService.reserve(order3.id, [{ variantId: variantB.id, quantity: 2 }]);

      // Now Order 2 attempts late payment: commit(order2.id)
      // Stock is insufficient (available = 2 physical - 2 active Order 3 = 0 < 2)
      await expect(stockReservationService.commit(order2.id)).rejects.toThrow(
        InsufficientStockForLatePaymentException,
      );

      // Fresh DB query: variant B physical qty still 2
      const varBCheck = await prisma.productVariant.findUniqueOrThrow({ where: { id: variantB.id } });
      expect(varBCheck.qty).toBe(2);

      // Cleanup
      await prisma.stockReservation.deleteMany({ where: { orderId: { in: [order1.id, order2.id, order3.id] } } });
      await prisma.order.deleteMany({ where: { id: { in: [order1.id, order2.id, order3.id] } } });
      await prisma.productVariant.deleteMany({ where: { id: { in: [variantA.id, variantB.id] } } });
    });

    // 6. release and releaseExpired called twice: no qty change; unpaid PENDING order cancelled once
    it('6. release and releaseExpired called twice: no qty change; unpaid PENDING order cancelled once', async () => {
      const variant = await prisma.productVariant.create({
        data: {
          productId: product.id,
          sku: `AUDIT-REL-TWICE-${Date.now()}`,
          size: '52',
          color: 'Olive',
          price: 2800,
          qty: 10,
        },
      });

      const orderManual = await prisma.order.create({
        data: {
          orderNumber: `ORD-REL-MANUAL-${Date.now()}`,
          userId: testUser.id,
          addressId: testAddress.id,
          subtotal: 5600,
          totalAmount: 5600,
          orderStatus: 'PENDING',
          paymentStatus: 'PENDING',
        },
      });

      // PART A: release(orderId) called twice
      await stockReservationService.reserve(orderManual.id, [{ variantId: variant.id, quantity: 4 }]);
      let varCheck = await prisma.productVariant.findUniqueOrThrow({ where: { id: variant.id } });
      expect(varCheck.qty).toBe(10); // Physical qty unchanged

      const firstRel = await stockReservationService.release(orderManual.id);
      expect(firstRel.releasedCount).toBe(1);

      varCheck = await prisma.productVariant.findUniqueOrThrow({ where: { id: variant.id } });
      expect(varCheck.qty).toBe(10); // NO qty change

      const resAfterRel = await prisma.stockReservation.findFirstOrThrow({ where: { orderId: orderManual.id } });
      expect(resAfterRel.status).toBe(ReservationStatus.RELEASED);

      const orderAfterRel = await prisma.order.findUniqueOrThrow({ where: { id: orderManual.id } });
      expect(orderAfterRel.reservationExpires).toBeNull();

      // Second release: idempotent
      const secondRel = await stockReservationService.release(orderManual.id);
      expect(secondRel.releasedCount).toBe(0);
      varCheck = await prisma.productVariant.findUniqueOrThrow({ where: { id: variant.id } });
      expect(varCheck.qty).toBe(10);

      // PART B: releaseExpired() called twice + unpaid PENDING order cancelled once
      const orderExp = await prisma.order.create({
        data: {
          orderNumber: `ORD-REL-EXP-${Date.now()}`,
          userId: testUser.id,
          addressId: testAddress.id,
          subtotal: 5600,
          totalAmount: 5600,
          orderStatus: 'PENDING',
          paymentStatus: 'PENDING',
        },
      });

      await stockReservationService.reserve(orderExp.id, [{ variantId: variant.id, quantity: 3 }]);

      // Force expired
      await prisma.$executeRaw`
        UPDATE "StockReservation"
        SET "expiresAt" = NOW() - INTERVAL '5 seconds'
        WHERE "orderId" = ${orderExp.id};
      `;

      // First releaseExpired: flips reservation to RELEASED, cancels unpaid PENDING order
      const firstExp = await stockReservationService.releaseExpired();
      expect(firstExp.releasedCount).toBeGreaterThanOrEqual(1);

      // Verify order cancelled and reservationExpires cleared
      const orderExpDb = await prisma.order.findUniqueOrThrow({ where: { id: orderExp.id } });
      expect(orderExpDb.orderStatus).toBe(OrderStatus.CANCELLED);
      expect(orderExpDb.reservationExpires).toBeNull();

      varCheck = await prisma.productVariant.findUniqueOrThrow({ where: { id: variant.id } });
      expect(varCheck.qty).toBe(10); // NO qty change

      // Second releaseExpired: idempotent
      const secondExp = await stockReservationService.releaseExpired();
      expect(secondExp.releasedCount).toBe(0);
      expect(secondExp.cancelledOrdersCount).toBe(0);

      varCheck = await prisma.productVariant.findUniqueOrThrow({ where: { id: variant.id } });
      expect(varCheck.qty).toBe(10);

      // Cleanup
      await prisma.stockReservation.deleteMany({ where: { orderId: { in: [orderManual.id, orderExp.id] } } });
      await prisma.order.deleteMany({ where: { id: { in: [orderManual.id, orderExp.id] } } });
      await prisma.productVariant.delete({ where: { id: variant.id } });
    });

    // 7. restockCommitted called twice: qty restored once from 7 to 10; second call is idempotent
    it('7. restockCommitted called twice: qty restored once from 7 to 10; second call is idempotent', async () => {
      const variant = await prisma.productVariant.create({
        data: {
          productId: product.id,
          sku: `AUDIT-RESTOCK-${Date.now()}`,
          size: '56',
          color: 'Champagne',
          price: 4500,
          qty: 10,
        },
      });

      const order = await prisma.order.create({
        data: {
          orderNumber: `ORD-RESTOCK-${Date.now()}`,
          userId: testUser.id,
          addressId: testAddress.id,
          subtotal: 13500,
          totalAmount: 13500,
        },
      });

      // Reserve 3 units
      await stockReservationService.reserve(order.id, [{ variantId: variant.id, quantity: 3 }]);

      // Commit order: physical qty decrements from 10 to 7
      const commitRes = await stockReservationService.commit(order.id);
      expect(commitRes.status).toBe('COMMITTED');

      let varCheck = await prisma.productVariant.findUniqueOrThrow({ where: { id: variant.id } });
      expect(varCheck.qty).toBe(7);

      // First restockCommitted: restores physical qty from 7 back to 10
      const firstRestock = await stockReservationService.restockCommitted(order.id);
      expect(firstRestock.restockedCount).toBe(1);

      varCheck = await prisma.productVariant.findUniqueOrThrow({ where: { id: variant.id } });
      expect(varCheck.qty).toBe(10);

      const resRow = await prisma.stockReservation.findFirstOrThrow({ where: { orderId: order.id } });
      expect(resRow.status).toBe(ReservationStatus.RELEASED);

      const orderDb = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
      expect(orderDb.reservationExpires).toBeNull();

      // Second restockCommitted: idempotent no-op (qty remains 10)
      const secondRestock = await stockReservationService.restockCommitted(order.id);
      expect(secondRestock.restockedCount).toBe(0);

      varCheck = await prisma.productVariant.findUniqueOrThrow({ where: { id: variant.id } });
      expect(varCheck.qty).toBe(10); // NOT 13!

      // Cleanup
      await prisma.stockReservation.deleteMany({ where: { orderId: order.id } });
      await prisma.order.delete({ where: { id: order.id } });
      await prisma.productVariant.delete({ where: { id: variant.id } });
    });
  });

  // ============================================================================
  // 5. PAYMENT EVENT IDEMPOTENCY SERVICE (PRODUCTION CODE)
  // ============================================================================
  describe('5. Production PaymentEventService Idempotency', () => {
    let testUser: any;
    let testAddress: any;
    let testOrder: any;

    beforeAll(async () => {
      testUser = await prisma.user.create({
        data: {
          email: `payment-test-${Date.now()}@moodest.com`,
          passwordHash: 'dummyhash',
        },
      });

      testAddress = await prisma.address.create({
        data: {
          userId: testUser.id,
          name: 'Payment Address',
          phone: '9876543210',
          street: '789 Pearl Way',
          city: 'Calicut',
          state: 'Kerala',
          pincode: '673001',
        },
      });

      testOrder = await prisma.order.create({
        data: {
          orderNumber: `ORD-PAY-${Date.now()}`,
          userId: testUser.id,
          addressId: testAddress.id,
          subtotal: 5000,
          totalAmount: 5000,
        },
      });
    });

    afterAll(async () => {
      if (testOrder?.id) {
        await prisma.paymentLog.deleteMany({ where: { orderId: testOrder.id } });
        await prisma.order.delete({ where: { id: testOrder.id } });
      }
      if (testAddress?.id) {
        await prisma.address.delete({ where: { id: testAddress.id } });
      }
      if (testUser?.id) {
        await prisma.user.delete({ where: { id: testUser.id } });
      }
    });

    it('duplicate gatewayEventId processed once and duplicate ignored safely', async () => {
      const eventId = `evt_rzp_prod_${Date.now()}`;
      const payload = { id: eventId, entity: 'event', event: 'payment.captured', amount: 5000 };

      // First call to production PaymentEventService: must process and insert PaymentLog
      const firstResult = await paymentEventService.recordEvent(testOrder.id, eventId, payload);
      expect(firstResult.isDuplicate).toBe(false);
      expect(firstResult.status).toBe('PROCESSED');
      expect(firstResult.paymentLog?.id).toBeDefined();

      // Second call to production PaymentEventService with identical gatewayEventId:
      // Must catch P2002 collision, return ALREADY_PROCESSED, and skip duplicate side effects
      const secondResult = await paymentEventService.recordEvent(testOrder.id, eventId, payload);
      expect(secondResult.isDuplicate).toBe(true);
      expect(secondResult.status).toBe('ALREADY_PROCESSED');

      // Verify exactly one payment log exists in the database
      const count = await prisma.paymentLog.count({ where: { gatewayEventId: eventId } });
      expect(count).toBe(1);
    });

    it('recordEvent accepts optional Prisma transaction client parameter', async () => {
      const eventId = `evt_rzp_tx_${Date.now()}`;
      const payload = { id: eventId, entity: 'event', event: 'payment.captured', amount: 5000 };

      // Execute recordEvent within a prisma.$transaction using the tx parameter
      const result = await prisma.$transaction(
        async (tx) => {
          return paymentEventService.recordEvent(testOrder.id, eventId, payload, 'payment.captured', tx);
        },
        { maxWait: 15000, timeout: 30000 },
      );

      expect(result.isDuplicate).toBe(false);
      expect(result.status).toBe('PROCESSED');
      expect(result.paymentLog?.id).toBeDefined();

      const count = await prisma.paymentLog.count({ where: { gatewayEventId: eventId } });
      expect(count).toBe(1);
    });

    it('8. commit and recordEvent run in ONE transaction and both roll back if either fails', async () => {
      // 1. Create a dedicated test category, product, variant and order (no findFirstOrThrow on seeded data)
      const testCategory = await prisma.category.create({
        data: { name: `Cat-TX-${Date.now()}`, slug: `cat-tx-${Date.now()}`, image: '/cat.jpg' },
      });
      const testProduct = await prisma.product.create({
        data: { name: `Prod-TX-${Date.now()}`, slug: `prod-tx-${Date.now()}`, image: '/prod.jpg', categoryId: testCategory.id },
      });
      const testVar = await prisma.productVariant.create({
        data: {
          productId: testProduct.id,
          sku: `SKU-TX-ROLLBACK-${Date.now()}`,
          size: 'M',
          color: 'Emerald',
          price: 3200,
          qty: 5,
        },
      });

      const txOrder = await prisma.order.create({
        data: {
          orderNumber: `ORD-TX-${Date.now()}`,
          userId: testUser.id,
          addressId: testAddress.id,
          subtotal: 3200,
          totalAmount: 3200,
        },
      });

      // Reserve 2 units: physical qty remains 5
      await stockReservationService.reserve(txOrder.id, [{ variantId: testVar.id, quantity: 2 }]);
      let resCheck = await prisma.stockReservation.findUniqueOrThrow({
        where: { orderId_variantId: { orderId: txOrder.id, variantId: testVar.id } },
      });
      expect(resCheck.status).toBe(ReservationStatus.RESERVED);

      let varCheck = await prisma.productVariant.findUniqueOrThrow({ where: { id: testVar.id } });
      expect(varCheck.qty).toBe(5);

      const failEventId = `evt_fail_tx_${Date.now()}`;
      const payload = { id: failEventId, amount: 3200 };

      // 2. Execute commit + recordEvent in ONE transaction, then simulate a subsequent failure
      let txErrorThrown = false;
      try {
        await prisma.$transaction(
          async (tx) => {
            // A. Commit reservation using tx (decrements physical qty to 3, sets status to COMMITTED)
            await stockReservationService.commit(txOrder.id, tx);

            // B. Record payment event using tx
            await paymentEventService.recordEvent(txOrder.id, failEventId, payload, 'payment.captured', tx);

            // C. Simulate a catastrophic failure after both steps
            throw new Error('SIMULATED_TRANSACTION_FAILURE');
          },
          { maxWait: 15000, timeout: 30000 },
        );
      } catch (err: any) {
        if (err.message === 'SIMULATED_TRANSACTION_FAILURE') {
          txErrorThrown = true;
        }
      }
      expect(txErrorThrown).toBe(true);

      // 3. Verify complete rollback of BOTH operations:
      // A. StockReservation must NOT be COMMITTED (must still be RESERVED)
      resCheck = await prisma.stockReservation.findUniqueOrThrow({
        where: { orderId_variantId: { orderId: txOrder.id, variantId: testVar.id } },
      });
      expect(resCheck.status).toBe(ReservationStatus.RESERVED);

      // B. Physical qty must be restored to 5 (not decremented to 3)
      varCheck = await prisma.productVariant.findUniqueOrThrow({ where: { id: testVar.id } });
      expect(varCheck.qty).toBe(5);

      // C. PaymentLog must NOT contain the event
      const logCount = await prisma.paymentLog.count({ where: { gatewayEventId: failEventId } });
      expect(logCount).toBe(0);

      // 4. Now execute the same transaction without failure: both operations must commit atomically
      const successEventId = `evt_success_tx_${Date.now()}`;
      await prisma.$transaction(
        async (tx) => {
          await stockReservationService.commit(txOrder.id, tx);
          await paymentEventService.recordEvent(txOrder.id, successEventId, payload, 'payment.captured', tx);
        },
        { maxWait: 15000, timeout: 30000 },
      );

      // Verify both committed:
      resCheck = await prisma.stockReservation.findUniqueOrThrow({
        where: { orderId_variantId: { orderId: txOrder.id, variantId: testVar.id } },
      });
      expect(resCheck.status).toBe(ReservationStatus.COMMITTED);

      varCheck = await prisma.productVariant.findUniqueOrThrow({ where: { id: testVar.id } });
      expect(varCheck.qty).toBe(3); // 5 - 2

      const successLogCount = await prisma.paymentLog.count({ where: { gatewayEventId: successEventId } });
      expect(successLogCount).toBe(1);

      // Cleanup
      await prisma.paymentLog.deleteMany({ where: { orderId: txOrder.id } });
      await prisma.stockReservation.deleteMany({ where: { orderId: txOrder.id } });
      await prisma.order.delete({ where: { id: txOrder.id } });
      await prisma.productVariant.delete({ where: { id: testVar.id } });
      await prisma.product.delete({ where: { id: testProduct.id } });
      await prisma.category.delete({ where: { id: testCategory.id } });
    });

    it('must protect payment logs from accidental deletion via ON DELETE RESTRICT', async () => {
      let deleteBlocked = false;
      try {
        await prisma.order.delete({
          where: { id: testOrder.id },
        });
      } catch (err: any) {
        deleteBlocked = true;
        expect(err.message || err.code).toBeDefined();
      }
      expect(deleteBlocked).toBe(true);
    });
  });
});
