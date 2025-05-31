import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PrismaCategoryRepository } from './repositories/prisma-category.repository';
import { PrismaProductRepository } from './repositories/prisma-product.repository';
import { PrismaVariationRepository } from './repositories/prisma-variation.repository';
import { PrismaVariationImageRepository } from './repositories/prisma-image.repository';
import { PrismaShoppingCartRepository } from './repositories/prisma-shopping-cart.repository';
import { PrismaOrderRepository } from './repositories/prisma-order-repository';
import { PrismaPaymentRepository } from './repositories/prisma-payment.repository';
import { PrismaProductItemRepository } from './repositories/prisma-product-item.repository';
import { PrismaUserFavoriteRepository } from './repositories/prisma-favorite.repository';
@Module({
  providers: [
    PrismaService,
    {
      provide: 'CategoryRepository',
      useClass: PrismaCategoryRepository,
    },
    {
      provide: 'ProductRepository',
      useClass: PrismaProductRepository,
    },
    {
      provide: 'VariationRepository',
      useClass: PrismaVariationRepository,
    },
    {
      provide: 'VariationImageRepository',
      useClass: PrismaVariationImageRepository,
    },
    {
      provide: 'ShoppingCartRepository',
      useClass: PrismaShoppingCartRepository,
    },
    {
      provide: 'OrderRepository',
      useClass: PrismaOrderRepository,
    },
    {
      provide: 'PaymentRepository',
      useClass: PrismaPaymentRepository,
    },
    {
      provide: 'ProductItemRepository',
      useClass: PrismaProductItemRepository,
    },
    {
      provide: 'UserFavoriteRepository',
      useClass: PrismaUserFavoriteRepository,
    },
  ],
  exports: [
    PrismaService,
    'CategoryRepository',
    'ProductRepository',
    'VariationRepository',
    'VariationImageRepository',
    'ShoppingCartRepository',
    'OrderRepository',
    'PaymentRepository',
    'ProductItemRepository',
    'UserFavoriteRepository',
  ],
})
export class PrismaModule {}
