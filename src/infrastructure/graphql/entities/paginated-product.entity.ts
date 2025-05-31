import { ObjectType, Field } from '@nestjs/graphql';
import { ProductType } from './product.entity';
import { PaginationMetadata } from './pagination.entity';

@ObjectType()
export class PaginatedProductResponse {
  @Field(() => [ProductType])
  data: ProductType[];

  @Field(() => PaginationMetadata)
  metadata: PaginationMetadata;
}
