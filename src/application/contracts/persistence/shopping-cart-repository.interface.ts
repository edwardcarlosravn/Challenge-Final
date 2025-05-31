import { ShoppingCart } from 'src/domain/cart';
import { ShoppingCartItem } from 'src/domain/cart-item';
import { CreateShoppingCartDto } from 'src/application/dto/shopping-cart/create-shopping-cart.dto';
import { AddItemToCartDto } from 'src/application/dto/shopping-cart/add-item-to-cart.dto';
import { UpdateCartItemDto } from 'src/application/dto/shopping-cart/update-cart-item.dto';
import { RemoveItemFromCartDto } from 'src/application/dto/shopping-cart/remove-item-from-cart.dto';

export interface ShoppingCartRepository {
  findByUserId(userId: number): Promise<ShoppingCart | null>;

  createForUser(data: CreateShoppingCartDto): Promise<ShoppingCart>;

  addItem(data: AddItemToCartDto): Promise<ShoppingCartItem>;

  removeItem(data: RemoveItemFromCartDto): Promise<void>;

  updateItemQuantity(data: UpdateCartItemDto): Promise<ShoppingCartItem>;

  clearCart(userId: number): Promise<void>;

  findCartItemById(cartItemId: number): Promise<ShoppingCartItem | null>;

  findCartItemByProductItem(
    cartId: number,
    productItemId: number,
  ): Promise<ShoppingCartItem | null>;
}
