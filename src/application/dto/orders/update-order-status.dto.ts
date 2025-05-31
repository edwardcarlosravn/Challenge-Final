import { OrderStatus } from 'src/infrastructure/graphql/dto/order/order-status.enum.input';

export interface UpdateOrderStatusDto {
  orderId: string;
  newStatus: OrderStatus;
}
