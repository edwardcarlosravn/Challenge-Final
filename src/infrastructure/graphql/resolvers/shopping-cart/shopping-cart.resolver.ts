import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { SkipThrottle } from '@nestjs/throttler';
import { UseGuards } from '@nestjs/common';
import { GqlJwtAuthGuard } from '../../guards/gql-jwt-auth.guard';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { ShoppingCartType } from '../../entities/shopping-cart.entity';
import { ShoppingCartItemType } from '../../entities/shopping-cart-item.entity';
import { AddToCartInput } from '../../dto/shopping-cart/add-to-cart.input';
import { UpdateCartItemInput } from '../../dto/shopping-cart/update-cart-item.input';
import { RemoveFromCartInput } from '../../dto/shopping-cart/remove-from-cart.input';
import { GetUserCartUseCase } from 'src/application/use-cases/shopping-cart/get-user-cart.use-case';
import { AddItemToCartUseCase } from 'src/application/use-cases/shopping-cart/add-item-to-cart.use-case';
import { RemoveItemFromCartUseCase } from 'src/application/use-cases/shopping-cart/remove-item-from-cart.use-case';
import { UpdateCartItemQuantityUseCase } from 'src/application/use-cases/shopping-cart/update-cart-item-quantity.use-case';
import { ClearCartUseCase } from 'src/application/use-cases/shopping-cart/clear-cart.use-case';
import { CurrentUser as CurrentUserType } from '../../../http/controllers/auth/types/current-user';

@Resolver(() => ShoppingCartType)
export class ShoppingCartResolver {
  constructor(
    private readonly getUserCartUseCase: GetUserCartUseCase,
    private readonly addItemToCartUseCase: AddItemToCartUseCase,
    private readonly removeItemFromCartUseCase: RemoveItemFromCartUseCase,
    private readonly updateCartItemQuantityUseCase: UpdateCartItemQuantityUseCase,
    private readonly clearCartUseCase: ClearCartUseCase,
  ) {}
  @SkipThrottle()
  @Query(() => ShoppingCartType, { nullable: true })
  @UseGuards(GqlJwtAuthGuard)
  async myCart(
    @CurrentUser() user: CurrentUserType,
  ): Promise<ShoppingCartType | null> {
    const cart = await this.getUserCartUseCase.execute({ userId: user.id });

    if (!cart) {
      return null;
    }

    return ShoppingCartType.fromDomainToEntity(cart);
  }
  @SkipThrottle()
  @Mutation(() => ShoppingCartItemType)
  @UseGuards(GqlJwtAuthGuard)
  async addToCart(
    @Args('input') input: AddToCartInput,
    @CurrentUser() user: CurrentUserType,
  ): Promise<ShoppingCartItemType> {
    const cartItem = await this.addItemToCartUseCase.execute({
      userId: user.id,
      productItemId: input.productItemId,
      quantity: input.quantity,
    });

    return ShoppingCartItemType.fromDomainToEntity(cartItem);
  }
  @SkipThrottle()
  @Mutation(() => ShoppingCartItemType)
  @UseGuards(GqlJwtAuthGuard)
  async updateCartItemQuantity(
    @Args('input') input: UpdateCartItemInput,
    @CurrentUser() user: CurrentUserType,
  ): Promise<ShoppingCartItemType> {
    const cartItem = await this.updateCartItemQuantityUseCase.execute({
      cartItemId: input.cartItemId,
      quantity: input.quantity,
      userId: user.id,
    });

    return ShoppingCartItemType.fromDomainToEntity(cartItem);
  }
  @SkipThrottle()
  @Mutation(() => Boolean)
  @UseGuards(GqlJwtAuthGuard)
  async removeFromCart(
    @Args('input') input: RemoveFromCartInput,
    @CurrentUser() user: CurrentUserType,
  ): Promise<boolean> {
    await this.removeItemFromCartUseCase.execute({
      cartItemId: input.cartItemId,
      userId: user.id,
    });

    return true;
  }
  @SkipThrottle()
  @Mutation(() => Boolean)
  @UseGuards(GqlJwtAuthGuard)
  async clearCart(@CurrentUser() user: CurrentUserType): Promise<boolean> {
    await this.clearCartUseCase.execute({ userId: user.id });
    return true;
  }
}
