import { Module } from '@nestjs/common';
import { PaymentEventService } from './payment-event.service';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [InventoryModule],
  controllers: [PaymentsController],
  providers: [PaymentEventService, PaymentsService],
  exports: [PaymentEventService, PaymentsService],
})
export class PaymentsModule {}
