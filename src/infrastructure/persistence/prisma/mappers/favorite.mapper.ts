import { UserFavorite } from 'src/domain/favorite';
import { UserFavorite as PrismaUserFavorite } from '@prisma/client';

export class UserFavoriteMapper {
  static toDomain(prismaUserFavorite: PrismaUserFavorite): UserFavorite {
    return new UserFavorite(
      prismaUserFavorite.id,
      prismaUserFavorite.userId,
      prismaUserFavorite.productItemId,
      prismaUserFavorite.created_at,
    );
  }
}
