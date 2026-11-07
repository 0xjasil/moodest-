import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { BadRequestException } from '@nestjs/common';

describe('PaymentsController (Unit Tests)', () => {
  let controller: PaymentsController;
  let service: PaymentsService;

  beforeEach(() => {
    service = {
      createIntent: jest.fn().mockResolvedValue({
        orderId: 'ord_1',
        razorpayOrderId: 'order_rzp_123',
        amount: 2499,
        currency: 'INR',
        keyId: 'rzp_test_123',
      }),
      verifyPayment: jest.fn().mockResolvedValue({
        orderId: 'ord_1',
        status: 'COMMITTED',
        stockAllocated: true,
      }),
      handleWebhook: jest.fn().mockResolvedValue({
        orderId: 'ord_1',
        status: 'COMMITTED',
        stockAllocated: true,
      }),
    } as unknown as PaymentsService;

    controller = new PaymentsController(service);
  });

  it('POST /payments/create-intent creates payment intent for order', async () => {
    const res = await controller.createIntent({ orderId: 'ord_1' });
    expect(res.razorpayOrderId).toBe('order_rzp_123');
    expect(service.createIntent).toHaveBeenCalledWith('ord_1', undefined);
  });

  it('POST /payments/create-intent rejects request when orderId is missing', async () => {
    await expect(controller.createIntent({} as any)).rejects.toThrow(BadRequestException);
  });

  it('POST /payments/verify verifies signature and confirms order', async () => {
    const res = await controller.verifyPayment({
      orderId: 'ord_1',
      razorpayPaymentId: 'pay_123',
      razorpayOrderId: 'order_rzp_123',
      razorpaySignature: 'sig_123',
    });
    expect(res.status).toBe('COMMITTED');
    expect(service.verifyPayment).toHaveBeenCalledWith({
      orderId: 'ord_1',
      razorpayPaymentId: 'pay_123',
      razorpayOrderId: 'order_rzp_123',
      razorpaySignature: 'sig_123',
    });
  });

  it('POST /payments/webhook delegates to webhook handler with rawBody and signature', async () => {
    const mockReq = {
      rawBody: Buffer.from(JSON.stringify({ event: 'payment.captured' })),
      body: { event: 'payment.captured' },
    } as any;

    const res = await controller.handleWebhook(mockReq, 'webhook_sig_123');
    expect((res as any).status).toBe('COMMITTED');
    expect(service.handleWebhook).toHaveBeenCalledWith(mockReq.rawBody, 'webhook_sig_123');
  });
});

