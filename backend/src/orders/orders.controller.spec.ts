import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrderStatus } from '@prisma/client';
import { Role } from '../common/constants';

describe('OrdersController (Unit Tests)', () => {
  let controller: OrdersController;
  let service: OrdersService;

  beforeEach(() => {
    service = {
      placeOrder: jest.fn().mockResolvedValue({
        id: 'ord_1',
        orderNumber: 'ORD-123',
        totalAmount: 2499,
        status: OrderStatus.PENDING,
      }),
      getUserOrders: jest.fn().mockResolvedValue([
        { id: 'ord_1', orderNumber: 'ORD-123', totalAmount: 2499 },
      ]),
      getOrderById: jest.fn().mockImplementation((id: string) =>
        Promise.resolve({ id, orderNumber: 'ORD-123', totalAmount: 2499 }),
      ),
      cancelOrder: jest.fn().mockResolvedValue({
        id: 'ord_1',
        status: OrderStatus.CANCELLED,
      }),
      requestReturn: jest.fn().mockResolvedValue({
        id: 'ord_1',
        status: OrderStatus.RETURNED,
      }),
      getAdminOrders: jest.fn().mockResolvedValue({
        data: [{ id: 'ord_1', orderNumber: 'ORD-123' }],
        total: 1,
        page: 1,
        pages: 1,
      }),
      updateOrderStatus: jest.fn().mockResolvedValue({
        id: 'ord_1',
        status: OrderStatus.SHIPPED,
      }),
    } as unknown as OrdersService;

    controller = new OrdersController(service);
  });

  it('POST /orders places order atomically for current user', async () => {
    const res = await controller.placeOrder({ id: 'user_1' }, { addressId: 'addr_1' });
    expect(res.id).toBe('ord_1');
    expect(service.placeOrder).toHaveBeenCalledWith('user_1', { addressId: 'addr_1' });
  });

  it('GET /orders retrieves customer orders', async () => {
    const res = await controller.getUserOrders({ id: 'user_1' });
    expect(res).toHaveLength(1);
    expect(service.getUserOrders).toHaveBeenCalledWith('user_1');
  });

  it('PATCH /orders/:id/cancel cancels order and triggers restock', async () => {
    const res = await controller.cancelOrder({ id: 'user_1', role: Role.CUSTOMER }, 'ord_1');
    expect(res.status).toBe(OrderStatus.CANCELLED);
    expect(service.cancelOrder).toHaveBeenCalledWith('ord_1', 'user_1', false);
  });

  it('GET /admin/orders retrieves paginated admin orders', async () => {
    const res = await controller.getAdminOrders('all', 1, 20);
    expect(res.data).toHaveLength(1);
    expect(service.getAdminOrders).toHaveBeenCalledWith({ status: 'all', page: 1, limit: 20 });
  });
});

