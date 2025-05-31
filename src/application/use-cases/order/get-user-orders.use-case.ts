import { Injectable, Inject } from '@nestjs/common';
import {
  OrderRepository,
  PaginatedResponse,
} from 'src/application/contracts/persistence/order-repository.interface';
import { Order } from 'src/domain/order';
import { GetUserOrdersDto } from 'src/application/dto/orders/get-user-orders.dto';

@Injectable()
export class GetUserOrdersUseCase {
  constructor(
    @Inject('OrderRepository')
    private readonly orderRepository: OrderRepository,
  ) {}

  async execute(dto: GetUserOrdersDto): Promise<PaginatedResponse<Order>> {
    const paginationDto = {
      ...dto,
      page: dto.page ?? 1,
      pageSize: dto.pageSize ?? 10,
      sortOrder: dto.sortOrder ?? 'desc',
    };

    if ((paginationDto.page ?? 1) < 1) {
      throw new Error('Page must be greater than 0');
    }

    if (paginationDto.pageSize < 1 || paginationDto.pageSize > 100) {
      throw new Error('Page size must be between 1 and 100');
    }

    if (dto.startDate && dto.endDate && dto.startDate > dto.endDate) {
      throw new Error('Start date cannot be after end date');
    }

    return await this.orderRepository.findOrders(paginationDto);
  }
}
