import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Prisma, OrderItem } from '@prisma/client';

export interface OrderItemInput {
  productId: string;
  variantId: string;
  quantity: number;
  clientSubmittedPrice?: number;
}

export interface ValidatedOrderItemSnapshot {
  productId: string;
  variantId: string;
  quantity: number;
  size: string;
  color: string;
  unitPrice: Prisma.Decimal;
  totalPrice: Prisma.Decimal;
}

@Injectable()
export class OrderValidationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Validates an order item against the database.
   * Ensures that:
   * 1. variant.productId === productId.
   * 2. Authoritative price is derived solely from database (variant.offerPrice ?? variant.price).
   * 3. Any client-submitted price is explicitly discarded.
   * 4. Prepares immutable snapshot values (size, color, unitPrice, totalPrice) for OrderItem.
   */
  async validateOrderItem(item: OrderItemInput): Promise<ValidatedOrderItemSnapshot> {
    if (item.quantity <= 0) {
      throw new BadRequestException('Order item quantity must be greater than zero');
    }

    const variant = await this.prisma.productVariant.findUnique({
      where: { id: item.variantId },
      include: { product: true },
    });

    if (!variant) {
      throw new NotFoundException(`Product variant not found: ${item.variantId}`);
    }

    if (variant.productId !== item.productId) {
      throw new BadRequestException('Integrity Error: Order variant does not match product');
    }

    if (!variant.isActive || variant.product.isArchived) {
      throw new BadRequestException(`Product variant ${item.variantId} is not available for purchase`);
    }

    // Resolve authoritative price strictly from database; ignore client price
    const unitPrice = variant.offerPrice ?? variant.price;
    const totalPrice = new Prisma.Decimal(Number(unitPrice) * item.quantity);

    return {
      productId: variant.productId,
      variantId: variant.id,
      quantity: item.quantity,
      size: variant.size,
      color: variant.color,
      unitPrice,
      totalPrice,
    };
  }

  /**
   * Persists a validated OrderItem record with authoritative pricing snapshot.
   */
  async createValidatedOrderItem(orderId: string, item: OrderItemInput): Promise<OrderItem> {
    const validated = await this.validateOrderItem(item);

    return this.prisma.orderItem.create({
      data: {
        orderId,
        productId: validated.productId,
        variantId: validated.variantId,
        quantity: validated.quantity,
        size: validated.size,
        color: validated.color,
        unitPrice: validated.unitPrice,
        totalPrice: validated.totalPrice,
      },
    });
  }
}
