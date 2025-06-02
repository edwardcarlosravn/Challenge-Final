import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/persistence/prisma/prisma.service';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

@Injectable()
export class RedisStockAlert {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('stock-notifications') private stockQueue: Queue,
  ) {}

  async checkStockAndNotify(productItemId: number) {
    const productItem = await this.prisma.productItem.findUnique({
      where: { id: productItemId },
      include: {
        variation: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!productItem) {
      throw new Error('ProductItem not found');
    }

    if (productItem.stock <= 3) {
      const lastFavorite = await this.prisma.userFavorite.findFirst({
        where: {
          productItemId,
          user: {
            shopOrders: {
              none: {
                orderLines: {
                  some: {
                    productItemId: productItemId,
                  },
                },
              },
            },
          },
        },
        orderBy: { created_at: 'desc' },
        include: { user: true },
      });

      if (lastFavorite) {
        const existingAlert = await this.prisma.stockAlert.findFirst({
          where: {
            userId: lastFavorite.user.id,
            productItemId: productItemId,
          },
        });

        if (!existingAlert) {
          await this.stockQueue.add('notify-user', {
            userId: lastFavorite.user.id,
            productItemId,
          });

          await this.prisma.stockAlert.create({
            data: {
              userId: lastFavorite.user.id,
              productItemId: productItemId,
              notifiedAt: new Date(),
            },
          });
        } else {
          throw new Error(
            'Notification already sent to this user for this product',
          );
        }
      } else {
        throw new Error(
          'No eligible user found (no favorites or already purchased)',
        );
      }
    } else {
      throw new Error('Sufficient stock available, no notification required');
    }
  }
}
