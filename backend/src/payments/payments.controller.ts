import {
  Controller,
  Post,
  Param,
  Body,
  Headers,
  Req,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-intent')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create Razorpay payment intent for order' })
  async createIntent(@Body() body: { orderId: string; currency?: string }) {
    if (!body?.orderId) {
      throw new BadRequestException('orderId is required');
    }
    return this.paymentsService.createIntent(body.orderId, body.currency);
  }

  @Post('retry/:orderId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Retry payment intent for order' })
  async retryIntent(
    @Param('orderId') orderId: string,
    @Body() body: { currency?: string },
  ) {
    return this.paymentsService.createIntent(orderId, body?.currency);
  }

  @Post('verify')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Verify Razorpay payment signature & reconcile stock' })
  async verifyPayment(
    @Body()
    body: {
      orderId: string;
      razorpayPaymentId: string;
      razorpayOrderId: string;
      razorpaySignature: string;
    },
  ) {
    if (!body?.orderId || !body?.razorpayPaymentId) {
      throw new BadRequestException('Missing orderId or razorpayPaymentId');
    }
    return this.paymentsService.verifyPayment(body);
  }

  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Razorpay payment capture webhook' })
  async handleWebhook(
    @Req() req: Request & { rawBody?: Buffer },
    @Headers('x-razorpay-signature') signature?: string,
  ) {
    const rawBody = req.rawBody || JSON.stringify(req.body);
    return this.paymentsService.handleWebhook(rawBody, signature);
  }
}

