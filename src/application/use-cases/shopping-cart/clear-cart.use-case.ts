import { Inject, Injectable } from '@nestjs/common';
import { ShoppingCartRepository } from 'src/application/contracts/persistence/shopping-cart-repository.interface';
import { GetUserCartDto } from 'src/application/dto/shopping-cart/get-user-cart.dto';

@Injectable()
export class ClearCartUseCase {
  constructor(
    @Inject('ShoppingCartRepository')
    private readonly shoppingCartRepository: ShoppingCartRepository,
  ) {}

  async execute(dto: GetUserCartDto): Promise<void> {
    const userCart = await this.shoppingCartRepository.findByUserId(dto.userId);

    if (!userCart) {
      throw new Error('User does not have a cart');
    }

    await this.shoppingCartRepository.clearCart(dto.userId);
  }
}
