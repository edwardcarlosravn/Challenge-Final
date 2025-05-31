import { Inject, Injectable } from '@nestjs/common';
import { ShoppingCartRepository } from 'src/application/contracts/persistence/shopping-cart-repository.interface';
import { ShoppingCartItem } from 'src/domain/cart-item';
import { AddItemToCartDto } from 'src/application/dto/shopping-cart/add-item-to-cart.dto';

@Injectable()
export class AddItemToCartUseCase {
  constructor(
    @Inject('ShoppingCartRepository')
    private readonly shoppingCartRepository: ShoppingCartRepository,
  ) {}

  async execute(dto: AddItemToCartDto): Promise<ShoppingCartItem> {
    if (dto.quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }
    return await this.shoppingCartRepository.addItem(dto);
  }
}
