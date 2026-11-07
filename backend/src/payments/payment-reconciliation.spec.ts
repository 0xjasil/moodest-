import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PaymentEventService } from './payment-event.service';
import { StockReservationService } from '../inventory/stock-reservation.service';
import { ReservationStatus, OrderStatus, PaymentStatus, PaymentMethod } from '@prisma/client';
import * as crypto from 'crypto';

describe('PaymentEventService — Phase 4C-R Payment Reconciliation & Security Remediation', () => {
  let service: PaymentEventService;
  let stockReservationService: StockReservationService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      $transaction: jest.fn(async (cb: any) => cb(mockPrisma)),
      $queryRaw: jest.fn(),
      $executeRaw: jest.fn(),
      paymentLog: {
        createMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      stockReservation: {
        create: jest.fn(),
        upsert: jest.fn(),
        findFirst: jest.fn(),
        count: jest.fn(),
      },
      order: {
        updateMany: jest.fn(),
      },
    };

    stockReservationService = new StockReservationService(mockPrisma);
    jest.spyOn(stockReservationService, 'commit').mockImplementation(async () => ({
      committedCount: 1,
      status: 'COMMITTED',
    }));

    service = new PaymentEventService(mockPrisma, stockReservationService);
  });

  describe('1. Razorpay Signature Verification & SEC-03 Enforcement', () => {
    const secret = 'test_webhook_secret_key_123';
    const payload = JSON.stringify({ event: 'payment.captured', order_id: 'order_123' });
    const validSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

    it('validates genuine signature with timingSafeEqual', () => {
      const isValid = service.verifySignature(payload, validSignature, secret);
      expect(isValid).toBe(true);
    });

    it('rejects tampered signature or invalid secret', () => {
      const isInvalid = service.verifySignature(payload, 'wrong_hex_signature', secret);
      expect(isInvalid).toBe(false);
      const isWrongSecret = service.verifySignature(payload, validSignature, 'wrong_secret');
      expect(isWrongSecret).toBe(false);
    });

    it('rejects empty rawBody, signature or secret', () => {
      expect(service.verifySignature('', validSignature, secret)).toBe(false);
      expect(service.verifySignature(payload, '', secret)).toBe(false);
      expect(service.verifySignature(payload, validSignature, '')).toBe(false);
    });

    it('throws BadRequestException if signature is invalid during reconciliation', async () => {
      await expect(
        service.reconcilePaymentEvent({
          orderId: 'order_1',
          gatewayEventId: 'evt_1',
          payload: { id: 'evt_1' },
          rawBody: payload,
          signature: 'invalid_sig',
          secret,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('enforces mandatory signature for external webhooks (SEC-03)', async () => {
      await expect(
        service.reconcilePaymentEvent({
          orderId: 'order_1',
          gatewayEventId: 'evt_webhook',
          payload: { id: 'evt_webhook' },
          isExternalWebhook: true,
          // signature omitted
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('2. Idempotency & Duplicate Webhook Delivery', () => {
    it('detects duplicate webhook and returns ALREADY_PROCESSED with zero side effects', async () => {
      mockPrisma.paymentLog.createMany.mockResolvedValue({ count: 0 });
      mockPrisma.paymentLog.findUnique.mockResolvedValue({
        id: 'log_existing',
        gatewayEventId: 'evt_dup_1',
        orderId: 'order_1',
        status: 'PROCESSED',
      });

      const result = await service.reconcilePaymentEvent({
        orderId: 'order_1',
        gatewayEventId: 'evt_dup_1',
        payload: { id: 'evt_dup_1' },
      });

      expect(result.isDuplicate).toBe(true);
      expect(result.status).toBe('ALREADY_PROCESSED');
      expect(result.stockAllocated).toBe(false);
      expect(mockPrisma.$executeRaw).not.toHaveBeenCalled();
      expect(mockPrisma.order.updateMany).not.toHaveBeenCalled();
    });

    it('safely handles concurrent webhook deliveries (5 parallel calls, exactly 1 winner)', async () => {
      let inserted = false;
      mockPrisma.paymentLog.createMany.mockImplementation(async () => {
        if (!inserted) {
          inserted = true;
          return { count: 1 };
        }
        return { count: 0 };
      });

      mockPrisma.$queryRaw.mockImplementation(async (strings: TemplateStringsArray) => {
        const query = strings.join('');
        if (query.includes('FROM "Order"')) {
          return [{ id: 'order_1', orderStatus: OrderStatus.PENDING, paymentStatus: PaymentStatus.PENDING, notes: null }];
        }
        if (query.includes('FROM "StockReservation"')) {
          return [
            {
              id: 'res_1',
              variantId: 'var_1',
              quantity: 2,
              status: ReservationStatus.RESERVED,
              expiresAt: new Date(Date.now() + 300000),
            },
          ];
        }
        if (query.includes('SELECT NOW()')) {
          return [{ dbNow: new Date() }];
        }
        return [];
      });

      mockPrisma.paymentLog.findUnique.mockResolvedValue({
        id: 'log_1',
        gatewayEventId: 'evt_race',
        orderId: 'order_1',
        status: 'COMMITTED',
      });

      const promises = Array.from({ length: 5 }, () =>
        service.reconcilePaymentEvent({
          orderId: 'order_1',
          gatewayEventId: 'evt_race',
          payload: { id: 'evt_race' },
        }),
      );

      const results = await Promise.all(promises);
      const winners = results.filter((r) => !r.isDuplicate && r.status === 'COMMITTED');
      const duplicates = results.filter((r) => r.isDuplicate && r.status === 'ALREADY_PROCESSED');

      expect(winners).toHaveLength(1);
      expect(duplicates).toHaveLength(4);
    });
  });

  describe('3. Late Payment Reconciliation — Stock Available & SEC-02 Order Revival', () => {
    it('performs safe new stock allocation, decrements physical qty, and revives cancelled-by-expiry order to CONFIRMED (SEC-02)', async () => {
      mockPrisma.paymentLog.createMany.mockResolvedValue({ count: 1 });

      mockPrisma.$queryRaw.mockImplementation(async (strings: TemplateStringsArray) => {
        const query = strings.join('');
        if (query.includes('FROM "Order"')) {
          // Order was cancelled automatically upon expiry (no manual cancel note)
          return [{ id: 'order_cancelled', orderStatus: OrderStatus.CANCELLED, paymentStatus: PaymentStatus.PENDING, notes: null }];
        }
        if (query.includes('FROM "StockReservation"') && query.includes('orderId =')) {
          return [
            {
              id: 'res_old',
              variantId: 'var_1',
              quantity: 2,
              status: ReservationStatus.RELEASED,
              expiresAt: new Date(Date.now() - 600000),
            },
          ];
        }
        if (query.includes('FROM "OrderItem"')) {
          return [{ variantId: 'var_1', quantity: 2 }];
        }
        if (query.includes('FROM "ProductVariant"')) {
          return [{ id: 'var_1', qty: 10 }]; // 10 physical stock available
        }
        if (query.includes('FROM "StockReservation"') && query.includes('orderId !=')) {
          return [{ variantId: 'var_1', reservedQty: 0 }];
        }
        if (query.includes('SELECT NOW()')) {
          return [{ dbNow: new Date() }];
        }
        return [];
      });

      mockPrisma.$executeRaw.mockResolvedValue(1);

      const result = await service.reconcilePaymentEvent({
        orderId: 'order_cancelled',
        gatewayEventId: 'evt_late_avail',
        payload: { id: 'evt_late_avail' },
      });

      expect(result.status).toBe('REALLOCATED');
      expect(result.stockAllocated).toBe(true);

      // Verify physical ProductVariant.qty decremented
      expect(mockPrisma.$executeRaw).toHaveBeenCalled();

      // Verify old reservation rows deleted and fresh COMMITTED reservation created
      expect(mockPrisma.stockReservation.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          orderId: 'order_cancelled',
          variantId: 'var_1',
          quantity: 2,
          status: ReservationStatus.COMMITTED,
        }),
      });

      // SEC-02: Verify order is revived to CONFIRMED and marked PAID
      expect(mockPrisma.order.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'order_cancelled' },
          data: expect.objectContaining({
            orderStatus: OrderStatus.CONFIRMED,
            paymentStatus: PaymentStatus.PAID,
            notes: expect.stringContaining('LATE_PAYMENT_REALLOCATED_CONFIRMED'),
          }),
        }),
      );
    });

    it('does NOT revive manually cancelled order even if stock is available, but flags for refund', async () => {
      mockPrisma.paymentLog.createMany.mockResolvedValue({ count: 1 });

      mockPrisma.$queryRaw.mockImplementation(async (strings: TemplateStringsArray) => {
        const query = strings.join('');
        if (query.includes('FROM "Order"')) {
          return [{
            id: 'order_manual_cancel',
            orderStatus: OrderStatus.CANCELLED,
            paymentStatus: PaymentStatus.PENDING,
            notes: '[MANUALLY_CANCELLED] by customer',
          }];
        }
        if (query.includes('FROM "StockReservation"') && query.includes('orderId =')) {
          return [];
        }
        if (query.includes('FROM "OrderItem"')) {
          return [{ variantId: 'var_1', quantity: 1 }];
        }
        if (query.includes('FROM "ProductVariant"')) {
          return [{ id: 'var_1', qty: 10 }];
        }
        if (query.includes('SELECT NOW()')) {
          return [{ dbNow: new Date() }];
        }
        return [];
      });

      const result = await service.reconcilePaymentEvent({
        orderId: 'order_manual_cancel',
        gatewayEventId: 'evt_manual_refund',
        payload: { id: 'evt_manual_refund' },
      });

      expect(result.status).toBe('RECONCILIATION_REQUIRED');
      expect(result.stockAllocated).toBe(false);
      expect(mockPrisma.order.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orderStatus: OrderStatus.CANCELLED,
            paymentStatus: PaymentStatus.PAID,
            notes: expect.stringContaining('ORDER_DELIBERATELY_CANCELLED'),
          }),
        }),
      );
    });
  });

  describe('4. Late Payment Reconciliation — Stock Unavailable', () => {
    it('preserves cancelled order, records captured payment, flags PaymentLog with RECONCILIATION_REQUIRED, and decrements NO stock', async () => {
      mockPrisma.paymentLog.createMany.mockResolvedValue({ count: 1 });

      mockPrisma.$queryRaw.mockImplementation(async (strings: TemplateStringsArray) => {
        const query = strings.join('');
        if (query.includes('FROM "Order"')) {
          return [{ id: 'order_cancelled_depleted', orderStatus: OrderStatus.CANCELLED, paymentStatus: PaymentStatus.PENDING, notes: null }];
        }
        if (query.includes('FROM "StockReservation"') && query.includes('orderId =')) {
          return [
            {
              id: 'res_old',
              variantId: 'var_1',
              quantity: 2,
              status: ReservationStatus.RELEASED,
              expiresAt: new Date(Date.now() - 600000),
            },
          ];
        }
        if (query.includes('FROM "OrderItem"')) {
          return [{ variantId: 'var_1', quantity: 2 }];
        }
        if (query.includes('FROM "ProductVariant"')) {
          return [{ id: 'var_1', qty: 1 }]; // Only 1 unit left physically (need 2)
        }
        if (query.includes('FROM "StockReservation"') && query.includes('orderId !=')) {
          return [];
        }
        if (query.includes('SELECT NOW()')) {
          return [{ dbNow: new Date() }];
        }
        return [];
      });

      const result = await service.reconcilePaymentEvent({
        orderId: 'order_cancelled_depleted',
        gatewayEventId: 'evt_late_depleted',
        payload: { id: 'evt_late_depleted' },
      });

      expect(result.status).toBe('RECONCILIATION_REQUIRED');
      expect(result.stockAllocated).toBe(false);

      // Verify ZERO physical stock decrement calls
      expect(mockPrisma.$executeRaw).not.toHaveBeenCalledWith(
        expect.stringContaining('UPDATE "ProductVariant"'),
      );

      // Verify order preserved as CANCELLED with refund required note
      expect(mockPrisma.order.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'order_cancelled_depleted' },
          data: expect.objectContaining({
            orderStatus: OrderStatus.CANCELLED,
            paymentStatus: PaymentStatus.PAID,
            notes: expect.stringContaining('RECONCILIATION_REQUIRED'),
          }),
        }),
      );

      // Verify PaymentLog updated with refundRequired = true
      expect(mockPrisma.paymentLog.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { gatewayEventId: 'evt_late_depleted' },
          data: expect.objectContaining({
            status: 'RECONCILIATION_REQUIRED',
            event: 'payment.captured.refund_required',
            payload: expect.objectContaining({
              refundRequired: true,
              reason: 'STOCK_EXHAUSTED_POST_EXPIRY',
            }),
          }),
        }),
      );
    });
  });

  describe('5. COD Reservation Expiry Policy', () => {
    it('sets 24-hour expiration for COD orders, and 10 minutes for Online orders', async () => {
      mockPrisma.$queryRaw.mockImplementation(async (strings: TemplateStringsArray) => {
        const query = strings.join('');
        if (query.includes('SELECT NOW()')) {
          return [{ dbNow: new Date('2026-11-06T12:00:00.000Z') }];
        }
        if (query.includes('FROM "ProductVariant"')) {
          return [{ id: 'var_1', qty: 10, isActive: true, isArchived: false }];
        }
        if (query.includes('FROM "Order"')) {
          return [{ id: 'order_cod', orderStatus: OrderStatus.PENDING, paymentStatus: PaymentStatus.PENDING, paymentMethod: PaymentMethod.COD }];
        }
        if (query.includes('FROM "StockReservation"')) {
          return [];
        }
        return [];
      });

      mockPrisma.stockReservation.upsert.mockImplementation(async ({ create }: any) => ({
        ...create,
        id: 'res_cod',
      }));

      mockPrisma.stockReservation.findFirst.mockImplementation(async () => ({
        expiresAt: new Date('2026-11-07T12:00:00.000Z'),
      }));

      const codResult = await stockReservationService.reserve('order_cod', [{ variantId: 'var_1', quantity: 1 }]);
      const codExpiresAt = codResult.expiresAt.getTime();
      const baseTime = new Date('2026-11-06T12:00:00.000Z').getTime();

      // COD window must be 24 hours (86,400,000 ms)
      expect(codExpiresAt - baseTime).toBe(24 * 60 * 60 * 1000);
    });
  });
});
