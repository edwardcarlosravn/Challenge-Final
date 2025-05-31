import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ErrorHandlerService } from 'src/infrastructure/common/error-handler.service';
import { UserFavoriteRepository } from 'src/application/contracts/persistence/favorite-repository.interface';
import { UserFavorite } from 'src/domain/favorite';
import { UserFavoriteMapper } from '../mappers/favorite.mapper';
import { AddFavoriteDto } from 'src/application/dto/favorites/add-favorite.dto';

@Injectable()
export class PrismaUserFavoriteRepository implements UserFavoriteRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly errorHandler: ErrorHandlerService,
  ) {}

  async addFavorite(data: AddFavoriteDto): Promise<UserFavorite> {
    try {
      const productItem = await this.prisma.productItem.findUnique({
        where: { id: data.productItemId },
      });

      if (!productItem) {
        throw new Error(`Product item with ID ${data.productItemId} not found`);
      }
      const existingFavorite = await this.prisma.userFavorite.findUnique({
        where: {
          userId_productItemId: {
            userId: data.userId,
            productItemId: data.productItemId,
          },
        },
      });

      if (existingFavorite) {
        throw new Error('Product item is already in favorites');
      }

      const favorite = await this.prisma.userFavorite.create({
        data: {
          userId: data.userId,
          productItemId: data.productItemId,
        },
      });

      return UserFavoriteMapper.toDomain(favorite);
    } catch (error) {
      this.errorHandler.handleDatabaseError(error, 'addFavorite');
    }
  }

  async getUserFavorites(userId: number): Promise<UserFavorite[]> {
    try {
      const favorites = await this.prisma.userFavorite.findMany({
        where: { userId },
        orderBy: { created_at: 'desc' },
      });

      return favorites.map((favorite) => UserFavoriteMapper.toDomain(favorite));
    } catch (error) {
      this.errorHandler.handleDatabaseError(error, 'getUserFavorites');
    }
  }
}
