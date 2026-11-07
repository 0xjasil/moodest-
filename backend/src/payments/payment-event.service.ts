import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../database/prisma.service';
import { StockReservationService } from '../inventory/stock-reservation.service';
import { Prisma, PaymentLog, ReservationStatus, OrderStatus, PaymentStatus } from '@prisma/client';

export interface PaymentEventRecordResult {
  isDuplicate: boolean;
  status: 'PROCESSED' | 'ALREADY_PROCESSED';
  paymentLog?: PaymentLog;
  message: string;
}

export interface PaymentReconciliationResult {
  orderId: string;
  gatewayEventId: string;
  isDuplicate: boolean;
  status: 'COMMITTED' | 'REALLOCATED' | 'RECONCILIATION_REQUIRED' | 'ALREADY_PROCESSED' | 'ALREADY_PAID';
  stockAllocated: boolean;
  paymentLog?: PaymentLog;
  message: string;
}

@Injectable()
export class PaymentEventService {
  private readonly logger = new Logger(PaymentEventService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stockReservationService: StockReservationService,
  ) {}

  /**
   * Verifies Razorpay webhook or payment HMAC SHA-256 signature using timing-safe comparison.
   */
  verifySignature(rawBody: string | Buffer, signature: string, secret: string): boolean {
    if (!rawBody || !signature || !secret) {
      return false;
    }
    try {
      const bodyString = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(bodyString)
        .digest('hex');

      const sigBuf = Buffer.from(signature, 'utf8');
      const expBuf = Buffer.from(expectedSignature, 'utf8');

      if (sigBuf.length !== expBuf.length) {
        return false;
      }
      return crypto.timingSafeEqual(sigBuf, expBuf);
    } catch {
      return false;
    }
  }

  /**
   * Idempotently records incoming payment gateway events (e.g. Razorpay webhook events).
   */
  async recordEvent(
    orderId: string,
    gatewayEventId: string,
    payload: Record<string, any>,
    event: string = 'payment.captured',
    tx?: Prisma.TransactionClient,
  ): Promise<PaymentEventRecordResult> {
    const client = tx || this.prisma;

    // Atomic insert with ON CONFLICT ("gatewayEventId") DO NOTHING
    const insertResult = await client.paymentLog.createMany({
      data: [
        {
          orderId,
          gatewayEventId,
          event,
          payload,
          status: 'PROCESSED',
        },
      ],
      skipDuplicates: true,
    });

    if (insertResult.count === 1) {
      this.logger.log(`Payment event recorded: ${gatewayEventId} for order ${orderId} [${event}]`);

      const paymentLog = await client.paymentLog.findUnique({
        where: { gatewayEventId },
      });

      return {
        isDuplicate: false,
        status: 'PROCESSED',
        paymentLog: paymentLog || undefined,
        message: 'Payment event successfully recorded and processed',
      };
    } else {
      this.logger.warn(
        `Duplicate gateway event detected: ${gatewayEventId} for order ${orderId}. Skipping side effects.`,
      );

      const existingLog = await client.paymentLog.findUnique({
        where: { gatewayEventId },
      });

      return {
        isDuplicate: true,
        status: 'ALREADY_PROCESSED',
        paymentLog: existingLog || undefined,
        message: `Gateway event ${gatewayEventId} was already processed. Duplicate ignored safely.`,
      };
    }
  }

  /**
   * Phase 4C-R: Full transactional payment reconciliation handler for Razorpay webhooks and payment confirmations.
   *
   * Invariants enforced:
   * 1. Mandatory signature verification for external webhooks (SEC-03).
   * 2. Atomic deduplication via PaymentLog.gatewayEventId (Level 4).
   * 3. Global anti-deadlock lock ordering: Level 1 (ProductVariant) -> Level 2 (StockReservation) -> Level 3 (Order) (SEC-01).
   * 4. Safe late-payment state transitions:
   *    - Unexpired reservation: commits stock and confirms order (Scenario A).
   *    - Expired/released reservation + stock available + order was cancelled by expiry:
   *      reallocates stock, revives order to CONFIRMED, sets paymentStatus to PAID (SEC-02).
   *    - Deliberately cancelled order or stock unavailable:
   *      preserves CANCELLED, records payment as PAID, flags for customer refund (RECONCILIATION_REQUIRED).
   * 5. Safe OrderItem consolidation and fallback (SEC-04).
   * 6. Zero duplicate stock deductions.
   */
  async reconcilePaymentEvent(params: {
    orderId: string;
    gatewayEventId: string;
    payload: Record<string, any>;
    event?: string;
    signature?: string;
    rawBody?: string | Buffer;
    secret?: string;
    isExternalWebhook?: boolean;
    tx?: Prisma.TransactionClient;
  }): Promise<PaymentReconciliationResult> {
    const {
      orderId,
      gatewayEventId,
      payload,
      event = 'payment.captured',
      signature,
      rawBody,
      secret,
      isExternalWebhook = false,
      tx,
    } = params;

    // 1. Signature Verification (SEC-03)
    if (isExternalWebhook) {
      if (!signature || !rawBody || !secret) {
        throw new BadRequestException('Webhook signature, rawBody, and webhook secret are mandatory for external events');
      }
      const isValid = this.verifySignature(rawBody, signature, secret);
      if (!isValid) {
        throw new BadRequestException('Invalid Razorpay webhook signature');
      }
    } else if (signature && rawBody && secret) {
      const isValid = this.verifySignature(rawBody, signature, secret);
      if (!isValid) {
        throw new BadRequestException('Invalid Razorpay payment signature');
      }
    }

    const execute = async (client: Prisma.TransactionClient): Promise<PaymentReconciliationResult> => {
      // 2. Idempotency Gate: Atomic insert into PaymentLog (Level 4)
      const insertResult = await client.paymentLog.createMany({
        data: [
          {
            orderId,
            gatewayEventId,
            event,
            payload,
            status: 'PROCESSING',
          },
        ],
        skipDuplicates: true,
      });

      if (insertResult.count === 0) {
        this.logger.warn(`Duplicate gateway event: ${gatewayEventId} for order ${orderId}. Skipping.`);
        const existing = await client.paymentLog.findUnique({ where: { gatewayEventId } });
        return {
          orderId,
          gatewayEventId,
          isDuplicate: true,
          status: 'ALREADY_PROCESSED',
          stockAllocated: false,
          paymentLog: existing || undefined,
          message: `Gateway event ${gatewayEventId} already processed. Duplicate ignored.`,
        };
      }

      // 3. Unlocked candidate variant discovery (SEC-01 & SEC-04)
      const candidateVariants = await client.$queryRaw<Array<{ variantId: string }>>`
        SELECT DISTINCT "variantId" FROM (
          SELECT "variantId" FROM "OrderItem" WHERE "orderId" = ${orderId}
          UNION
          SELECT "variantId" FROM "StockReservation" WHERE "orderId" = ${orderId}
        ) sub
        ORDER BY "variantId" ASC;
      `;

      const candidateVariantIds = candidateVariants.map((c) => c.variantId);

      // STEP 1: Lock ProductVariant rows in deterministic sorted order (Level 1 in Lock Hierarchy)
      let variantRows: Array<{ id: string; qty: number }> = [];
      if (candidateVariantIds.length > 0) {
        variantRows = await client.$queryRaw<Array<{ id: string; qty: number }>>`
          SELECT "id", "qty"
          FROM "ProductVariant"
          WHERE "id" IN (${Prisma.join(candidateVariantIds)})
          ORDER BY "id" ASC
          FOR UPDATE;
        `;
      }

      const variantMap = new Map<string, number>();
      for (const v of variantRows) {
        variantMap.set(v.id, v.qty);
      }

      // STEP 2: Lock this order's reservations in deterministic sorted order (Level 2 in Lock Hierarchy)
      const reservations = await client.$queryRaw<
        Array<{ id: string; variantId: string; quantity: number; status: string; expiresAt: Date }>
      >`
        SELECT "id", "variantId", "quantity", "status", "expiresAt"
        FROM "StockReservation"
        WHERE "orderId" = ${orderId}
        ORDER BY "id" ASC
        FOR UPDATE;
      `;

      // STEP 3: Lock Order under Level 3 Lock
      const orderRows = await client.$queryRaw<
        Array<{ id: string; orderStatus: string; paymentStatus: string; notes: string | null }>
      >`
        SELECT "id", "orderStatus", "paymentStatus", "notes"
        FROM "Order"
        WHERE "id" = ${orderId}
        FOR UPDATE;
      `;

      if (!orderRows || orderRows.length === 0) {
        throw new NotFoundException(`Order not found for payment reconciliation: ${orderId}`);
      }

      const order = orderRows[0];

      // If order is already PAID, record and exit cleanly
      if (order.paymentStatus === PaymentStatus.PAID) {
        await client.paymentLog.update({
          where: { gatewayEventId },
          data: { status: 'ALREADY_PAID' },
        });
        const updatedLog = await client.paymentLog.findUnique({ where: { gatewayEventId } });
        return {
          orderId,
          gatewayEventId,
          isDuplicate: false,
          status: 'ALREADY_PAID',
          stockAllocated: false,
          paymentLog: updatedLog || undefined,
          message: `Order ${orderId} is already marked as PAID.`,
        };
      }

      const [{ dbNow }] = await client.$queryRaw<Array<{ dbNow: Date }>>`SELECT NOW() AS "dbNow"`;

      const allActiveUnexpired =
        reservations.length > 0 &&
        reservations.every(
          (r) => r.status === ReservationStatus.RESERVED && r.expiresAt > dbNow,
        );

      // ─── SCENARIO A: NORMAL UNEXPIRED RESERVATION ────────────────────────────
      if (allActiveUnexpired) {
        await this.stockReservationService.commit(orderId, client);

        await client.order.updateMany({
          where: { id: orderId },
          data: {
            orderStatus: OrderStatus.CONFIRMED,
            paymentStatus: PaymentStatus.PAID,
            reservationExpires: null,
          },
        });

        await client.paymentLog.update({
          where: { gatewayEventId },
          data: { status: 'COMMITTED' },
        });

        const log = await client.paymentLog.findUnique({ where: { gatewayEventId } });

        return {
          orderId,
          gatewayEventId,
          isDuplicate: false,
          status: 'COMMITTED',
          stockAllocated: true,
          paymentLog: log || undefined,
          message: 'Stock reservation committed and order confirmed upon captured payment.',
        };
      }

      // ─── SCENARIO B: LATE PAYMENT RECONCILIATION ─────────────────────────────
      // Reservations are expired, released, or order is cancelled.
      this.logger.warn(
        `Late payment captured for order ${orderId} (reservations expired or released). Checking inventory for new allocation...`,
      );

      // SEC-04: Determine items required: from OrderItem if available, or from past reservations
      let candidateItems: Array<{ variantId: string; quantity: number }> = [];
      const orderItems = await client.$queryRaw<Array<{ variantId: string; quantity: number }>>`
        SELECT "variantId", "quantity"
        FROM "OrderItem"
        WHERE "orderId" = ${orderId}
        ORDER BY "variantId" ASC;
      `;

      if (orderItems && orderItems.length > 0) {
        candidateItems = orderItems;
      } else {
        candidateItems = reservations.map((r) => ({ variantId: r.variantId, quantity: r.quantity }));
      }

      if (candidateItems.length === 0) {
        throw new NotFoundException(`No items or reservations found to reconcile for order ${orderId}`);
      }

      // Consolidate candidate items by variantId
      const aggregatedMap = new Map<string, number>();
      for (const item of candidateItems) {
        aggregatedMap.set(item.variantId, (aggregatedMap.get(item.variantId) || 0) + item.quantity);
      }
      const requiredItems = Array.from(aggregatedMap.entries()).map(([variantId, quantity]) => ({
        variantId,
        quantity,
      }));

      // Check for deliberate cancellation (e.g., admin or manual customer cancellation)
      const isDeliberatelyCancelled =
        order.notes?.includes('[MANUALLY_CANCELLED]') ||
        order.notes?.includes('[ADMIN_CANCELLED]');

      // Compute active reservations on other orders (using dbNow)
      let otherActiveReservations: Array<{ variantId: string; reservedQty: number }> = [];
      if (candidateVariantIds.length > 0) {
        otherActiveReservations = await client.$queryRaw<Array<{ variantId: string; reservedQty: number }>>`
          SELECT "variantId", COALESCE(SUM("quantity"), 0)::int AS "reservedQty"
          FROM "StockReservation"
          WHERE "variantId" IN (${Prisma.join(candidateVariantIds)})
            AND "status" = 'RESERVED'
            AND "expiresAt" > ${dbNow}
            AND "orderId" != ${orderId}
          GROUP BY "variantId";
        `;
      }

      const otherActiveMap = new Map<string, number>();
      for (const r of otherActiveReservations) {
        otherActiveMap.set(r.variantId, Number(r.reservedQty));
      }

      // Check if physical stock is available for all required items
      let stockAvailable = !isDeliberatelyCancelled;
      if (stockAvailable) {
        for (const item of requiredItems) {
          const physical = variantMap.get(item.variantId) ?? 0;
          const reserved = otherActiveMap.get(item.variantId) ?? 0;
          const available = physical - reserved;

          if (available < item.quantity) {
            stockAvailable = false;
            break;
          }
        }
      }

      // ─── SUBCASE B1: STOCK IS AVAILABLE & NOT MANUALLY CANCELLED -> SAFE REALLOCATION ───
      if (stockAvailable) {
        // 1. Decrement ProductVariant.qty exactly once
        for (const item of requiredItems) {
          const updated = await client.$executeRaw`
            UPDATE "ProductVariant"
            SET "qty" = "qty" - ${item.quantity}
            WHERE "id" = ${item.variantId} AND "qty" >= ${item.quantity};
          `;
          if (updated === 0) {
            stockAvailable = false;
            break;
          }
        }
      }

      if (stockAvailable) {
        // 2. Remove any old expired/released reservation rows to satisfy @@unique([orderId, variantId])
        await client.$executeRaw`
          DELETE FROM "StockReservation" WHERE "orderId" = ${orderId};
        `;

        // 3. Create fresh new COMMITTED reservations (never mutate RELEASED directly)
        for (const item of requiredItems) {
          await client.stockReservation.create({
            data: {
              orderId,
              variantId: item.variantId,
              quantity: item.quantity,
              status: ReservationStatus.COMMITTED,
              expiresAt: dbNow,
            },
          });
        }

        // 4. Update order: SEC-02 Safe Order Lifecycle Transition
        // If order was cancelled solely by reservation expiration, revive to CONFIRMED.
        const auditNote = `[LATE_PAYMENT_REALLOCATED_CONFIRMED]: Payment captured post-expiry. Physical stock decremented under new commit. Order revived to CONFIRMED.`;

        await client.order.updateMany({
          where: { id: orderId },
          data: {
            orderStatus: OrderStatus.CONFIRMED,
            paymentStatus: PaymentStatus.PAID,
            reservationExpires: null,
            notes: order.notes ? `${order.notes}\n${auditNote}` : auditNote,
          },
        });

        await client.paymentLog.update({
          where: { gatewayEventId },
          data: { status: 'REALLOCATED' },
        });

        const log = await client.paymentLog.findUnique({ where: { gatewayEventId } });

        return {
          orderId,
          gatewayEventId,
          isDuplicate: false,
          status: 'REALLOCATED',
          stockAllocated: true,
          paymentLog: log || undefined,
          message: 'Late payment reallocated: physical stock decremented, fresh committed reservations created, and order revived to CONFIRMED.',
        };
      }

      // ─── SUBCASE B2: STOCK UNAVAILABLE OR DELIBERATELY CANCELLED -> PRESERVE CANCELLED & FLAG FOR REFUND ─
      const refundReason = isDeliberatelyCancelled ? 'ORDER_DELIBERATELY_CANCELLED' : 'STOCK_EXHAUSTED_POST_EXPIRY';
      const refundNote = `[RECONCILIATION_REQUIRED - ${refundReason}]: Gateway payment captured post-expiry (${gatewayEventId}), but ${
        isDeliberatelyCancelled ? 'order was deliberately cancelled' : 'variant stock is depleted'
      }. Customer refund required.`;

      await client.order.updateMany({
        where: { id: orderId },
        data: {
          orderStatus: OrderStatus.CANCELLED,
          paymentStatus: PaymentStatus.PAID,
          reservationExpires: null,
          notes: order.notes ? `${order.notes}\n${refundNote}` : refundNote,
        },
      });

      await client.paymentLog.update({
        where: { gatewayEventId },
        data: {
          status: 'RECONCILIATION_REQUIRED',
          event: 'payment.captured.refund_required',
          payload: {
            ...payload,
            refundRequired: true,
            reason: refundReason,
          },
        },
      });

      const log = await client.paymentLog.findUnique({ where: { gatewayEventId } });

      return {
        orderId,
        gatewayEventId,
        isDuplicate: false,
        status: 'RECONCILIATION_REQUIRED',
        stockAllocated: false,
        paymentLog: log || undefined,
        message: `Order preserved as CANCELLED, payment captured as PAID, and flagged for refund (${refundReason}).`,
      };
    };

    if (tx) {
      return execute(tx);
    }
    return this.prisma.$transaction(execute, { maxWait: 20000, timeout: 60000 });
  }
}
