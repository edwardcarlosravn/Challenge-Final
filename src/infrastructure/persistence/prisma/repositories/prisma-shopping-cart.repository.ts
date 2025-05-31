import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ShoppingCartRepository } from 'src/application/contracts/persistence/shopping-cart-repository.interface';
import { ShoppingCart } from 'src/domain/cart';
import { ShoppingCartItem } from 'src/domain/cart-item';
import { ShoppingCartMapper } from '../mappers/shopping-cart.mapper';
import { ShoppingCartItemMapper } from '../mappers/shopping-cart-item.mapper';
import { CreateShoppingCartDto } from 'src/application/dto/shopping-cart/create-shopping-cart.dto';
import { AddItemToCartDto } from 'src/application/dto/shopping-cart/add-item-to-cart.dto';
import { UpdateCartItemDto } from 'src/application/dto/shopping-cart/update-cart-item.dto';
import { RemoveItemFromCartDto } from 'src/application/dto/shopping-cart/remove-item-from-cart.dto';
import { ErrorHandlerService } from 'src/infrastructure/common/error-handler.service';
@Injectable()
export class PrismaShoppingCartRepository implements ShoppingCartRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly errorHandler: ErrorHandlerService,
  ) {}

  async findByUserId(userId: number): Promise<ShoppingCart | null> {
    const cart = await this.prisma.shoppingCart.findFirst({
      where: {
        userId,
      },
      include: {
        items: {
          orderBy: {
            created_at: 'desc',
          },
        },
      },
    });

    if (!cart) {
      return null;
    }

    return ShoppingCartMapper.toDomain(cart);
  }

  async createForUser(data: CreateShoppingCartDto): Promise<ShoppingCart> {
    const cart = await this.prisma.shoppingCart.create({
      data: {
        userId: data.userId,
      },
      include: {
        items: true,
      },
    });

    return ShoppingCartMapper.toDomain(cart);
  }

  async addItem(data: AddItemToCartDto): Promise<ShoppingCartItem> {
    try {
      let cart = await this.findByUserId(data.userId);

      if (!cart) {
        cart = await this.createForUser({ userId: data.userId });
      }

      const existingItem = await this.findCartItemByProductItem(
        cart.id,
        data.productItemId,
      );

      if (existingItem) {
        const updatedItem = await this.prisma.shoppingCartItem.update({
          where: {
            id: existingItem.id,
          },
          data: {
            quantity: existingItem.quantity + data.quantity,
            updated_at: new Date(),
          },
        });

        return ShoppingCartItemMapper.toDomain(updatedItem);
      } else {
        const newItem = await this.prisma.shoppingCartItem.create({
          data: {
            cartId: cart.id,
            productItemId: data.productItemId,
            quantity: data.quantity,
          },
        });

        return ShoppingCartItemMapper.toDomain(newItem);
      }
    } catch (error) {
      this.errorHandler.handleDatabaseError(error, 'addItem');
    }
  }

  async removeItem(data: RemoveItemFromCartDto): Promise<void> {
    try {
      await this.prisma.shoppingCartItem.delete({
        where: {
          id: data.cartItemId,
        },
      });
    } catch (error) {
      this.errorHandler.handleDatabaseError(error, 'removeItem');
    }
  }

  async updateItemQuantity(data: UpdateCartItemDto): Promise<ShoppingCartItem> {
    try {
      const updatedItem = await this.prisma.shoppingCartItem.update({
        where: {
          id: data.cartItemId,
        },
        data: {
          quantity: data.quantity,
          updated_at: new Date(),
        },
      });
      return ShoppingCartItemMapper.toDomain(updatedItem);
    } catch (error) {
      this.errorHandler.handleDatabaseError(error, 'updateItemQuantity');
    }
  }

  async clearCart(userId: number): Promise<void> {
    const cart = await this.findByUserId(userId);

    if (cart) {
      await this.prisma.shoppingCartItem.deleteMany({
        where: {
          cartId: cart.id,
        },
      });
    }
  }

  async findCartItemById(cartItemId: number): Promise<ShoppingCartItem | null> {
    const item = await this.prisma.shoppingCartItem.findUnique({
      where: {
        id: cartItemId,
      },
    });

    if (!item) {
      return null;
    }

    return ShoppingCartItemMapper.toDomain(item);
  }

  async findCartItemByProductItem(
    cartId: number,
    productItemId: number,
  ): Promise<ShoppingCartItem | null> {
    const item = await this.prisma.shoppingCartItem.findFirst({
      where: {
        cartId,
        productItemId,
      },
    });

    if (!item) {
      return null;
    }

    return ShoppingCartItemMapper.toDomain(item);
  }
}
