import { OrderStatus } from 'src/domain/enums/order-status.enum';

export interface GetUserOrdersDto {
  userId: number;

  status?: OrderStatus;

  page?: number;
  pageSize?: number;
  sortOrder?: 'asc' | 'desc';

  startDate?: Date;
  endDate?: Date;
}
