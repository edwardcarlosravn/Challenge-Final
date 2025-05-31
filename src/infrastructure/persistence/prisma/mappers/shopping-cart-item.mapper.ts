import { ShoppingCartItem } from 'src/domain/cart-item';

export class ShoppingCartItemMapper {
  static toDomain(prismaShoppingCartItem: {
    id: number;
    cartId: number;
    productItemId: number;
    quantity: number;
    created_at: Date;
    updated_at: Date;
  }): ShoppingCartItem {
    return new ShoppingCartItem(
      prismaShoppingCartItem.id,
      prismaShoppingCartItem.cartId,
      prismaShoppingCartItem.productItemId,
      prismaShoppingCartItem.quantity,
      prismaShoppingCartItem.created_at,
      prismaShoppingCartItem.updated_at,
    );
  }

  static toPrisma(shoppingCartItem: ShoppingCartItem): {
    id: number;
    cartId: number;
    productItemId: number;
    quantity: number;
    created_at: Date;
    updated_at: Date;
  } {
    return {
      id: shoppingCartItem.id,
      cartId: shoppingCartItem.cartId,
      productItemId: shoppingCartItem.productItemId,
      quantity: shoppingCartItem.quantity,
      created_at: shoppingCartItem.createdAt,
      updated_at: shoppingCartItem.updatedAt,
    };
  }
}
