import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../persistence/prisma/prisma.service';

export interface CartItemWithCurrentPrice {
  productItemId: number;
  quantity: number;
  currentPrice: number;
  lineTotal: number;
}

@Injectable()
export class PriceInterceptorService {
  constructor(private readonly prisma: PrismaService) {}

  async getCartItemsWithCurrentPrices(
    cartItems: Array<{
      productItemId: number;
      quantity: number;
    }>,
  ): Promise<CartItemWithCurrentPrice[]> {
    const result: CartItemWithCurrentPrice[] = [];

    for (const item of cartItems) {
      const productItem = await this.prisma.productItem.findUnique({
        where: { id: item.productItemId },
        select: { price: true, stock: true },
      });

      if (!productItem) {
        throw new Error(`Product item ${item.productItemId} not found`);
      }

      const currentPrice = Number(productItem.price);
      const lineTotal = currentPrice * item.quantity;

      result.push({
        productItemId: item.productItemId,
        quantity: item.quantity,
        currentPrice: currentPrice,
        lineTotal: lineTotal,
      });
    }

    return result;
  }

  async calculateOrderTotal(
    cartItems: Array<{
      productItemId: number;
      quantity: number;
    }>,
  ): Promise<number> {
    const itemsWithPrices = await this.getCartItemsWithCurrentPrices(cartItems);
    return itemsWithPrices.reduce((total, item) => total + item.lineTotal, 0);
  }
  async validateProductItemsExist(productItemIds: number[]): Promise<void> {
    const existingItems = await this.prisma.productItem.findMany({
      where: { id: { in: productItemIds } },
      select: { id: true },
    });

    const missingIds = productItemIds.filter(
      (id) => !existingItems.some((item) => item.id === id),
    );

    if (missingIds.length > 0) {
      throw new Error(`Product items not found: ${missingIds.join(', ')}`);
    }
  }
}
