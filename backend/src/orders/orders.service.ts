import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { StockReservationService } from '../inventory/stock-reservation.service';
import { OrderValidationService, ValidatedOrderItemSnapshot } from './order-validation.service';
import {
  Prisma,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  ReservationStatus,
} from '@prisma/client';

export interface PlaceOrderDto {
  addressId: string;
  reservationId?: string;
  couponCode?: string;
  walletAmountUsed?: number;
  paymentMethod?: 'COD' | 'RAZORPAY';
  items?: Array<{ variantId: string; quantity: number }>;
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stockReservationService: StockReservationService,
    private readonly orderValidationService: OrderValidationService,
  ) {}

  private formatOrder(order: any) {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      userId: order.userId,
      addressId: order.addressId,
      subtotal: Number(order.subtotal),
      taxAmount: Number(order.taxAmount),
      shippingAmount: Number(order.shippingAmount),
      discountAmount: Number(order.discountAmount),
      totalAmount: Number(order.totalAmount),
      total: Number(order.totalAmount),
      status: order.orderStatus,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      razorpayOrderId: order.razorpayOrderId || null,
      trackingNumber: order.trackingNumber || null,
      notes: order.notes || null,
      items: (order.items || []).map((item: any) => ({
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        price: Number(item.unitPrice),
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
        product: item.product
          ? {
              id: item.product.id,
              name: item.product.name,
              slug: item.product.slug,
              image: item.product.image || '/placeholder.png',
            }
          : undefined,
      })),
      shippingAddress: order.shippingAddress
        ? {
            id: order.shippingAddress.id,
            name: order.shippingAddress.name,
            phone: order.shippingAddress.phone,
            street: order.shippingAddress.street,
            city: order.shippingAddress.city,
            state: order.shippingAddress.state,
            pincode: order.shippingAddress.pincode,
            country: order.shippingAddress.country,
          }
        : undefined,
      user: order.user
        ? {
            id: order.user.id,
            email: order.user.email,
            name: order.user.name,
          }
        : undefined,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  async placeOrder(userId: string, dto: PlaceOrderDto) {
    // 1. Verify shipping address belongs to user
    const address = await this.prisma.address.findFirst({
      where: { id: dto.addressId, userId },
    });

    if (!address) {
      throw new NotFoundException(`Shipping address not found: ${dto.addressId}`);
    }

    // 2. Resolve items: from DTO, or from reservationId, or from Cart
    let candidateItems: Array<{ variantId: string; quantity: number }> = dto.items || [];

    if (candidateItems.length === 0 && dto.reservationId) {
      const draftReservations = await this.prisma.stockReservation.findMany({
        where: { orderId: dto.reservationId },
      });
      if (draftReservations.length > 0) {
        candidateItems = draftReservations.map((r) => ({
          variantId: r.variantId,
          quantity: r.quantity,
        }));
      }
    }

    if (candidateItems.length === 0) {
      const cart = await this.prisma.cart.findUnique({
        where: { userId },
        include: { items: true },
      });
      if (cart && cart.items.length > 0) {
        candidateItems = cart.items.map((i) => ({
          variantId: i.variantId,
          quantity: i.quantity,
        }));
      }
    }

    if (candidateItems.length === 0) {
      throw new BadRequestException('No items found to place order');
    }

    // Consolidate candidate items by variantId
    const aggregated = new Map<string, number>();
    for (const item of candidateItems) {
      aggregated.set(item.variantId, (aggregated.get(item.variantId) || 0) + item.quantity);
    }

    const orderItemsInput = Array.from(aggregated.entries()).map(([variantId, quantity]) => ({
      variantId,
      quantity,
    }));

    // 3. Server-side validation and snapshot generation for each item
    const snapshots: ValidatedOrderItemSnapshot[] = [];
    for (const item of orderItemsInput) {
      const variant = await this.prisma.productVariant.findUnique({
        where: { id: item.variantId },
      });
      if (!variant) {
        throw new NotFoundException(`Variant not found: ${item.variantId}`);
      }
      const snapshot = await this.orderValidationService.validateOrderItem({
        productId: variant.productId,
        variantId: variant.id,
        quantity: item.quantity,
      });
      snapshots.push(snapshot);
    }

    // 4. Financial Calculations
    const subtotal = snapshots.reduce((sum, s) => sum + Number(s.totalPrice), 0);
    let discountAmount = 0;

    if (dto.couponCode) {
      const coupon = await this.prisma.coupon.findUnique({
        where: { code: dto.couponCode.toUpperCase() },
      });
      if (coupon && coupon.isActive && new Date() <= coupon.endDate) {
        if (coupon.discountType === 'PERCENTAGE') {
          discountAmount = (subtotal * Number(coupon.discountValue)) / 100;
          if (coupon.maxDiscount) {
            discountAmount = Math.min(discountAmount, Number(coupon.maxDiscount));
          }
        } else {
          discountAmount = Number(coupon.discountValue);
        }
      }
    }

    const shippingAmount = subtotal > 1500 ? 0 : 99;
    const taxAmount = 0; // GST included in pricing
    const totalAmount = Math.max(0, subtotal + shippingAmount + taxAmount - discountAmount);

    const paymentMethod = dto.paymentMethod === 'COD' ? PaymentMethod.COD : PaymentMethod.RAZORPAY;
    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 5. Transactionally create Order and reserve stock
    const createdOrder = await this.prisma.$transaction(
      async (tx) => {
        const order = await tx.order.create({
          data: {
            orderNumber,
            userId,
            addressId: address.id,
            subtotal: new Prisma.Decimal(subtotal),
            taxAmount: new Prisma.Decimal(taxAmount),
            shippingAmount: new Prisma.Decimal(shippingAmount),
            discountAmount: new Prisma.Decimal(discountAmount),
            totalAmount: new Prisma.Decimal(totalAmount),
            orderStatus: OrderStatus.PENDING,
            paymentStatus: PaymentStatus.PENDING,
            paymentMethod,
          },
        });

        // Create OrderItem records
        for (const snap of snapshots) {
          await tx.orderItem.create({
            data: {
              orderId: order.id,
              productId: snap.productId,
              variantId: snap.variantId,
              unitPrice: snap.unitPrice,
              quantity: snap.quantity,
              totalPrice: snap.totalPrice,
              size: snap.size,
              color: snap.color,
            },
          });
        }

        // Reserve stock under this order
        await this.stockReservationService.reserve(
          order.id,
          orderItemsInput.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
          tx,
        );

        // Clean up draft order reservations if used
        if (dto.reservationId && dto.reservationId !== order.id) {
          await tx.stockReservation.deleteMany({ where: { orderId: dto.reservationId } });
          await tx.order.delete({ where: { id: dto.reservationId } }).catch(() => {});
        }

        // Clear user's cart
        const cart = await tx.cart.findUnique({ where: { userId } });
        if (cart) {
          await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
        }

        return order;
      },
      { maxWait: 15000, timeout: 45000 },
    );

    return this.getOrderById(createdOrder.id, userId);
  }

  async getUserOrders(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: { product: true, variant: true },
        },
        shippingAddress: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders.map((o) => this.formatOrder(o));
  }

  async getOrderById(orderId: string, userId?: string, isAdmin: boolean = false) {
    const cleanId = orderId.replace(/^#/, '').trim();
    const order = await this.prisma.order.findFirst({
      where: {
        OR: [
          { id: orderId },
          { id: cleanId },
          { orderNumber: orderId },
          { orderNumber: cleanId },
        ],
      },
      include: {
        items: {
          include: { product: true, variant: true },
        },
        shippingAddress: true,
        user: { select: { id: true, name: true, email: true } },
        paymentLogs: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order not found: ${orderId}`);
    }

    if (!isAdmin && userId && order.userId !== userId) {
      throw new ForbiddenException('You do not have permission to view this order');
    }

    return this.formatOrder(order);
  }

  async cancelOrder(orderId: string, userId?: string, isAdmin: boolean = false) {
    const cleanId = orderId.replace(/^#/, '').trim();
    const order = await this.prisma.order.findFirst({
      where: {
        OR: [
          { id: orderId },
          { id: cleanId },
          { orderNumber: orderId },
          { orderNumber: cleanId },
        ],
      },
      include: { reservations: true },
    });

    if (!order) {
      throw new NotFoundException(`Order not found: ${orderId}`);
    }

    if (!isAdmin && userId && order.userId !== userId) {
      throw new ForbiddenException('You do not have permission to cancel this order');
    }

    if (order.orderStatus === OrderStatus.DELIVERED || order.orderStatus === OrderStatus.SHIPPED) {
      throw new BadRequestException(`Cannot cancel order in ${order.orderStatus} status`);
    }

    if (order.orderStatus === OrderStatus.CANCELLED) {
      return this.getOrderById(order.id, userId, isAdmin);
    }

    const hasCommitted = order.reservations.some((r) => r.status === ReservationStatus.COMMITTED);
    const hasReserved = order.reservations.some((r) => r.status === ReservationStatus.RESERVED);

    if (hasCommitted) {
      await this.stockReservationService.restockCommitted(order.id);
    } else if (hasReserved) {
      await this.stockReservationService.release(order.id);
    }

    const cancelNote = isAdmin ? '[ADMIN_CANCELLED]' : '[MANUALLY_CANCELLED] by customer';

    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        orderStatus: OrderStatus.CANCELLED,
        reservationExpires: null,
        notes: order.notes ? `${order.notes}\n${cancelNote}` : cancelNote,
      },
    });

    return this.getOrderById(order.id, userId, isAdmin);
  }

  async requestReturn(orderId: string, userId: string) {
    const cleanId = orderId.replace(/^#/, '').trim();
    const order = await this.prisma.order.findFirst({
      where: {
        OR: [
          { id: orderId },
          { id: cleanId },
          { orderNumber: orderId },
          { orderNumber: cleanId },
        ],
      },
    });
    if (!order) {
      throw new NotFoundException(`Order not found: ${orderId}`);
    }

    if (order.userId !== userId) {
      throw new ForbiddenException('You do not have permission to return this order');
    }

    if (order.orderStatus !== OrderStatus.DELIVERED) {
      throw new BadRequestException('Only delivered orders can be requested for return');
    }

    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        orderStatus: OrderStatus.RETURNED,
        notes: order.notes ? `${order.notes}\n[RETURN_REQUESTED]` : '[RETURN_REQUESTED]',
      },
    });

    await this.stockReservationService.restockCommitted(order.id);

    return this.getOrderById(order.id, userId);
  }

  // --- ADMIN OPERATIONS ---

  async getAdminOrders(params: { status?: string; page?: number; limit?: number }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {};
    if (params.status && params.status !== 'all') {
      where.orderStatus = params.status as OrderStatus;
    }

    const [total, orders] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        include: {
          items: { include: { product: true, variant: true } },
          shippingAddress: true,
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const formatted = orders.map((o) => this.formatOrder(o));
    const pages = Math.ceil(total / limit) || 1;

    return {
      success: true,
      message: '',
      data: formatted,
      items: formatted,
      total,
      page,
      limit,
      pages,
      totalPages: pages,
    };
  }

  async updateOrderStatus(orderId: string, status: OrderStatus, trackingNumber?: string) {
    const cleanId = orderId.replace(/^#/, '').trim();
    const order = await this.prisma.order.findFirst({
      where: {
        OR: [
          { id: orderId },
          { id: cleanId },
          { orderNumber: orderId },
          { orderNumber: cleanId },
        ],
      },
      include: { reservations: true },
    });

    if (!order) {
      throw new NotFoundException(`Order not found: ${orderId}`);
    }

    // If cancelling or returning, restock committed stock
    if (
      (status === OrderStatus.CANCELLED || status === OrderStatus.RETURNED) &&
      order.orderStatus !== status
    ) {
      const hasCommitted = order.reservations.some((r) => r.status === ReservationStatus.COMMITTED);
      if (hasCommitted) {
        await this.stockReservationService.restockCommitted(order.id);
      } else {
        await this.stockReservationService.release(order.id);
      }
    }

    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        orderStatus: status,
        trackingNumber: trackingNumber !== undefined ? trackingNumber : order.trackingNumber,
        reservationExpires:
          status === OrderStatus.CANCELLED || status === OrderStatus.RETURNED || status === OrderStatus.DELIVERED
            ? null
            : order.reservationExpires,
      },
    });

    return this.getOrderById(order.id, undefined, true);
  }
}
