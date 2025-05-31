import { ShoppingCart } from 'src/domain/cart';
import { ShoppingCartItemMapper } from './shopping-cart-item.mapper';

export class ShoppingCartMapper {
  static toDomain(prismaShoppingCart: {
    id: number;
    userId: number;
    created_at: Date;
    updated_at: Date;
    items?: {
      id: number;
      cartId: number;
      productItemId: number;
      quantity: number;
      created_at: Date;
      updated_at: Date;
    }[];
  }): ShoppingCart {
    return new ShoppingCart(
      prismaShoppingCart.id,
      prismaShoppingCart.userId,
      prismaShoppingCart.items?.map((item) =>
        ShoppingCartItemMapper.toDomain(item),
      ),
      prismaShoppingCart.created_at,
      prismaShoppingCart.updated_at,
    );
  }

  static toPersistence(shoppingCart: ShoppingCart): {
    id: number;
    userId: number;
    created_at: Date;
    updated_at: Date;
  } {
    return {
      id: shoppingCart.id,
      userId: shoppingCart.userId,
      created_at: shoppingCart.createdAt,
      updated_at: shoppingCart.updatedAt,
    };
  }
}
