import { registerEnumType } from '@nestjs/graphql';

export enum OrderStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

registerEnumType(OrderStatus, {
  name: 'OrderStatus',
  description: 'The status of an order',
});
