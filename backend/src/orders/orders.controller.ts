import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService, PlaceOrderDto } from './orders.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/constants';
import { OrderStatus } from '@prisma/client';

@ApiTags('Orders')
@ApiBearerAuth('access-token')
@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('orders')
  @ApiOperation({ summary: 'Place a new order atomically' })
  async placeOrder(
    @CurrentUser() user: { id: string },
    @Body() dto: PlaceOrderDto,
  ) {
    return this.ordersService.placeOrder(user.id, dto);
  }

  @Get('orders')
  @ApiOperation({ summary: "Get customer's orders" })
  async getUserOrders(@CurrentUser() user: { id: string }) {
    return this.ordersService.getUserOrders(user.id);
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'Get order details by ID' })
  async getOrderById(
    @CurrentUser() user: { id: string; role: Role },
    @Param('id') orderId: string,
  ) {
    const isAdmin = user.role === Role.ADMIN;
    return this.ordersService.getOrderById(orderId, user.id, isAdmin);
  }

  @Patch('orders/:id/cancel')
  @ApiOperation({ summary: 'Cancel order' })
  async cancelOrder(
    @CurrentUser() user: { id: string; role: Role },
    @Param('id') orderId: string,
  ) {
    const isAdmin = user.role === Role.ADMIN;
    return this.ordersService.cancelOrder(orderId, user.id, isAdmin);
  }

  @Patch('orders/:id/return')
  @ApiOperation({ summary: 'Request return for delivered order' })
  async requestReturn(
    @CurrentUser() user: { id: string },
    @Param('id') orderId: string,
  ) {
    return this.ordersService.requestReturn(orderId, user.id);
  }

  // --- ADMIN ROUTES ---

  @Get('admin/orders')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'List all orders (Admin)' })
  async getAdminOrders(
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.ordersService.getAdminOrders({ status, page, limit });
  }

  @Get('orders/admin/all')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'List all orders alias for admin client (Admin)' })
  async getAdminOrdersAll(
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.ordersService.getAdminOrders({ status, page, limit });
  }

  @Get('invoices/:id')
  @ApiOperation({ summary: 'Get invoice data for order' })
  async getInvoice(
    @CurrentUser() user: { id: string; role: Role },
    @Param('id') orderId: string,
  ) {
    const isAdmin = user.role === Role.ADMIN;
    const order = await this.ordersService.getOrderById(orderId, user.id, isAdmin);
    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      customer: order.user,
      shippingAddress: order.shippingAddress,
      items: order.items,
      subtotal: order.subtotal,
      shippingAmount: order.shippingAmount,
      discountAmount: order.discountAmount,
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
    };
  }

  @Patch('orders/:id/status')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update order status (Admin)' })
  async updateStatus(
    @Param('id') orderId: string,
    @Body() body: { status: OrderStatus; trackingNumber?: string },
  ) {
    return this.ordersService.updateOrderStatus(orderId, body.status, body.trackingNumber);
  }

  @Patch('admin/orders/:id/status')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update order status alias (Admin)' })
  async updateAdminStatus(
    @Param('id') orderId: string,
    @Body() body: { status: OrderStatus; trackingNumber?: string },
  ) {
    return this.ordersService.updateOrderStatus(orderId, body.status, body.trackingNumber);
  }
}

