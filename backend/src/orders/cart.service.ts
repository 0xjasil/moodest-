import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { StockReservationService } from '../inventory/stock-reservation.service';
import { CartValidationService } from './cart-validation.service';
import { OrderStatus, PaymentStatus, PaymentMethod } from '@prisma/client';

@Injectable()
export class CartService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stockReservationService: StockReservationService,
    private readonly cartValidationService: CartValidationService,
  ) {}

  private async getOrCreateCart(userId: string) {
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: { include: { images: true } },
            variant: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              product: { include: { images: true } },
              variant: true,
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      });
    }

    return cart;
  }

  private formatCart(cart: any) {
    const formattedItems = cart.items.map((item: any) => {
      const price = item.variant.offerPrice ? Number(item.variant.offerPrice) : Number(item.variant.price);
      return {
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        price,
        total: price * item.quantity,
        product: {
          id: item.product.id,
          name: item.product.name,
          slug: item.product.slug,
          image: item.product.image || item.product.images?.[0]?.url || '/placeholder.png',
        },
        variant: {
          id: item.variant.id,
          size: item.variant.size,
          color: item.variant.color,
          sku: item.variant.sku,
          stock: item.variant.qty,
          price: Number(item.variant.price),
          offerPrice: item.variant.offerPrice ? Number(item.variant.offerPrice) : null,
        },
      };
    });

    const subtotal = formattedItems.reduce((acc: number, item: any) => acc + item.total, 0);

    return {
      id: cart.id,
      userId: cart.userId,
      items: formattedItems,
      subtotal,
      total: subtotal,
      itemCount: formattedItems.reduce((acc: number, item: any) => acc + item.quantity, 0),
    };
  }

  async getCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);
    return this.formatCart(cart);
  }

  async addItem(userId: string, variantId: string, quantity: number = 1) {
    if (!variantId || typeof variantId !== 'string') {
      throw new BadRequestException('A valid variantId is required');
    }

    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than zero');
    }

    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: true },
    });

    if (!variant) {
      throw new NotFoundException(`Product variant ${variantId} not found`);
    }

    await this.cartValidationService.validateCartItem(variant.productId, variant.id, quantity);

    const cart = await this.getOrCreateCart(userId);

    const existingItem = await this.prisma.cartItem.findUnique({
      where: {
        cartId_variantId: {
          cartId: cart.id,
          variantId: variant.id,
        },
      },
    });

    if (existingItem) {
      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
      });
    } else {
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: variant.productId,
          variantId: variant.id,
          quantity,
        },
      });
    }

    return this.getCart(userId);
  }

  async updateItem(userId: string, itemId: string, quantity: number) {
    const cart = await this.getOrCreateCart(userId);
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
    });

    if (!item) {
      throw new NotFoundException(`Cart item ${itemId} not found in cart`);
    }

    if (quantity <= 0) {
      await this.prisma.cartItem.delete({ where: { id: itemId } });
    } else {
      await this.prisma.cartItem.update({
        where: { id: itemId },
        data: { quantity },
      });
    }

    return this.getCart(userId);
  }

  async removeItem(userId: string, itemId: string) {
    const cart = await this.getOrCreateCart(userId);
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
    });

    if (!item) {
      throw new NotFoundException(`Cart item ${itemId} not found in cart`);
    }

    await this.prisma.cartItem.delete({ where: { id: itemId } });
    return { message: 'Item removed from cart', id: itemId };
  }

  async clearCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);
    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    return { message: 'Cart cleared successfully' };
  }

  async reserveCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);
    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException('Cannot reserve an empty cart');
    }

    // Get or create default address for draft order (if none, pick first user address)
    const address = await this.prisma.address.findFirst({
      where: { userId },
      orderBy: { isDefault: 'desc' },
    });

    if (!address) {
      throw new BadRequestException('User must have an address on file before reserving cart');
    }

    // Create a draft order for reservation
    const orderNumber = `DFT-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
    const subtotal = cart.items.reduce((sum, item) => {
      const price = item.variant.offerPrice ? Number(item.variant.offerPrice) : Number(item.variant.price);
      return sum + price * item.quantity;
    }, 0);

    const draftOrder = await this.prisma.order.create({
      data: {
        orderNumber,
        userId,
        addressId: address.id,
        subtotal,
        totalAmount: subtotal,
        orderStatus: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        paymentMethod: PaymentMethod.RAZORPAY,
      },
    });

    const reserveItems = cart.items.map((i) => ({
      variantId: i.variantId,
      quantity: i.quantity,
    }));

    const result = await this.stockReservationService.reserve(draftOrder.id, reserveItems);

    return {
      id: draftOrder.id,
      reservationId: draftOrder.id,
      orderId: draftOrder.id,
      expiresAt: result.expiresAt,
      items: result.reservations,
    };
  }

  async releaseReservation(reservationId: string) {
    const result = await this.stockReservationService.release(reservationId);
    return { message: 'Reservation released', releasedCount: result.releasedCount };
  }
}

