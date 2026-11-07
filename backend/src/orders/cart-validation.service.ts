import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface ValidatedCartItem {
  cartId: string;
  productId: string;
  variantId: string;
  quantity: number;
  authoritativePrice: number;
}

@Injectable()
export class CartValidationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Validates cart item addition or update.
   * Ensures that:
   * 1. The requested variant exists and belongs to the specified product (variant.productId === productId).
   * 2. Quantity is strictly positive (> 0).
   * 3. Both product and variant are active and available.
   * 4. Price is resolved strictly from database (offerPrice ?? price), ignoring client input.
   */
  async validateCartItem(
    productId: string,
    variantId: string,
    quantity: number,
    clientSubmittedPrice?: number,
  ): Promise<ValidatedCartItem> {
    if (quantity <= 0) {
      throw new BadRequestException('Cart item quantity must be greater than zero');
    }

    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: true },
    });

    if (!variant) {
      throw new NotFoundException(`Product variant not found: ${variantId}`);
    }

    if (variant.productId !== productId) {
      throw new BadRequestException(
        `Integrity Error: Selected variant does not belong to the selected product`,
      );
    }

    if (!variant.isActive || variant.product.isArchived) {
      throw new BadRequestException('Product or variant is currently inactive or unavailable');
    }

    // Authoritative server-side price resolution (client-submitted price is ignored)
    const authoritativePrice = Number(variant.offerPrice ?? variant.price);

    return {
      cartId: '',
      productId: variant.productId,
      variantId: variant.id,
      quantity,
      authoritativePrice,
    };
  }
}
