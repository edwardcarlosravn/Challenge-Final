import { ObjectType, Field, ID, Float, Int } from '@nestjs/graphql';
import { ProductItemType } from './product-item.entity';
import { OrderLine as DomainOrderLine } from 'src/domain/order-line';
@ObjectType()
export class OrderLineType {
  @Field(() => ID)
  id: number;

  @Field(() => ID)
  orderId: string;

  @Field(() => Int)
  productItemId: number;

  @Field(() => Int)
  quantity: number;

  @Field(() => Float)
  price: number;

  @Field()
  created_at: Date;

  @Field(() => ProductItemType, { nullable: true })
  productItem?: ProductItemType;
  static fromDomainToEntity(domainOrderLine: DomainOrderLine): OrderLineType {
    return {
      id: domainOrderLine.id,
      orderId: domainOrderLine.orderId,
      productItemId: domainOrderLine.productItemId,
      quantity: domainOrderLine.quantity,
      price: domainOrderLine.price,
      created_at: domainOrderLine.createdAt,
    };
  }
}
