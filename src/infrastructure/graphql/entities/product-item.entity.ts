import { ObjectType, Field, ID, Float, Int } from '@nestjs/graphql';
import { ProductItem as DomainProductItem } from 'src/domain/product-item';
@ObjectType()
export class ProductItemAttributeType {
  @Field(() => Int)
  attributeValueId: number;

  @Field({ nullable: true })
  value?: string;

  @Field({ nullable: true })
  attributeName?: string;
}

@ObjectType()
export class ProductItemType {
  @Field(() => ID)
  id: string;

  @Field()
  variationId: string;

  @Field()
  sku: string;

  @Field(() => Float)
  price: number;

  @Field(() => Int)
  stock: number;

  @Field(() => [ProductItemAttributeType], { nullable: 'itemsAndList' })
  attributes?: ProductItemAttributeType[];
  static fromDomainToEntity(
    domainProductItem: DomainProductItem,
  ): ProductItemType {
    return {
      id: domainProductItem.id.toString(),
      variationId: domainProductItem.variationId,
      sku: domainProductItem.sku,
      price: domainProductItem.price,
      stock: domainProductItem.stock,
      attributes: domainProductItem.attributes || [],
    };
  }
}
