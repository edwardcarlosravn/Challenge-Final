import { Injectable, Inject } from '@nestjs/common';
import { OrderRepository } from 'src/application/contracts/persistence/order-repository.interface';
import { Order } from 'src/domain/order';
import { CreateOrderFromCartDto } from 'src/application/dto/orders/create-order-from-cart.dto';

@Injectable()
export class CreateOrderFromCartUseCase {
  constructor(
    @Inject('OrderRepository')
    private readonly orderRepository: OrderRepository,
  ) {}

  async execute(dto: CreateOrderFromCartDto): Promise<Order> {
    if (!dto.shippingAddress || dto.shippingAddress.trim().length === 0) {
      throw new Error('Shipping address is required');
    }

    if (dto.shippingAddress.length > 100) {
      throw new Error('Shipping address cannot exceed 100 characters');
    }

    return await this.orderRepository.createFromCart(dto);
  }
}
