import { ObjectType, Field } from '@nestjs/graphql';
import { OrderType } from '../../entities/order.entity';
import { PaginationMetadata } from '../../entities/pagination.entity';

@ObjectType()
export class PaginatedOrderResponse {
  @Field(() => [OrderType])
  data: OrderType[];

  @Field(() => PaginationMetadata)
  metadata: PaginationMetadata;
}
