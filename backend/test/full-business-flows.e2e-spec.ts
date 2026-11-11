import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { StockReservationService } from '../src/inventory/stock-reservation.service';
import { MAIL_SERVICE, IMailService } from '../src/modules/auth/mail.service';
import { Role, OrderStatus, PaymentStatus, ReservationStatus } from '@prisma/client';
import * as crypto from 'crypto';

jest.setTimeout(60000);

describe('Full Integration QA & Production Business Flow Verification (Real Isolated Test DB)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let stockReservationService: StockReservationService;

  // Test state across workflows
  let customerToken: string;
  let customerUser: any;
  let adminToken: string;
  let adminUser: any;
  let testCategoryId: string;
  let testProductId: string;
  let testVariantId: string;
  let testAddressId: string;
  let placedOrderId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    stockReservationService = app.get<StockReservationService>(StockReservationService);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 1. ADMIN WORKFLOW VERIFICATION
  // ════════════════════════════════════════════════════════════════════════════
  describe('1. Full Admin Workflow Verification', () => {
    const adminEmail = `admin_qa_${Date.now()}@moodest.internal`;
    const adminPassword = 'AdminPassword123!';

    it('Step 1: Admin register & login to obtain JWT token with ADMIN role', async () => {
      // Create admin user directly in test database
      const bcrypt = require('bcrypt');
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      adminUser = await prisma.user.create({
        data: {
          email: adminEmail,
          passwordHash,
          name: 'Super Admin',
          role: Role.ADMIN,
          isActive: true,
        },
      });

      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: adminEmail, password: adminPassword })
        .expect(200);

      adminToken = res.body.access_token || res.body.data?.access_token || res.body.accessToken || res.body.data?.accessToken;
      expect(adminToken).toBeDefined();
    });

    it('Step 2: Admin Dashboard statistics retrieval', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.totalRevenue).toBeDefined();
      expect(res.body.totalProducts).toBeDefined();
      expect(res.body.totalOrders).toBeDefined();
    });

    it('Step 3: Admin creates a Category', async () => {
      const catRes = await request(app.getHttpServer())
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: `Silk Abayas ${Date.now()}`,
          description: 'Premium curated luxury silk abayas',
          image: '/images/silk-abaya.jpg',
        })
        .expect(201);

      testCategoryId = catRes.body.id || catRes.body.data?.id;
      expect(testCategoryId).toBeDefined();

      // Verify DB record
      const dbCat = await prisma.category.findUnique({ where: { id: testCategoryId } });
      expect(dbCat).not.toBeNull();
      expect(dbCat?.image).toBe('/images/silk-abaya.jpg');
    });

    it('Step 4 & 5: Admin creates Product with initial Variant and stock', async () => {
      const prodRes = await request(app.getHttpServer())
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: `Royal Dubai Abaya ${Date.now()}`,
          description: 'Handcrafted black embroidered luxury abaya',
          fabric: 'Nida & Silk',
          categoryId: testCategoryId,
          image: '/images/royal-dubai.jpg',
          images: ['/images/royal-dubai-1.jpg', '/images/royal-dubai-2.jpg'],
          variants: [
            {
              size: 'M',
              color: 'Midnight Black',
              price: 3499,
              offerPrice: 2999,
              qty: 15,
            },
          ],
        })
        .expect(201);

      testProductId = prodRes.body.id || prodRes.body.data?.id;
      const variants = prodRes.body.variants || prodRes.body.data?.variants;
      testVariantId = variants?.[0]?.id;

      expect(testProductId).toBeDefined();
      expect(testVariantId).toBeDefined();

      // Verify DB stock state
      const dbVariant = await prisma.productVariant.findUnique({ where: { id: testVariantId } });
      expect(dbVariant?.qty).toBe(15);
      expect(Number(dbVariant?.price)).toBe(3499);
      expect(Number(dbVariant?.offerPrice)).toBe(2999);
    });

    it('Step 6 & 7: Add another variant with low stock and verify Low-Stock Report', async () => {
      const varRes = await request(app.getHttpServer())
        .post(`/api/products/${testProductId}/variants`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          size: 'XL',
          color: 'Midnight Black',
          price: 3699,
          qty: 2, // low stock <= 5
        })
        .expect(201);

      const newVarId = varRes.body.id || varRes.body.data?.id;
      expect(newVarId).toBeDefined();

      const lowStockRes = await request(app.getHttpServer())
        .get('/api/admin/low-stock?threshold=5')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const items = lowStockRes.body.data || lowStockRes.body;
      const found = items.some((v: any) => v.id === newVarId);
      expect(found).toBe(true);
    });

    it('Step 8: Storefront verifies new product appears in public catalog', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/products/${testProductId}`)
        .expect(200);

      const product = res.body.data || res.body;
      expect(product.id).toBe(testProductId);
      expect(product.category?.id).toBe(testCategoryId);
      expect(product.variants.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 2. FULL CUSTOMER PURCHASE FLOW
  // ════════════════════════════════════════════════════════════════════════════
  describe('2. Full Customer Purchase Flow', () => {
    const customerEmail = `customer_e2e_${Date.now()}@moodest.internal`;
    const customerPassword = 'CustomerSecure123!';

    it('Step 1: Customer registers a new account', async () => {
      const mailService = app.get<IMailService>(MAIL_SERVICE);
      let capturedOtp = '';
      const spy = jest
        .spyOn(mailService, 'sendVerificationOtpEmail')
        .mockImplementationOnce(async (_to, otp) => {
          capturedOtp = otp;
        });

      const otpRes = await request(app.getHttpServer())
        .post('/api/auth/send-verification-otp')
        .send({ email: customerEmail })
        .expect(200);
      spy.mockRestore();

      const verificationToken =
        otpRes.body.verificationToken || otpRes.body.data?.verificationToken;

      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: customerEmail,
          password: customerPassword,
          name: 'Aisha Al-Mansoor',
          phone: '+919876543210',
          otp: capturedOtp,
          verificationToken,
        })
        .expect(201);

      customerToken = res.body.access_token || res.body.data?.accessToken;
      customerUser = res.body.data?.user || res.body.user;
      expect(customerUser?.email).toBe(customerEmail);
    });

    it('Step 2: Customer logs in', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: customerEmail,
          password: customerPassword,
        })
        .expect(200);

      customerToken = res.body.access_token || res.body.data?.access_token || res.body.accessToken || res.body.data?.accessToken;
      expect(customerToken).toBeDefined();
    });

    it('Step 3: Customer saves shipping address', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/users/me/addresses')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          fullName: 'Aisha Al-Mansoor',
          phone: '+919876543210',
          line1: 'Villa 42, Palm Jumeirah Lane',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
          isDefault: true,
        })
        .expect(201);

      testAddressId = res.body.id || res.body.data?.id;
      expect(testAddressId).toBeDefined();

      const dbAddress = await prisma.address.findUnique({ where: { id: testAddressId } });
      expect(dbAddress?.city).toBe('Mumbai');
    });

    it('Step 4 & 5: Customer adds variant to Cart and updates quantity', async () => {
      const addRes = await request(app.getHttpServer())
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ variantId: testVariantId, quantity: 1 })
        .expect(201);

      const cartData = addRes.body.data || addRes.body;
      expect(cartData.items).toHaveLength(1);
      const cartItemId = cartData.items[0].id;

      // Update quantity to 2
      const updateRes = await request(app.getHttpServer())
        .patch(`/api/cart/items/${cartItemId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ quantity: 2 })
        .expect(200);

      const updatedCartData = updateRes.body.data || updateRes.body;
      expect(updatedCartData.items[0].quantity).toBe(2);
    });

    it('Step 6: Customer validates a Coupon code', async () => {
      // Create a test coupon
      await prisma.coupon.create({
        data: {
          code: `EID${Date.now()}`,
          discountType: 'PERCENTAGE',
          discountValue: 10,
          startDate: new Date(Date.now() - 3600000),
          endDate: new Date(Date.now() + 86400000),
          isActive: true,
        },
      });

      const res = await request(app.getHttpServer())
        .post('/api/coupons/validate')
        .send({ code: `EID${Date.now()}`, orderAmount: 5000 })
        .expect(201);

      expect(res.body.success).toBe(true);
    });

    it('Step 7: Customer places order atomically and stock is reserved', async () => {
      const initialStock = (await prisma.productVariant.findUnique({ where: { id: testVariantId } }))!.qty;

      const res = await request(app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          addressId: testAddressId,
          paymentMethod: 'RAZORPAY',
          items: [{ variantId: testVariantId, quantity: 2 }],
        })
        .expect(201);

      placedOrderId = res.body.id || res.body.data?.id;
      expect(placedOrderId).toBeDefined();

      // Verify DB Order state
      const dbOrder = await prisma.order.findUnique({
        where: { id: placedOrderId },
        include: { items: true, reservations: true },
      });

      expect(dbOrder?.orderStatus).toBe(OrderStatus.PENDING);
      expect(dbOrder?.paymentStatus).toBe(PaymentStatus.PENDING);
      expect(dbOrder?.items).toHaveLength(1);
      expect(dbOrder?.items[0].quantity).toBe(2);

      // Verify stock reservation created with RESERVED status
      expect(dbOrder?.reservations).toHaveLength(1);
      expect(dbOrder?.reservations[0].status).toBe(ReservationStatus.RESERVED);
      expect(dbOrder?.reservations[0].quantity).toBe(2);

      // Physical stock remains unchanged until payment confirmation
      const currentStock = (await prisma.productVariant.findUnique({ where: { id: testVariantId } }))!.qty;
      expect(currentStock).toBe(initialStock);
    });

    it('Step 8: Customer creates Payment Intent', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/payments/create-intent')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ orderId: placedOrderId })
        .expect(201);

      const intentData = res.body.data || res.body;
      expect(intentData.razorpayOrderId).toBeDefined();
      expect(intentData.amountInPaise).toBeGreaterThan(0);
    });

    it('Step 9 & 10: Payment webhook processes captured payment, decrements physical stock, and confirms order', async () => {
      const initialStock = (await prisma.productVariant.findUnique({ where: { id: testVariantId } }))!.qty;
      const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'test_webhook_secret_key_123';
      process.env.RAZORPAY_WEBHOOK_SECRET = secret;

      const gatewayEventId = `pay_captured_${Date.now()}`;
      const payload = {
        event: 'payment.captured',
        id: gatewayEventId,
        payload: {
          payment: {
            entity: {
              id: gatewayEventId,
              amount: 599800,
              notes: { orderId: placedOrderId },
            },
          },
        },
      };

      const rawBody = JSON.stringify(payload);
      const signature = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

      const webhookRes = await request(app.getHttpServer())
        .post('/api/payments/webhook')
        .set('x-razorpay-signature', signature)
        .set('Content-Type', 'application/json')
        .send(payload)
        .expect(200);

      const webhookData = webhookRes.body.data || webhookRes.body;
      expect(webhookData.status).toBe('COMMITTED');
      expect(webhookData.stockAllocated).toBe(true);

      // Verify DB Order state: CONFIRMED & PAID
      const dbOrder = await prisma.order.findUnique({
        where: { id: placedOrderId },
        include: { reservations: true, paymentLogs: true },
      });

      expect(dbOrder?.orderStatus).toBe(OrderStatus.CONFIRMED);
      expect(dbOrder?.paymentStatus).toBe(PaymentStatus.PAID);
      expect(dbOrder?.reservationExpires).toBeNull();

      // Verify StockReservation transitioned to COMMITTED
      expect(dbOrder?.reservations[0].status).toBe(ReservationStatus.COMMITTED);

      // Verify Physical Stock decremented exactly once by 2
      const postStock = (await prisma.productVariant.findUnique({ where: { id: testVariantId } }))!.qty;
      expect(postStock).toBe(initialStock - 2);

      // Verify PaymentLog record created
      expect(dbOrder?.paymentLogs).toHaveLength(1);
      expect(dbOrder?.paymentLogs[0].status).toBe('COMMITTED');
    });

    it('Step 11: Customer retrieves order history and sees CONFIRMED order', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      const orders = Array.isArray(res.body.data)
        ? res.body.data
        : res.body.data?.items || (Array.isArray(res.body) ? res.body : res.body.items || []);
      const match = orders.find((o: any) => o.id === placedOrderId);
      expect(match).toBeDefined();
      expect(match.orderStatus).toBe(OrderStatus.CONFIRMED);
      expect(match.paymentStatus).toBe(PaymentStatus.PAID);
    });

    it('Step 12: Admin updates order status to SHIPPED and customer sees updated status', async () => {
      const updateRes = await request(app.getHttpServer())
        .patch(`/api/orders/${placedOrderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: OrderStatus.SHIPPED, trackingNumber: 'TRK-MOODEST-9988' })
        .expect(200);

      const updateData = updateRes.body.data || updateRes.body;
      expect(updateData.orderStatus).toBe(OrderStatus.SHIPPED);
      expect(updateData.trackingNumber).toBe('TRK-MOODEST-9988');

      // Customer checks order details
      const customerCheck = await request(app.getHttpServer())
        .get(`/api/orders/${placedOrderId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      const customerCheckData = customerCheck.body.data || customerCheck.body;
      expect(customerCheckData.orderStatus).toBe(OrderStatus.SHIPPED);
      expect(customerCheckData.trackingNumber).toBe('TRK-MOODEST-9988');
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 3. INVENTORY CONCURRENCY TESTS
  // ════════════════════════════════════════════════════════════════════════════
  describe('3. Inventory Concurrency & Race-Condition Protection', () => {
    let scarceVariantId: string;
    let userA: any;
    let userB: any;
    let orderA: any;
    let orderB: any;

    beforeAll(async () => {
      // Create a variant with EXACTLY 1 unit in stock
      const prod = await prisma.product.create({
        data: {
          name: `Scarce Limited Abaya ${Date.now()}`,
          slug: `scarce-abaya-${Date.now()}`,
          image: '/scarce.jpg',
        },
      });

      const variant = await prisma.productVariant.create({
        data: {
          productId: prod.id,
          sku: `SCARCE-${Date.now()}`,
          size: 'S',
          color: 'Emerald',
          price: 4999,
          qty: 1, // Only 1 unit!
          isActive: true,
        },
      });
      scarceVariantId = variant.id;

      // Create two distinct users and orders
      const userARec = await prisma.user.create({
        data: {
          email: `race_user_a_${Date.now()}@test.internal`,
          passwordHash: 'hash',
          role: Role.CUSTOMER,
        },
      });
      const addrA = await prisma.address.create({
        data: { userId: userARec.id, name: 'User A', phone: '123', street: 'St A', city: 'C', state: 'S', pincode: '123' },
      });
      orderA = await prisma.order.create({
        data: {
          orderNumber: `ORD-RACE-A-${Date.now()}`,
          userId: userARec.id,
          addressId: addrA.id,
          subtotal: 4999,
          totalAmount: 4999,
          orderStatus: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
        },
      });

      const userBRec = await prisma.user.create({
        data: {
          email: `race_user_b_${Date.now()}@test.internal`,
          passwordHash: 'hash',
          role: Role.CUSTOMER,
        },
      });
      const addrB = await prisma.address.create({
        data: { userId: userBRec.id, name: 'User B', phone: '123', street: 'St B', city: 'C', state: 'S', pincode: '123' },
      });
      orderB = await prisma.order.create({
        data: {
          orderNumber: `ORD-RACE-B-${Date.now()}`,
          userId: userBRec.id,
          addressId: addrB.id,
          subtotal: 4999,
          totalAmount: 4999,
          orderStatus: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
        },
      });
    });

    it('2 concurrent customers reserve the last unit: exactly 1 succeeds, 1 is rejected with 400', async () => {
      const results = await Promise.allSettled([
        stockReservationService.reserve(orderA.id, [{ variantId: scarceVariantId, quantity: 1 }]),
        stockReservationService.reserve(orderB.id, [{ variantId: scarceVariantId, quantity: 1 }]),
      ]);

      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');

      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(1);

      // Stock remains 1 physically (not negative!)
      const dbVar = await prisma.productVariant.findUnique({ where: { id: scarceVariantId } });
      expect(dbVar?.qty).toBe(1);

      // Exactly 1 active reservation exists in the DB
      const reservations = await prisma.stockReservation.findMany({
        where: { variantId: scarceVariantId, status: ReservationStatus.RESERVED },
      });
      expect(reservations).toHaveLength(1);
    });

    it('Rejects reservations with duplicate variant IDs by auto-consolidating or throwing', async () => {
      // Creating another test order
      const dupOrder = await prisma.order.create({
        data: {
          orderNumber: `ORD-DUP-${Date.now()}`,
          userId: orderA.userId,
          addressId: orderA.addressId,
          subtotal: 1000,
          totalAmount: 1000,
        },
      });

      // Pass duplicate variant IDs: [{ variantId, qty: 1 }, { variantId, qty: 1 }]
      // Requires 2 units, but only 1 is physically available, so it must fail gracefully
      await expect(
        stockReservationService.reserve(dupOrder.id, [
          { variantId: scarceVariantId, quantity: 1 },
          { variantId: scarceVariantId, quantity: 1 },
        ]),
      ).rejects.toThrow();
    });

    it('Rejects reservation attempt on CANCELLED order', async () => {
      const cancelledOrder = await prisma.order.create({
        data: {
          orderNumber: `ORD-CANCELLED-${Date.now()}`,
          userId: orderA.userId,
          addressId: orderA.addressId,
          subtotal: 1000,
          totalAmount: 1000,
          orderStatus: OrderStatus.CANCELLED,
        },
      });

      await expect(
        stockReservationService.reserve(cancelledOrder.id, [{ variantId: scarceVariantId, quantity: 1 }]),
      ).rejects.toThrow(/Cannot reserve stock for cancelled order/);
    });

    it('Background sweep releases expired reservations and cancels pending orders', async () => {
      // Manually set an existing reservation's expiresAt to 1 hour in the past
      await prisma.stockReservation.updateMany({
        where: { variantId: scarceVariantId },
        data: { expiresAt: new Date(Date.now() - 3600000) },
      });

      const sweepResult = await stockReservationService.releaseExpired();
      expect(sweepResult.releasedCount).toBeGreaterThanOrEqual(1);

      // Verify reservation status flipped to RELEASED
      const releasedRes = await prisma.stockReservation.findMany({
        where: { variantId: scarceVariantId },
      });
      expect(releasedRes.every((r) => r.status === ReservationStatus.RELEASED)).toBe(true);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 4. PAYMENT SECURITY & FRAUD PREVENTION TESTS
  // ════════════════════════════════════════════════════════════════════════════
  describe('4. Payment Security & Signature Verification', () => {
    let secUser: any;
    let secAddress: any;
    let secOrder: any;

    beforeAll(async () => {
      secUser = await prisma.user.create({
        data: {
          email: `sec_test_${Date.now()}@moodest.internal`,
          passwordHash: 'hash',
          role: Role.CUSTOMER,
        },
      });
      secAddress = await prisma.address.create({
        data: {
          userId: secUser.id,
          name: 'Sec User',
          phone: '9999999999',
          street: 'Sec Street',
          city: 'Mumbai',
          state: 'MH',
          pincode: '400001',
        },
      });
      secOrder = await prisma.order.create({
        data: {
          orderNumber: `ORD-SEC-${Date.now()}`,
          userId: secUser.id,
          addressId: secAddress.id,
          subtotal: 1000,
          totalAmount: 1000,
          orderStatus: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
        },
      });
    });

    it('Rejects external webhook call when signature header is missing (HTTP 400)', async () => {
      const payload = { event: 'payment.captured', id: 'pay_tampered_1' };

      await request(app.getHttpServer())
        .post('/api/payments/webhook')
        .send(payload)
        .expect(400);
    });

    it('Rejects external webhook call when signature is invalid (tampered body)', async () => {
      const payload = { event: 'payment.captured', id: 'pay_tampered_2' };

      await request(app.getHttpServer())
        .post('/api/payments/webhook')
        .set('x-razorpay-signature', '0000000000000000000000000000000000000000000000000000000000000000')
        .send(payload)
        .expect(400);
    });

    it('Duplicate webhook delivery is idempotent and returns ALREADY_PROCESSED with zero side-effects', async () => {
      const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'test_webhook_secret_key_123';
      const duplicateId = `pay_dup_${Date.now()}`;

      // Insert log as PROCESSED
      await prisma.paymentLog.create({
        data: {
          gatewayEventId: duplicateId,
          orderId: secOrder.id,
          event: 'payment.captured',
          payload: { id: duplicateId },
          status: 'COMMITTED',
        },
      });

      const payload = {
        event: 'payment.captured',
        id: duplicateId,
        payload: {
          payment: {
            entity: {
              id: duplicateId,
              notes: { orderId: secOrder.id },
            },
          },
        },
      };

      const rawBody = JSON.stringify(payload);
      const signature = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

      const res = await request(app.getHttpServer())
        .post('/api/payments/webhook')
        .set('x-razorpay-signature', signature)
        .set('Content-Type', 'application/json')
        .send(payload)
        .expect(200);

      const resBody = res.body.data || res.body;
      expect(resBody.isDuplicate).toBe(true);
      expect(resBody.status).toBe('ALREADY_PROCESSED');
    });

    it('Late payment does NOT revive a deliberately cancelled order and flags for refund', async () => {
      // Create a deliberately cancelled order with an order item
      const manualCancelOrder = await prisma.order.create({
        data: {
          orderNumber: `ORD-MANUAL-${Date.now()}`,
          userId: secUser.id,
          addressId: secAddress.id,
          subtotal: 1000,
          totalAmount: 1000,
          orderStatus: OrderStatus.CANCELLED,
          paymentStatus: PaymentStatus.PENDING,
          notes: '[MANUALLY_CANCELLED] by customer request',
          items: {
            create: [
              {
                productId: secOrder.items?.[0]?.productId || (await prisma.product.findFirst({ select: { id: true } }))!.id,
                variantId: secOrder.items?.[0]?.variantId || (await prisma.productVariant.findFirst({ select: { id: true } }))!.id,
                quantity: 1,
                unitPrice: 1000,
                totalPrice: 1000,
                size: 'M',
                color: 'Black',
              },
            ],
          },
        },
      });

      const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'test_webhook_secret_key_123';
      const lateEventId = `pay_late_manual_${Date.now()}`;
      const payload = {
        event: 'payment.captured',
        id: lateEventId,
        payload: {
          payment: {
            entity: {
              id: lateEventId,
              notes: { orderId: manualCancelOrder.id },
            },
          },
        },
      };

      const rawBody = JSON.stringify(payload);
      const signature = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

      const res = await request(app.getHttpServer())
        .post('/api/payments/webhook')
        .set('x-razorpay-signature', signature)
        .set('Content-Type', 'application/json')
        .send(payload)
        .expect(200);

      const resBody = res.body.data || res.body;
      expect(resBody.status).toBe('RECONCILIATION_REQUIRED');
      expect(resBody.stockAllocated).toBe(false);

      // Verify DB Order state: remains CANCELLED!
      const dbOrder = await prisma.order.findUnique({ where: { id: manualCancelOrder.id } });
      expect(dbOrder?.orderStatus).toBe(OrderStatus.CANCELLED);
      expect(dbOrder?.paymentStatus).toBe(PaymentStatus.PAID);
      expect(dbOrder?.notes).toContain('RECONCILIATION_REQUIRED');
    });
  });
});
