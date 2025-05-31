import { ObjectType, Field, ID } from '@nestjs/graphql';
import { ProductItemType } from './product-item.entity';
import { ProductVariation as DomainVariation } from 'src/domain/variation';
import { VariationImageType } from './variation-image.entity';

@ObjectType()
export class ProductVariationType {
  @Field(() => ID)
  id: string;

  @Field()
  productId: string;

  @Field()
  isActive: boolean;

  @Field(() => [ProductItemType], { nullable: true })
  items?: ProductItemType[];

  @Field(() => [VariationImageType], { nullable: true })
  images?: VariationImageType[];

  static fromDomainToEntity(
    domainVariation: DomainVariation,
  ): ProductVariationType {
    return {
      id: domainVariation.id,
      productId: domainVariation.productId,
      isActive: domainVariation.isActive,
      items:
        domainVariation.items?.map((item) =>
          ProductItemType.fromDomainToEntity(item),
        ) || [],
      images:
        domainVariation.images?.map((image) =>
          VariationImageType.fromDomainToEntity(image),
        ) || [],
    };
  }
}
