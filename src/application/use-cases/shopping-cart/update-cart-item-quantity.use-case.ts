import { Inject, Injectable } from '@nestjs/common';
import { ShoppingCartRepository } from 'src/application/contracts/persistence/shopping-cart-repository.interface';
import { ShoppingCartItem } from 'src/domain/cart-item';
import { UpdateCartItemDto } from 'src/application/dto/shopping-cart/update-cart-item.dto';

@Injectable()
export class UpdateCartItemQuantityUseCase {
  constructor(
    @Inject('ShoppingCartRepository')
    private readonly shoppingCartRepository: ShoppingCartRepository,
  ) {}

  async execute(dto: UpdateCartItemDto): Promise<ShoppingCartItem> {
    if (dto.quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }

    const cartItem = await this.shoppingCartRepository.findCartItemById(
      dto.cartItemId,
    );

    if (!cartItem) {
      throw new Error('Cart item not found');
    }

    const userCart = await this.shoppingCartRepository.findByUserId(dto.userId);

    if (!userCart || userCart.id !== cartItem.cartId) {
      throw new Error('Unauthorized: Cart item does not belong to user');
    }

    return await this.shoppingCartRepository.updateItemQuantity(dto);
  }
}
