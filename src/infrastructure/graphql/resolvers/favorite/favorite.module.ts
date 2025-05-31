// src/infrastructure/graphql/resolvers/favorites/favorites.module.ts
import { Module } from '@nestjs/common';
import { FavoritesResolver } from './favorite.resolver';
import { AddFavoriteUseCase } from 'src/application/use-cases/favorites/add-favorite.use-case';
import { GetUserFavoritesUseCase } from 'src/application/use-cases/favorites/get-user-favorites.use-case';
import { PersistenceModule } from 'src/infrastructure/persistence/persistence.module';

@Module({
  imports: [PersistenceModule],
  providers: [FavoritesResolver, AddFavoriteUseCase, GetUserFavoritesUseCase],
})
export class FavoritesModule {}
