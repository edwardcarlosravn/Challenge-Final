import { Inject, Injectable } from '@nestjs/common';
import { ShoppingCartRepository } from 'src/application/contracts/persistence/shopping-cart-repository.interface';
import { RemoveItemFromCartDto } from 'src/application/dto/shopping-cart/remove-item-from-cart.dto';

@Injectable()
export class RemoveItemFromCartUseCase {
  constructor(
    @Inject('ShoppingCartRepository')
    private readonly shoppingCartRepository: ShoppingCartRepository,
  ) {}

  async execute(dto: RemoveItemFromCartDto): Promise<void> {
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

    await this.shoppingCartRepository.removeItem(dto);
  }
}
