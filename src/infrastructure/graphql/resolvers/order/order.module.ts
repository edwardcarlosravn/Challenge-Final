import { Module } from '@nestjs/common';
import { OrderResolver } from './order.resolver';
import { PrismaModule } from 'src/infrastructure/persistence/prisma/prisma.module';
import { CommonModule } from 'src/infrastructure/common/common.module';
import { CreateOrderFromCartUseCase } from 'src/application/use-cases/order/create-order-from-cart.use-case';
import { GetUserOrdersUseCase } from 'src/application/use-cases/order/get-user-orders.use-case';
import { GetOrderDetailsUseCase } from 'src/application/use-cases/order/get-order-details.use-case';
import { UpdateOrderStatusUseCase } from 'src/application/use-cases/order/update-order-status.use-case';

@Module({
  imports: [PrismaModule, CommonModule],
  providers: [
    OrderResolver,
    CreateOrderFromCartUseCase,
    GetUserOrdersUseCase,
    GetOrderDetailsUseCase,
    UpdateOrderStatusUseCase,
  ],
  exports: [
    CreateOrderFromCartUseCase,
    GetUserOrdersUseCase,
    GetOrderDetailsUseCase,
    UpdateOrderStatusUseCase,
  ],
})
export class OrderModule {}
