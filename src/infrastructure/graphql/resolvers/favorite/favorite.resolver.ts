import { Resolver, Mutation, Query, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CurrentUser } from 'src/infrastructure/graphql/decorators/current-user.decorator';
import { GqlJwtAuthGuard } from 'src/infrastructure/graphql/guards/gql-jwt-auth.guard';
import { UserFavoriteType } from '../../entities/favorite.entity';
import { AddFavoriteInput } from '../../dto/favorites/add-favorite.input';
import { AddFavoriteUseCase } from 'src/application/use-cases/favorites/add-favorite.use-case';
import { GetUserFavoritesUseCase } from 'src/application/use-cases/favorites/get-user-favorites.use-case';
import { CurrentUser as CurrentUserType } from '../../../http/controllers/auth/types/current-user';
import { SkipThrottle } from '@nestjs/throttler';
@Resolver(() => UserFavoriteType)
export class FavoritesResolver {
  constructor(
    private readonly addFavoriteUseCase: AddFavoriteUseCase,
    private readonly getUserFavoritesUseCase: GetUserFavoritesUseCase,
  ) {}
  @SkipThrottle()
  @Mutation(() => UserFavoriteType)
  @UseGuards(GqlJwtAuthGuard)
  async addFavorite(
    @Args('input') input: AddFavoriteInput,
    @CurrentUser() user: CurrentUserType,
  ): Promise<UserFavoriteType> {
    const favorite = await this.addFavoriteUseCase.execute({
      userId: user.id,
      productItemId: input.productItemId,
    });

    return UserFavoriteType.fromDomainToEntity(favorite);
  }
  @SkipThrottle()
  @Query(() => [UserFavoriteType])
  @UseGuards(GqlJwtAuthGuard)
  async myFavorites(
    @CurrentUser() user: CurrentUserType,
  ): Promise<UserFavoriteType[]> {
    const favorites = await this.getUserFavoritesUseCase.execute(user.id);
    return favorites.map((favorite) =>
      UserFavoriteType.fromDomainToEntity(favorite),
    );
  }
}
