import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Prisma, ReservationStatus, StockReservation, OrderStatus, PaymentStatus } from '@prisma/client';

export interface ReserveItemDto {
  variantId: string;
  quantity: number;
}

export interface ReservationResult {
  orderId: string;
  reservations: StockReservation[];
  expiresAt: Date;
}

export interface CommitResult {
  committedCount: number;
  status: 'COMMITTED' | 'ALREADY_COMMITTED' | 'COMMITTED_LATE';
}

export interface ReleaseResult {
  releasedCount: number;
}

export interface ReleaseExpiredResult {
  releasedCount: number;
  cancelledOrdersCount: number;
}

export interface RestockResult {
  restockedCount: number;
}

/**
 * Distinct exception thrown when late payment arrives after reservation expiry,
 * and available physical inventory is insufficient to fulfill the order.
 * Phase 7 (Payment Webhook Handler) intercepts this to flag the order for refund.
 */
export class InsufficientStockForLatePaymentException extends BadRequestException {
  constructor(message: string) {
    super({
      statusCode: 400,
      error: 'INSUFFICIENT_STOCK_FOR_LATE_PAYMENT',
      message,
    });
  }
}

/**
 * StockReservationService — Aligned with Moodest Master Architecture Guide:
 *
 * ==============================================================================
 * TARGET INVENTORY MODEL:
 * ==============================================================================
 * 1. PHYSICAL STOCK:
 *    ProductVariant.qty represents actual physical inventory on hand.
 *
 * 2. AVAILABLE STOCK:
 *    Available = qty - SUM(quantity of RESERVED reservations with expiresAt > NOW())
 *
 * 3. RESERVATION LIFETIME:
 *    10 minutes from database clock (NOW() + INTERVAL '10 minutes').
 *
 * 4. RESERVATION (Cart / Checkout):
 *    reserve() NEVER decrements ProductVariant.qty.
 *    It creates/updates StockReservation rows with status = 'RESERVED'.
 *
 * 5. PAYMENT CONFIRMATION:
 *    commit() decrements ProductVariant.qty exactly once upon captured payment,
 *    transitioning reservations to 'COMMITTED'.
 *
 * 6. EXPIRATION & CANCELLATION:
 *    releaseExpired() flips expired RESERVED rows to RELEASED without touching qty.
 *    It also cancels unpaid PENDING orders of the released reservations in the same transaction.
 *
 * 7. POST-PAYMENT RESTOCKING:
 *    restockCommitted() flips COMMITTED rows to RELEASED and increments ProductVariant.qty back.
 *
 * ==============================================================================
 * GLOBAL LOCK ORDER HIERARCHY (NO DEADLOCK / NO 40P01):
 * ==============================================================================
 * Level 1: ProductVariant rows (sorted ascending by id via plain string compare)
 * Level 2: StockReservation rows (sorted ascending by id via plain string compare)
 *
 * Operations that modify ProductVariant.qty (reserve, commit, restockCommitted)
 * lock Level 1 first, then Level 2.
 * Operations that only transition reservation status without touching qty (release, releaseExpired)
 * skip Level 1 entirely and only lock Level 2 in ascending id order.
 */
@Injectable()
export class StockReservationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Reserves stock for an order without decrementing physical inventory.
   *
   * Rules:
   * 1. Reject duplicate variantIds with BadRequestException.
   * 2. Sort variantIds with deterministic plain string comparison.
   * 3. Lock ProductVariant rows FOR UPDATE in sorted order, then this order's reservation rows.
   * 4. Compute available stock excluding this order's own active row. Reject if insufficient.
   * 5. NEVER change ProductVariant.qty.
   * 6. Upsert reservation:
   *    - COMMITTED: reject with BadRequestException.
   *    - RESERVED & ACTIVE (expiresAt > NOW()): return unchanged if quantity matches.
   *    - RELEASED or EXPIRED: reuse row, set status = RESERVED, expiresAt = NOW() + 10m.
   * 7. Set Order.reservationExpires to earliest expiresAt among the order's RESERVED rows.
   */
  async reserve(
    orderId: string,
    items: ReserveItemDto[],
    tx?: Prisma.TransactionClient,
  ): Promise<ReservationResult> {
    if (!items || items.length === 0) {
      throw new BadRequestException('At least one item is required for stock reservation');
    }

    // 1. Validate items and aggregate duplicate variantIds deterministically
    const aggregatedMap = new Map<string, number>();
    for (const item of items) {
      if (!item.variantId || typeof item.variantId !== 'string' || item.variantId.trim() === '') {
        throw new BadRequestException('Each item must have a valid non-empty variantId');
      }
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        throw new BadRequestException(
          `Reservation quantity must be a positive integer for variant ${item.variantId} (received ${item.quantity})`,
        );
      }
      const existingQty = aggregatedMap.get(item.variantId) || 0;
      aggregatedMap.set(item.variantId, existingQty + item.quantity);
    }

    const consolidatedItems: ReserveItemDto[] = Array.from(aggregatedMap.entries()).map(
      ([variantId, quantity]) => ({
        variantId,
        quantity,
      }),
    );

    // 2. Sort variantIds with deterministic plain string comparison
    const sortedItems = [...consolidatedItems].sort((a, b) =>
      a.variantId < b.variantId ? -1 : a.variantId > b.variantId ? 1 : 0,
    );
    const sortedVariantIds = sortedItems.map((i) => i.variantId);

    const execute = async (client: Prisma.TransactionClient): Promise<ReservationResult> => {
      // Authoritative database clock: NOW()
      const [{ dbNow }] = await client.$queryRaw<Array<{ dbNow: Date }>>`SELECT NOW() AS "dbNow"`;

      // STEP 1: Lock ProductVariant rows in sorted order (Level 1 in Lock Hierarchy)
      const variantRows = await client.$queryRaw<
        Array<{ id: string; qty: number; isActive: boolean; isArchived: boolean }>
      >`
        SELECT pv."id", pv."qty", pv."isActive", p."isArchived"
        FROM "ProductVariant" pv
        JOIN "Product" p ON pv."productId" = p."id"
        WHERE pv."id" IN (${Prisma.join(sortedVariantIds)})
        ORDER BY pv."id" ASC
        FOR UPDATE;
      `;

      if (variantRows.length !== sortedVariantIds.length) {
        const foundIds = new Set(variantRows.map((v) => v.id));
        const missing = sortedVariantIds.find((id) => !foundIds.has(id));
        throw new NotFoundException(`Product variant not found: ${missing}`);
      }

      // Check active catalog constraints
      for (const row of variantRows) {
        if (!row.isActive) {
          throw new BadRequestException(`Variant ${row.id} is inactive and cannot be reserved`);
        }
        if (row.isArchived) {
          throw new BadRequestException(`Product for variant ${row.id} is archived and cannot be reserved`);
        }
      }

      const variantMap = new Map<string, number>();
      for (const row of variantRows) {
        variantMap.set(row.id, row.qty);
      }

      // STEP 2: Lock this order's existing StockReservation rows (Level 2 in Lock Hierarchy)
      const existingRows = await client.$queryRaw<StockReservation[]>`
        SELECT "id", "orderId", "variantId", "quantity", "status", "expiresAt", "createdAt", "updatedAt"
        FROM "StockReservation"
        WHERE "orderId" = ${orderId} AND "variantId" IN (${Prisma.join(sortedVariantIds)})
        ORDER BY "id" ASC
        FOR UPDATE;
      `;

      const existingMap = new Map<string, StockReservation>();
      for (const row of existingRows) {
        existingMap.set(row.variantId, row);
      }

      // STEP 3: Validate order exists and is not CANCELLED or PAID (Level 3 in Lock Hierarchy)
      const orderRows = await client.$queryRaw<
        Array<{ id: string; orderStatus: string; paymentStatus: string; paymentMethod: string }>
      >`
        SELECT "id", "orderStatus", "paymentStatus", "paymentMethod"
        FROM "Order"
        WHERE "id" = ${orderId}
        FOR UPDATE;
      `;

      if (!orderRows || orderRows.length === 0) {
        throw new NotFoundException(`Order not found: ${orderId}`);
      }

      const orderRecord = orderRows[0];
      if (orderRecord.orderStatus === OrderStatus.CANCELLED) {
        throw new BadRequestException(`Cannot reserve stock for cancelled order ${orderId}`);
      }
      if (orderRecord.paymentStatus === PaymentStatus.PAID) {
        throw new BadRequestException(`Cannot reserve stock for already paid order ${orderId}`);
      }

      // COD Reservation Policy: 24-hour verification window for COD orders; 10 minutes for online checkout
      const expiresAt =
        orderRecord.paymentMethod === 'COD'
          ? new Date(dbNow.getTime() + 24 * 60 * 60 * 1000) // 24 hours
          : new Date(dbNow.getTime() + 10 * 60 * 1000); // 10 minutes

      // STEP 4: Compute active reservations for OTHER orders
      const otherActiveReservations = await client.$queryRaw<Array<{ variantId: string; reservedQty: number }>>`
        SELECT "variantId", COALESCE(SUM("quantity"), 0)::int AS "reservedQty"
        FROM "StockReservation"
        WHERE "variantId" IN (${Prisma.join(sortedVariantIds)})
          AND "status" = 'RESERVED'
          AND "expiresAt" > NOW()
          AND "orderId" != ${orderId}
        GROUP BY "variantId";
      `;

      const otherActiveMap = new Map<string, number>();
      for (const r of otherActiveReservations) {
        otherActiveMap.set(r.variantId, Number(r.reservedQty));
      }

      // STEP 5: Validate available stock and prepare reservations
      const reservations: StockReservation[] = [];

      for (const item of sortedItems) {
        const physicalQty = variantMap.get(item.variantId) ?? 0;
        const otherReserved = otherActiveMap.get(item.variantId) ?? 0;
        const available = physicalQty - otherReserved;

        if (available < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for variant ${item.variantId}. Available: ${available}, requested: ${item.quantity}`,
          );
        }

        const existing = existingMap.get(item.variantId);

        // Case A: COMMITTED -> cannot be re-reserved or modified
        if (existing && existing.status === ReservationStatus.COMMITTED) {
          throw new BadRequestException(`Variant ${item.variantId} is already committed for order ${orderId}`);
        }

        // Case B: RESERVED & ACTIVE (expiresAt > dbNow) -> return active row unchanged if quantity matches
        if (
          existing &&
          existing.status === ReservationStatus.RESERVED &&
          existing.expiresAt > dbNow &&
          existing.quantity === item.quantity
        ) {
          reservations.push(existing);
          continue;
        }

        // Case C: New reservation or row reuse (RELEASED, EXPIRED, or updated quantity)
        // NEVER change ProductVariant.qty
        const reservation = await client.stockReservation.upsert({
          where: {
            orderId_variantId: {
              orderId,
              variantId: item.variantId,
            },
          },
          update: {
            quantity: item.quantity,
            status: ReservationStatus.RESERVED,
            expiresAt,
          },
          create: {
            orderId,
            variantId: item.variantId,
            quantity: item.quantity,
            status: ReservationStatus.RESERVED,
            expiresAt,
          },
        });

        reservations.push(reservation);
      }

      // STEP 6: Set Order.reservationExpires to the EARLIEST expiresAt among all RESERVED reservations
      const earliest = await client.stockReservation.findFirst({
        where: {
          orderId,
          status: ReservationStatus.RESERVED,
        },
        orderBy: { expiresAt: 'asc' },
        select: { expiresAt: true },
      });

      if (earliest) {
        await client.order.updateMany({
          where: { id: orderId },
          data: { reservationExpires: earliest.expiresAt },
        });
      }

      return {
        orderId,
        reservations,
        expiresAt: earliest?.expiresAt ?? expiresAt,
      };
    };

    if (tx) {
      return execute(tx);
    }
    return this.prisma.$transaction(execute, { maxWait: 20000, timeout: 60000 });
  }

  /**
   * Commits stock reservations for an order upon captured payment.
   *
   * Rules:
   * 1. Lock variants (sorted), then reservations (sorted), BEFORE validating.
   * 2. Already COMMITTED is an idempotent no-op.
   * 3. Normal case (RESERVED and unexpired):
   *    - Transition to COMMITTED with RETURNING.
   *    - Require transitioned count == total reservations.
   *    - Decrement ProductVariant.qty per variant exactly once (guard qty >= quantity).
   * 4. Late-payment case (reservation expired before payment captured):
   *    - Re-check availability under the held variant lock:
   *      available = qty - SUM(other active RESERVED with expiresAt > NOW()).
   *    - If available >= quantity: commit and decrement qty.
   *    - If available < quantity: throw InsufficientStockForLatePaymentException
   *      so Phase 7 can flag the order for customer refund.
   * 5. Clear Order.reservationExpires = null.
   */
  async commit(
    orderId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<CommitResult> {
    const execute = async (client: Prisma.TransactionClient): Promise<CommitResult> => {
      // 1. Find distinct candidate variantIds for this order
      const candidates = await client.$queryRaw<Array<{ variantId: string }>>`
        SELECT DISTINCT "variantId"
        FROM "StockReservation"
        WHERE "orderId" = ${orderId}
        ORDER BY "variantId" ASC;
      `;

      if (!candidates || candidates.length === 0) {
        throw new NotFoundException(`No stock reservations found for order: ${orderId}`);
      }

      const sortedVariantIds = candidates
        .map((c) => c.variantId)
        .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

      // 2. Lock ProductVariant rows FIRST in sorted order (Level 1 Lock)
      const variantRows = await client.$queryRaw<Array<{ id: string; qty: number }>>`
        SELECT "id", "qty"
        FROM "ProductVariant"
        WHERE "id" IN (${Prisma.join(sortedVariantIds)})
        ORDER BY "id" ASC
        FOR UPDATE;
      `;

      const variantMap = new Map<string, number>();
      for (const row of variantRows) {
        variantMap.set(row.id, row.qty);
      }

      // 3. Lock this order's StockReservation rows SECOND (Level 2 Lock)
      const reservations = await client.$queryRaw<StockReservation[]>`
        SELECT "id", "orderId", "variantId", "quantity", "status", "expiresAt", "createdAt", "updatedAt"
        FROM "StockReservation"
        WHERE "orderId" = ${orderId}
        ORDER BY "id" ASC
        FOR UPDATE;
      `;

      if (reservations.length === 0) {
        throw new NotFoundException(`No stock reservations found for order: ${orderId}`);
      }

      // Check idempotency: all already COMMITTED
      const allCommitted = reservations.every((r) => r.status === ReservationStatus.COMMITTED);
      if (allCommitted) {
        return { committedCount: 0, status: 'ALREADY_COMMITTED' };
      }

      // Guard: RELEASED reservations must never be transitioned directly to COMMITTED
      const anyReleased = reservations.some((r) => r.status === ReservationStatus.RELEASED);
      if (anyReleased) {
        throw new BadRequestException(
          `Cannot commit released reservation for order ${orderId}. Re-reservation is required.`,
        );
      }

      // Query database clock NOW()
      const [{ dbNow }] = await client.$queryRaw<Array<{ dbNow: Date }>>`SELECT NOW() AS "dbNow"`;

      const allActiveUnexpired = reservations.every(
        (r) => r.status === ReservationStatus.RESERVED && r.expiresAt > dbNow,
      );

      if (allActiveUnexpired) {
        // --- NORMAL COMMIT CASE ---
        const transitioned = await client.$queryRaw<Array<{ id: string; variantId: string; quantity: number }>>`
          UPDATE "StockReservation"
          SET "status" = 'COMMITTED', "updatedAt" = CURRENT_TIMESTAMP
          WHERE "orderId" = ${orderId}
            AND "status" = 'RESERVED'
            AND "expiresAt" > NOW()
          RETURNING "id", "variantId", "quantity";
        `;

        if (transitioned.length !== reservations.length) {
          throw new BadRequestException(
            `Commit count mismatch for order ${orderId}: expected ${reservations.length}, but transitioned ${transitioned.length}`,
          );
        }

        // Decrement ProductVariant.qty exactly once per variant, guarding qty >= quantity
        for (const item of transitioned) {
          const updated = await client.$executeRaw`
            UPDATE "ProductVariant"
            SET "qty" = "qty" - ${item.quantity}
            WHERE "id" = ${item.variantId} AND "qty" >= ${item.quantity};
          `;

          if (updated === 0) {
            throw new BadRequestException(
              `Insufficient physical stock to commit variant ${item.variantId} (qty < ${item.quantity})`,
            );
          }
        }

        // Clear Order.reservationExpires
        await client.order.updateMany({
          where: { id: orderId },
          data: { reservationExpires: null },
        });

        return { committedCount: transitioned.length, status: 'COMMITTED' };
      }

      // --- LATE-PAYMENT CASE (reservation expired before payment captured) ---
      // Under the held variant lock, re-check available inventory
      const otherActiveReservations = await client.$queryRaw<Array<{ variantId: string; reservedQty: number }>>`
        SELECT "variantId", COALESCE(SUM("quantity"), 0)::int AS "reservedQty"
        FROM "StockReservation"
        WHERE "variantId" IN (${Prisma.join(sortedVariantIds)})
          AND "status" = 'RESERVED'
          AND "expiresAt" > NOW()
          AND "orderId" != ${orderId}
        GROUP BY "variantId";
      `;

      const otherActiveMap = new Map<string, number>();
      for (const r of otherActiveReservations) {
        otherActiveMap.set(r.variantId, Number(r.reservedQty));
      }

      // Verify availability for all items of this order
      for (const r of reservations) {
        const physical = variantMap.get(r.variantId) ?? 0;
        const otherReserved = otherActiveMap.get(r.variantId) ?? 0;
        const available = physical - otherReserved;

        if (available < r.quantity) {
          throw new InsufficientStockForLatePaymentException(
            `Insufficient stock to fulfill late payment for order ${orderId}. Variant ${r.variantId} available: ${available}, required: ${r.quantity}`,
          );
        }
      }

      // Sufficient stock remains: commit reservations and decrement physical stock
      const transitionedLate = await client.$queryRaw<Array<{ id: string; variantId: string; quantity: number }>>`
        UPDATE "StockReservation"
        SET "status" = 'COMMITTED', "updatedAt" = CURRENT_TIMESTAMP
        WHERE "orderId" = ${orderId}
          AND "status" != 'COMMITTED'
        RETURNING "id", "variantId", "quantity";
      `;

      for (const item of transitionedLate) {
        const updated = await client.$executeRaw`
          UPDATE "ProductVariant"
          SET "qty" = "qty" - ${item.quantity}
          WHERE "id" = ${item.variantId} AND "qty" >= ${item.quantity};
        `;

        if (updated === 0) {
          throw new InsufficientStockForLatePaymentException(
            `Insufficient physical stock to decrement variant ${item.variantId} for late payment on order ${orderId}`,
          );
        }
      }

      // Clear Order.reservationExpires
      await client.order.updateMany({
        where: { id: orderId },
        data: { reservationExpires: null },
      });

      return { committedCount: transitionedLate.length, status: 'COMMITTED_LATE' };
    };

    if (tx) {
      return execute(tx);
    }
    return this.prisma.$transaction(execute, { maxWait: 20000, timeout: 60000 });
  }

  /**
   * Releases active reservations for a specific order (e.g. customer cancels checkout).
   *
   * Rules:
   * 1. ONLY flip RESERVED to RELEASED via CTE ORDER BY id FOR UPDATE ... RETURNING.
   * 2. NO ProductVariant locks and NO qty changes.
   * 3. Clear Order.reservationExpires when no RESERVED rows remain.
   */
  async release(
    orderId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<ReleaseResult> {
    const execute = async (client: Prisma.TransactionClient): Promise<ReleaseResult> => {
      const transitionedRows = await client.$queryRaw<Array<{ id: string }>>`
        WITH locked_rows AS (
          SELECT "id"
          FROM "StockReservation"
          WHERE "orderId" = ${orderId} AND "status" = 'RESERVED'
          ORDER BY "id" ASC
          FOR UPDATE
        )
        UPDATE "StockReservation" r
        SET "status" = 'RELEASED', "updatedAt" = CURRENT_TIMESTAMP
        FROM locked_rows
        WHERE r."id" = locked_rows."id"
        RETURNING r."id";
      `;

      // Clear Order.reservationExpires if no RESERVED rows remain
      const remainingReserved = await client.stockReservation.count({
        where: { orderId, status: ReservationStatus.RESERVED },
      });

      if (remainingReserved === 0) {
        await client.order.updateMany({
          where: { id: orderId },
          data: { reservationExpires: null },
        });
      }

      return { releasedCount: transitionedRows.length };
    };

    if (tx) {
      return execute(tx);
    }
    return this.prisma.$transaction(execute, { maxWait: 20000, timeout: 60000 });
  }

  /**
   * Background sweep: releases all expired reservations across the store.
   *
   * Rules:
   * 1. ONLY flip RESERVED to RELEASED (CTE ORDER BY id FOR UPDATE ... RETURNING).
   * 2. NO ProductVariant locks and NO qty changes.
   * 3. In the same transaction, cancels unpaid PENDING orders of the released rows.
   * 4. Clear Order.reservationExpires on affected orders.
   * 5. No test-only parameters in public signature.
   */
  async releaseExpired(
    tx?: Prisma.TransactionClient,
  ): Promise<ReleaseExpiredResult> {
    const execute = async (client: Prisma.TransactionClient): Promise<ReleaseExpiredResult> => {
      // Transition expired rows using CTE (respects individual expiresAt: 10m for online, 24h for COD)
      const transitionedRows = await client.$queryRaw<Array<{ id: string; orderId: string }>>`
        WITH locked_rows AS (
          SELECT "id", "orderId"
          FROM "StockReservation"
          WHERE "status" = 'RESERVED' AND "expiresAt" <= NOW()
          ORDER BY "id" ASC
          FOR UPDATE
        )
        UPDATE "StockReservation" r
        SET "status" = 'RELEASED', "updatedAt" = CURRENT_TIMESTAMP
        FROM locked_rows
        WHERE r."id" = locked_rows."id"
        RETURNING r."id", r."orderId";
      `;

      let cancelledOrdersCount = 0;

      if (transitionedRows.length > 0) {
        const releasedOrderIds = Array.from(new Set(transitionedRows.map((r) => r.orderId)));

        // Cancel unpaid PENDING orders of the released rows in the same transaction
        const cancelResult = await client.$executeRaw`
          UPDATE "Order"
          SET "orderStatus" = 'CANCELLED',
              "reservationExpires" = NULL,
              "updatedAt" = CURRENT_TIMESTAMP
          WHERE "id" IN (${Prisma.join(releasedOrderIds)})
            AND "orderStatus" = 'PENDING'
            AND "paymentStatus" = 'PENDING';
        `;

        cancelledOrdersCount = cancelResult;

        // Clear reservationExpires on orders with no remaining active reservations
        await client.$executeRaw`
          UPDATE "Order"
          SET "reservationExpires" = NULL, "updatedAt" = CURRENT_TIMESTAMP
          WHERE "id" IN (${Prisma.join(releasedOrderIds)})
            AND "id" NOT IN (
              SELECT DISTINCT "orderId"
              FROM "StockReservation"
              WHERE "status" = 'RESERVED'
                AND "orderId" IN (${Prisma.join(releasedOrderIds)})
            );
        `;
      }

      return {
        releasedCount: transitionedRows.length,
        cancelledOrdersCount,
      };
    };

    if (tx) {
      return execute(tx);
    }
    return this.prisma.$transaction(execute, { maxWait: 20000, timeout: 60000 });
  }

  /**
   * Restocks committed reservations after order cancellation or return.
   *
   * Rules:
   * 1. Transitions COMMITTED to RELEASED with RETURNING.
   * 2. Adds physical qty back to ProductVariant.
   * 3. Idempotent: if already RELEASED, returns restockedCount = 0.
   * 4. Variants locked in deterministic sorted order before reservations.
   * 5. Clears Order.reservationExpires.
   */
  async restockCommitted(
    orderId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<RestockResult> {
    const execute = async (client: Prisma.TransactionClient): Promise<RestockResult> => {
      // 1. Find distinct candidate variantIds for COMMITTED reservations of this order
      const candidates = await client.$queryRaw<Array<{ variantId: string }>>`
        SELECT DISTINCT "variantId"
        FROM "StockReservation"
        WHERE "orderId" = ${orderId} AND "status" = 'COMMITTED'
        ORDER BY "variantId" ASC;
      `;

      if (!candidates || candidates.length === 0) {
        return { restockedCount: 0 };
      }

      const sortedVariantIds = candidates
        .map((c) => c.variantId)
        .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

      // 2. Lock ProductVariant rows FIRST in sorted order (Level 1 Lock)
      await client.$queryRaw<Array<{ id: string }>>`
        SELECT "id"
        FROM "ProductVariant"
        WHERE "id" IN (${Prisma.join(sortedVariantIds)})
        ORDER BY "id" ASC
        FOR UPDATE;
      `;

      // 3. Lock & flip reservations from COMMITTED to RELEASED with RETURNING (Level 2 Lock)
      const transitionedRows = await client.$queryRaw<Array<{ id: string; variantId: string; quantity: number }>>`
        WITH locked_rows AS (
          SELECT "id"
          FROM "StockReservation"
          WHERE "orderId" = ${orderId}
            AND "status" = 'COMMITTED'
            AND "variantId" IN (${Prisma.join(sortedVariantIds)})
          ORDER BY "id" ASC
          FOR UPDATE
        )
        UPDATE "StockReservation" r
        SET "status" = 'RELEASED', "updatedAt" = CURRENT_TIMESTAMP
        FROM locked_rows
        WHERE r."id" = locked_rows."id"
        RETURNING r."id", r."variantId", r."quantity";
      `;

      if (!transitionedRows || transitionedRows.length === 0) {
        return { restockedCount: 0 };
      }

      // 4. Aggregate quantities per variant and add back to ProductVariant.qty
      const restockMap = new Map<string, number>();
      for (const row of transitionedRows) {
        restockMap.set(row.variantId, (restockMap.get(row.variantId) || 0) + row.quantity);
      }

      const sortedRestockVariantIds = Array.from(restockMap.keys()).sort((a, b) =>
        a < b ? -1 : a > b ? 1 : 0,
      );

      for (const variantId of sortedRestockVariantIds) {
        const qtyToAdd = restockMap.get(variantId)!;
        await client.$executeRaw`
          UPDATE "ProductVariant"
          SET "qty" = "qty" + ${qtyToAdd}
          WHERE "id" = ${variantId};
        `;
      }

      // 5. Clear Order.reservationExpires
      await client.order.updateMany({
        where: { id: orderId },
        data: { reservationExpires: null },
      });

      return { restockedCount: transitionedRows.length };
    };

    if (tx) {
      return execute(tx);
    }
    return this.prisma.$transaction(execute, { maxWait: 20000, timeout: 60000 });
  }
}
