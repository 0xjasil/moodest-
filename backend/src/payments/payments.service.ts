import { Injectable, NotFoundException, BadRequestException, BadGatewayException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { PaymentEventService } from './payment-event.service';
import Razorpay from 'razorpay';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private razorpayClient: any;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly paymentEventService: PaymentEventService,
  ) {
    const keyId = this.configService.get<string>('razorpay.keyId');
    const keySecret = this.configService.get<string>('razorpay.keySecret');

    if (keyId && keySecret && !keyId.includes('placeholder') && !keySecret.includes('placeholder')) {
      try {
        this.razorpayClient = new Razorpay({
          key_id: keyId,
          key_secret: keySecret,
        });
      } catch (err) {
        this.logger.warn('Failed to initialize Razorpay SDK:', err);
      }
    }
  }

  async createIntent(orderId: string, currency: string = 'INR') {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException(`Order not found: ${orderId}`);
    }

    if (order.paymentStatus === 'PAID') {
      return {
        alreadyPaid: true,
        orderId: order.id,
        message: 'Order is already paid',
      };
    }

    const amountInPaise = Math.round(Number(order.totalAmount) * 100);
    const keyId = this.configService.get<string>('razorpay.keyId') || 'rzp_test_placeholder';

    let razorpayOrderId: string;

    if (this.razorpayClient) {
      try {
        const rzpOrder = await this.razorpayClient.orders.create({
          amount: amountInPaise,
          currency,
          receipt: order.orderNumber,
        });
        razorpayOrderId = rzpOrder.id;
      } catch (err: any) {
        this.logger.error('Razorpay order creation failed:', err?.message || err);
        throw new BadGatewayException('Payment gateway order creation failed');
      }
    } else {
      if (process.env.NODE_ENV === 'production') {
        throw new BadGatewayException('Payment gateway is not configured');
      }
      this.logger.warn('Razorpay client not configured - dev mode fallback order ID used');
      razorpayOrderId = `order_mock_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    }

    await this.prisma.order.update({
      where: { id: orderId },
      data: { razorpayOrderId },
    });

    return {
      orderId: order.id,
      razorpayOrderId,
      amount: Number(order.totalAmount),
      amountInPaise,
      currency,
      keyId,
    };
  }

  async verifyPayment(dto: {
    orderId: string;
    razorpayPaymentId: string;
    razorpayOrderId: string;
    razorpaySignature: string;
  }) {
    const secret = this.configService.get<string>('razorpay.keySecret') || '';
    const rawBody = `${dto.razorpayOrderId}|${dto.razorpayPaymentId}`;

    return this.paymentEventService.reconcilePaymentEvent({
      orderId: dto.orderId,
      gatewayEventId: dto.razorpayPaymentId,
      payload: dto,
      event: 'payment.captured',
      signature: dto.razorpaySignature,
      rawBody,
      secret,
      isExternalWebhook: false,
    });
  }

  async handleWebhook(rawBody: string | Buffer, signature?: string) {
    const secret =
      this.configService.get<string>('razorpay.webhookSecret') ||
      this.configService.get<string>('razorpay.keySecret') ||
      process.env.RAZORPAY_WEBHOOK_SECRET ||
      '';

    if (!signature) {
      throw new BadRequestException('Webhook signature header (x-razorpay-signature) is required');
    }

    if (!secret) {
      throw new BadRequestException('Webhook secret is not configured');
    }

    const isValid = this.paymentEventService.verifySignature(rawBody, signature, secret);
    if (!isValid) {
      throw new BadRequestException('Invalid Razorpay webhook signature');
    }

    let bodyString = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
    let payload: any;
    try {
      payload = JSON.parse(bodyString);
    } catch {
      throw new BadRequestException('Malformed webhook payload JSON');
    }

    const event = payload?.event || 'payment.captured';
    const paymentEntity = payload?.payload?.payment?.entity;
    const gatewayEventId = paymentEntity?.id || payload?.id;

    if (!gatewayEventId) {
      throw new BadRequestException('Missing payment or event ID in webhook');
    }

    // Resolve orderId from notes or razorpay_order_id
    let orderId = paymentEntity?.notes?.orderId || paymentEntity?.notes?.order_id;

    if (!orderId && paymentEntity?.order_id) {
      const order = await this.prisma.order.findFirst({
        where: { razorpayOrderId: paymentEntity.order_id },
        select: { id: true },
      });
      if (order) orderId = order.id;
    }

    if (!orderId) {
      this.logger.warn(`Could not resolve orderId for gateway event: ${gatewayEventId}`);
      return { received: true, processed: false, reason: 'ORDER_NOT_FOUND' };
    }

    return this.paymentEventService.reconcilePaymentEvent({
      orderId,
      gatewayEventId,
      payload,
      event,
      signature,
      rawBody,
      secret,
      isExternalWebhook: true,
    });
  }
}

