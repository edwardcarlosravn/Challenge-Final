import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../persistence/prisma/prisma.service';

export interface StockValidationResult {
  isValid: boolean;
  insufficientStockItems: Array<{
    productItemId: number;
    sku: string;
    requested: number;
    available: number;
  }>;
}

@Injectable()
export class StockValidatorService {
  constructor(private readonly prisma: PrismaService) {}
  async validateCartStock(
    cartItems: Array<{
      productItemId: number;
      quantity: number;
    }>,
  ): Promise<StockValidationResult> {
    const productItemIds = cartItems.map((item) => item.productItemId);

    const productItems = await this.prisma.productItem.findMany({
      where: { id: { in: productItemIds } },
      select: { id: true, stock: true, sku: true },
    });

    const insufficientStockItems: StockValidationResult['insufficientStockItems'] =
      [];

    for (const item of cartItems) {
      const productItem = productItems.find((p) => p.id === item.productItemId);

      if (!productItem) {
        throw new Error(`Product item ${item.productItemId} not found`);
      }

      if (productItem.stock < item.quantity) {
        insufficientStockItems.push({
          productItemId: item.productItemId,
          sku: productItem.sku,
          requested: item.quantity,
          available: productItem.stock,
        });
      }
    }

    return {
      isValid: insufficientStockItems.length === 0,
      insufficientStockItems,
    };
  }
}
