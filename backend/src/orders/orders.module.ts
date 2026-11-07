import { Module } from '@nestjs/common';
import { OrderValidationService } from './order-validation.service';
import { CartValidationService } from './cart-validation.service';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [InventoryModule],
  controllers: [CartController, OrdersController],
  providers: [
    OrderValidationService,
    CartValidationService,
    CartService,
    OrdersService,
  ],
  exports: [
    OrderValidationService,
    CartValidationService,
    CartService,
    OrdersService,
  ],
})
export class OrdersModule {}
