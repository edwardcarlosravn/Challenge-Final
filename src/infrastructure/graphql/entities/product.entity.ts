import { ObjectType, Field, ID } from '@nestjs/graphql';
import { CategoryType } from './category.entity';
import { ProductVariationType } from './variation.entity';
import { Product as DomainProduct } from 'src/domain/product';
@ObjectType()
export class ProductType {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => [CategoryType], { nullable: true })
  categories?: CategoryType[];

  @Field()
  is_active: boolean;

  @Field()
  created_at: Date;

  @Field()
  updated_at: Date;

  @Field(() => [ProductVariationType], { nullable: true })
  variations?: ProductVariationType[];

  static fromDomainToEntity(domainProduct: DomainProduct): ProductType {
    return {
      id: domainProduct.id,
      name: domainProduct.name,
      description:
        domainProduct.description === null
          ? undefined
          : domainProduct.description,
      is_active: domainProduct.isActive,
      created_at: domainProduct.createdAt,
      updated_at: domainProduct.updatedAt,
      variations: domainProduct.variations?.map((variation) =>
        ProductVariationType.fromDomainToEntity(variation),
      ),
    };
  }
}
