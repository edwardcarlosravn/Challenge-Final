import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { OrderRepository } from 'src/application/contracts/persistence/order-repository.interface';
import { Order } from 'src/domain/order';
import { GetOrderByIdDto } from 'src/application/dto/orders/get-orderbyId.dto';

@Injectable()
export class GetOrderDetailsUseCase {
  constructor(
    @Inject('OrderRepository')
    private readonly orderRepository: OrderRepository,
  ) {}

  async execute(dto: GetOrderByIdDto): Promise<Order> {
    const order = await this.orderRepository.getOrder(dto.orderId);

    if (!order) {
      throw new NotFoundException(`Order with id ${dto.orderId} not found`);
    }
    if (order.userId !== dto.userId) {
      throw new Error('Unauthorized: Order does not belong to user');
    }

    return order;
  }
}
