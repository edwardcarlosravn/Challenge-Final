import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ErrorHandlerService } from 'src/infrastructure/common/error-handler.service';
import { ProductItemRepository } from 'src/application/contracts/persistence/productItem-repository.interface';
import { ProductItem } from 'src/domain/product-item';
import { ProductItemMapper } from '../mappers/producItem.mapper';

@Injectable()
export class PrismaProductItemRepository implements ProductItemRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly errorHandler: ErrorHandlerService,
  ) {}

  async findById(id: number): Promise<ProductItem | null> {
    try {
      const productItem = await this.prisma.productItem.findUnique({
        where: { id },
        include: {
          variation: true,
          attributes: {
            include: {
              attributeValue: {
                include: {
                  attribute: true,
                },
              },
            },
          },
        },
      });

      return productItem ? ProductItemMapper.toDomain(productItem) : null;
    } catch (error) {
      this.errorHandler.handleDatabaseError(error, 'findById');
    }
  }

  async deleteById(id: number): Promise<void> {
    try {
      const productItem = await this.findById(id);

      if (!productItem) {
        throw new Error(`ProductItem with ID ${id} not found`);
      }

      const itemRelations = await this.prisma.productItem.findUnique({
        where: { id },
        select: {
          orderLines: { select: { id: true } },
          cartItems: { select: { id: true } },
          favorites: { select: { id: true } },
        },
      });

      await this.prisma.$transaction(async (tx) => {
        if ((itemRelations?.orderLines?.length ?? 0) > 0) {
          await tx.orderLine.deleteMany({
            where: { productItemId: id },
          });
        }
        if ((itemRelations?.cartItems?.length ?? 0) > 0) {
          await tx.shoppingCartItem.deleteMany({
            where: { productItemId: id },
          });
        }
        if ((itemRelations?.favorites?.length ?? 0) > 0) {
          await tx.userFavorite.deleteMany({
            where: { productItemId: id },
          });
        }
        await tx.stockAlert.deleteMany({
          where: { productItemId: id },
        });
        await tx.productItemAttribute.deleteMany({
          where: { productItemId: id },
        });
        await tx.productItem.delete({
          where: { id },
        });
      });
    } catch (error) {
      this.errorHandler.handleDatabaseError(error, 'deleteById');
    }
  }
}
