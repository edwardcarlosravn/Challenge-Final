import { Order } from 'src/domain/order';
import { OrderStatus } from 'src/domain/enums/order-status.enum';
import { CreateOrderFromCartDto } from 'src/application/dto/orders/create-order-from-cart.dto';
import { GetUserOrdersDto } from 'src/application/dto/orders/get-user-orders.dto';

export interface PaginatedResponse<T> {
  data: T[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface OrderRepository {
  createFromCart(data: CreateOrderFromCartDto): Promise<Order>;
  findOrders(dto: GetUserOrdersDto): Promise<PaginatedResponse<Order>>;
  getOrder(orderId: string): Promise<Order | null>;
  updateStatus(orderId: string, status: OrderStatus): Promise<Order>;
  getOrderOrThrow(orderId: string): Promise<Order>;
}
