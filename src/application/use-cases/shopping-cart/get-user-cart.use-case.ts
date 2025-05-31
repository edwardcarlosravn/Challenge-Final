import { Inject, Injectable } from '@nestjs/common';
import { ShoppingCartRepository } from 'src/application/contracts/persistence/shopping-cart-repository.interface';
import { ShoppingCart } from 'src/domain/cart';
import { GetUserCartDto } from 'src/application/dto/shopping-cart/get-user-cart.dto';

@Injectable()
export class GetUserCartUseCase {
  constructor(
    @Inject('ShoppingCartRepository')
    private readonly shoppingCartRepository: ShoppingCartRepository,
  ) {}

  async execute(dto: GetUserCartDto): Promise<ShoppingCart | null> {
    return await this.shoppingCartRepository.findByUserId(dto.userId);
  }
}
