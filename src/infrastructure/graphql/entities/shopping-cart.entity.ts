import { ObjectType, Field, Int } from '@nestjs/graphql';
import { ShoppingCartItemType } from './shopping-cart-item.entity';
import { ShoppingCart as DomainShoppingCart } from 'src/domain/cart';
@ObjectType()
export class ShoppingCartType {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  userId: number;

  @Field(() => [ShoppingCartItemType], { nullable: true })
  items?: ShoppingCartItemType[];

  @Field()
  created_at: Date;

  @Field()
  updated_at: Date;
  static fromDomainToEntity(domainCart: DomainShoppingCart): ShoppingCartType {
    return {
      id: domainCart.id,
      userId: domainCart.userId,
      items: domainCart.items?.map((item) =>
        ShoppingCartItemType.fromDomainToEntity(item),
      ),
      created_at: domainCart.createdAt,
      updated_at: domainCart.updatedAt,
    };
  }
}
