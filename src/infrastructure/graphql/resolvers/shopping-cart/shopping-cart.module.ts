import { Module } from '@nestjs/common';
import { ShoppingCartResolver } from './shopping-cart.resolver';
import { GetUserCartUseCase } from 'src/application/use-cases/shopping-cart/get-user-cart.use-case';
import { AddItemToCartUseCase } from 'src/application/use-cases/shopping-cart/add-item-to-cart.use-case';
import { RemoveItemFromCartUseCase } from 'src/application/use-cases/shopping-cart/remove-item-from-cart.use-case';
import { UpdateCartItemQuantityUseCase } from 'src/application/use-cases/shopping-cart/update-cart-item-quantity.use-case';
import { ClearCartUseCase } from 'src/application/use-cases/shopping-cart/clear-cart.use-case';
import { PrismaModule } from 'src/infrastructure/persistence/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [
    ShoppingCartResolver,
    GetUserCartUseCase,
    AddItemToCartUseCase,
    RemoveItemFromCartUseCase,
    UpdateCartItemQuantityUseCase,
    ClearCartUseCase,
  ],
  exports: [
    GetUserCartUseCase,
    AddItemToCartUseCase,
    RemoveItemFromCartUseCase,
    UpdateCartItemQuantityUseCase,
    ClearCartUseCase,
  ],
})
export class ShoppingCartModule {}
