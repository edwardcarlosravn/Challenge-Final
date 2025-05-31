import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { OrderRepository } from 'src/application/contracts/persistence/order-repository.interface';
import { Order } from 'src/domain/order';
import { UpdateOrderStatusDto } from 'src/application/dto/orders/update-order-status.dto';

@Injectable()
export class UpdateOrderStatusUseCase {
  constructor(
    @Inject('OrderRepository')
    private readonly orderRepository: OrderRepository,
  ) {}

  async execute(dto: UpdateOrderStatusDto): Promise<Order> {
    const existingOrder = await this.orderRepository.getOrder(dto.orderId);

    if (!existingOrder) {
      throw new NotFoundException(`Order with id ${dto.orderId} not found`);
    }

    return await this.orderRepository.updateStatus(dto.orderId, dto.newStatus);
  }
}
