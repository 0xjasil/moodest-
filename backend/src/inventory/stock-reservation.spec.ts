import { BadRequestException, NotFoundException } from '@nestjs/common';
import { StockReservationService } from './stock-reservation.service';
import { ReservationStatus, OrderStatus, PaymentStatus } from '@prisma/client';

describe('StockReservationService (Unit Tests - Inventory Integrity)', () => {
  let service: StockReservationService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      $transaction: jest.fn(async (cb: any) => cb(mockPrisma)),
      $queryRaw: jest.fn(),
      $executeRaw: jest.fn(),
      stockReservation: {
        upsert: jest.fn(),
        findFirst: jest.fn(),
        count: jest.fn(),
      },
      order: {
        updateMany: jest.fn(),
      },
    };

    service = new StockReservationService(mockPrisma);
  });

  describe('Positive Integer Quantity Validation', () => {
    it('rejects fractional quantities', async () => {
      await expect(
        service.reserve('order_1', [{ variantId: 'var_1', quantity: 1.5 }]),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.reserve('order_1', [{ variantId: 'var_1', quantity: 0.1 }]),
      ).rejects.toThrow(/positive integer/);
    });

    it('rejects zero and negative quantities', async () => {
      await expect(
        service.reserve('order_1', [{ variantId: 'var_1', quantity: 0 }]),
      ).rejects.toThrow(/positive integer/);

      await expect(
        service.reserve('order_1', [{ variantId: 'var_1', quantity: -2 }]),
      ).rejects.toThrow(/positive integer/);
    });
  });

  describe('Duplicate Variant ID Aggregation', () => {
    it('aggregates duplicate variantIds into a single consolidated quantity', async () => {
      // Mock db clock
      mockPrisma.$queryRaw.mockImplementation(async (strings: TemplateStringsArray, ...values: any[]) => {
        const query = strings.join('');
        if (query.includes('SELECT NOW()')) {
          return [{ dbNow: new Date('2026-11-06T12:00:00Z') }];
        }
        if (query.includes('FROM "ProductVariant"')) {
          return [{ id: 'var_1', qty: 10, isActive: true, isArchived: false }];
        }
        if (query.includes('FROM "Order"')) {
          return [{ id: 'order_1', orderStatus: OrderStatus.PENDING, paymentStatus: PaymentStatus.PENDING }];
        }
        if (query.includes('FROM "StockReservation"') && query.includes('orderId =')) {
          return [];
        }
        if (query.includes('FROM "StockReservation"') && query.includes('orderId !=')) {
          return [];
        }
        return [];
      });

      mockPrisma.stockReservation.upsert.mockResolvedValue({
        id: 'res_1',
        orderId: 'order_1',
        variantId: 'var_1',
        quantity: 5,
        status: ReservationStatus.RESERVED,
        expiresAt: new Date(),
      });

      mockPrisma.stockReservation.findFirst.mockResolvedValue({
        expiresAt: new Date(),
      });

      // Pass duplicate lines for var_1: 2 + 3 = 5
      const result = await service.reserve('order_1', [
        { variantId: 'var_1', quantity: 2 },
        { variantId: 'var_1', quantity: 3 },
      ]);

      expect(mockPrisma.stockReservation.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            orderId_variantId: {
              orderId: 'order_1',
              variantId: 'var_1',
            },
          },
          create: expect.objectContaining({
            quantity: 5,
          }),
          update: expect.objectContaining({
            quantity: 5,
          }),
        }),
      );
      expect(result.reservations).toHaveLength(1);
    });
  });

  describe('Active Catalog Constraints', () => {
    it('rejects reservation for inactive variant', async () => {
      mockPrisma.$queryRaw.mockImplementation(async (strings: TemplateStringsArray) => {
        const query = strings.join('');
        if (query.includes('SELECT NOW()')) {
          return [{ dbNow: new Date() }];
        }
        if (query.includes('FROM "ProductVariant"')) {
          return [{ id: 'var_inactive', qty: 10, isActive: false, isArchived: false }];
        }
        return [];
      });

      await expect(
        service.reserve('order_1', [{ variantId: 'var_inactive', quantity: 1 }]),
      ).rejects.toThrow(/Variant var_inactive is inactive and cannot be reserved/);
    });

    it('rejects reservation for archived product', async () => {
      mockPrisma.$queryRaw.mockImplementation(async (strings: TemplateStringsArray) => {
        const query = strings.join('');
        if (query.includes('SELECT NOW()')) {
          return [{ dbNow: new Date() }];
        }
        if (query.includes('FROM "ProductVariant"')) {
          return [{ id: 'var_archived', qty: 10, isActive: true, isArchived: true }];
        }
        return [];
      });

      await expect(
        service.reserve('order_1', [{ variantId: 'var_archived', quantity: 1 }]),
      ).rejects.toThrow(/Product for variant var_archived is archived and cannot be reserved/);
    });
  });

  describe('Cancelled and Paid Order Guard', () => {
    it('rejects reservation for an order that is already CANCELLED', async () => {
      mockPrisma.$queryRaw.mockImplementation(async (strings: TemplateStringsArray) => {
        const query = strings.join('');
        if (query.includes('SELECT NOW()')) {
          return [{ dbNow: new Date() }];
        }
        if (query.includes('FROM "ProductVariant"')) {
          return [{ id: 'var_1', qty: 10, isActive: true, isArchived: false }];
        }
        if (query.includes('FROM "Order"')) {
          return [{ id: 'order_cancelled', orderStatus: OrderStatus.CANCELLED, paymentStatus: PaymentStatus.PENDING }];
        }
        return [];
      });

      await expect(
        service.reserve('order_cancelled', [{ variantId: 'var_1', quantity: 1 }]),
      ).rejects.toThrow(/Cannot reserve stock for cancelled order order_cancelled/);
    });

    it('rejects reservation for an order that is already PAID', async () => {
      mockPrisma.$queryRaw.mockImplementation(async (strings: TemplateStringsArray) => {
        const query = strings.join('');
        if (query.includes('SELECT NOW()')) {
          return [{ dbNow: new Date() }];
        }
        if (query.includes('FROM "ProductVariant"')) {
          return [{ id: 'var_1', qty: 10, isActive: true, isArchived: false }];
        }
        if (query.includes('FROM "Order"')) {
          return [{ id: 'order_paid', orderStatus: OrderStatus.PROCESSING, paymentStatus: PaymentStatus.PAID }];
        }
        return [];
      });

      await expect(
        service.reserve('order_paid', [{ variantId: 'var_1', quantity: 1 }]),
      ).rejects.toThrow(/Cannot reserve stock for already paid order order_paid/);
    });
  });

  describe('Released Reservation Recommitment Guard', () => {
    it('rejects commit when any reservation has status RELEASED', async () => {
      mockPrisma.$queryRaw.mockImplementation(async (strings: TemplateStringsArray) => {
        const query = strings.join('');
        if (query.includes('SELECT DISTINCT "variantId"')) {
          return [{ variantId: 'var_1' }];
        }
        if (query.includes('FROM "ProductVariant"')) {
          return [{ id: 'var_1', qty: 10 }];
        }
        if (query.includes('FROM "StockReservation"')) {
          return [
            {
              id: 'res_released',
              orderId: 'order_1',
              variantId: 'var_1',
              quantity: 2,
              status: ReservationStatus.RELEASED,
              expiresAt: new Date(Date.now() - 60000),
            },
          ];
        }
        return [];
      });

      await expect(service.commit('order_1')).rejects.toThrow(
        /Cannot commit released reservation for order order_1/,
      );
    });
  });

  describe('COD Reservation Expiry Policy', () => {
    it('sets 24-hour expiration window for COD orders upon reservation', async () => {
      mockPrisma.$queryRaw.mockImplementation(async (strings: TemplateStringsArray) => {
        const query = strings.join('');
        if (query.includes('SELECT NOW()')) {
          return [{ dbNow: new Date('2026-11-06T12:00:00.000Z') }];
        }
        if (query.includes('FROM "ProductVariant"')) {
          return [{ id: 'var_1', qty: 10, isActive: true, isArchived: false }];
        }
        if (query.includes('FROM "Order"')) {
          return [
            {
              id: 'order_cod',
              orderStatus: OrderStatus.PENDING,
              paymentStatus: PaymentStatus.PENDING,
              paymentMethod: 'COD',
            },
          ];
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

      const codResult = await service.reserve('order_cod', [{ variantId: 'var_1', quantity: 1 }]);
      const codExpiresAt = codResult.expiresAt.getTime();
      const baseTime = new Date('2026-11-06T12:00:00.000Z').getTime();

      // COD window is 24 hours (86,400,000 ms)
      expect(codExpiresAt - baseTime).toBe(24 * 60 * 60 * 1000);
    });

    it('sweeps expired reservations whose expiresAt is past dbNow', async () => {
      let capturedQuery = '';
      mockPrisma.$queryRaw.mockImplementation(async (strings: TemplateStringsArray) => {
        capturedQuery = strings.join('');
        return [];
      });

      const res = await service.releaseExpired();
      expect(res.releasedCount).toBe(0);
      expect(capturedQuery).toContain(`"status" = 'RESERVED' AND "expiresAt" <= NOW()`);
    });
  });
});

