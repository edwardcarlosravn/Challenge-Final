import { ObjectType, Field, Int } from '@nestjs/graphql';
import { ShoppingCartItem as DomainShoppingCartItem } from 'src/domain/cart-item';
@ObjectType()
export class ShoppingCartItemType {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  cartId: number;

  @Field(() => Int)
  productItemId: number;

  @Field(() => Int)
  quantity: number;

  @Field()
  created_at: Date;

  @Field()
  updated_at: Date;

  static fromDomainToEntity(
    domainItem: DomainShoppingCartItem,
  ): ShoppingCartItemType {
    return {
      id: domainItem.id,
      cartId: domainItem.cartId,
      productItemId: domainItem.productItemId,
      quantity: domainItem.quantity,
      created_at: domainItem.createdAt,
      updated_at: domainItem.updatedAt,
    };
  }
}
