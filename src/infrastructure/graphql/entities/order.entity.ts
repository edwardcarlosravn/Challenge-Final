import { ObjectType, Field, ID, Float, Int } from '@nestjs/graphql';
import { OrderLineType } from './order-line.entity';
import { OrderStatus } from '../dto/order/order-status.enum.input';
import { Order as DomainOrder } from 'src/domain/order';
@ObjectType()
export class OrderType {
  @Field(() => ID)
  id: string;

  @Field(() => Int)
  userId: number;

  @Field()
  shippingAddress: string;

  @Field(() => OrderStatus)
  orderStatus: OrderStatus;

  @Field()
  orderDate: Date;

  @Field(() => Float)
  orderTotal: number;

  @Field(() => [OrderLineType], { nullable: true })
  orderLines?: OrderLineType[];

  @Field()
  created_at: Date;

  @Field()
  updated_at: Date;
  static fromDomainToEntity(domainOrder: DomainOrder): OrderType {
    return {
      id: domainOrder.id,
      userId: domainOrder.userId,
      shippingAddress: domainOrder.shippingAddress,
      orderStatus: domainOrder.orderStatus as OrderStatus,
      orderDate: domainOrder.orderDate,
      orderTotal: domainOrder.orderTotal,
      orderLines: domainOrder.orderLines?.map((line) =>
        OrderLineType.fromDomainToEntity(line),
      ),
      created_at: domainOrder.createdAt,
      updated_at: domainOrder.updatedAt,
    };
  }
}
