import { Injectable, Inject } from '@nestjs/common';
import { UserFavoriteRepository } from 'src/application/contracts/persistence/favorite-repository.interface';
import { UserFavorite } from 'src/domain/favorite';

@Injectable()
export class GetUserFavoritesUseCase {
  constructor(
    @Inject('UserFavoriteRepository')
    private readonly userFavoriteRepository: UserFavoriteRepository,
  ) {}

  async execute(userId: number): Promise<UserFavorite[]> {
    return await this.userFavoriteRepository.getUserFavorites(userId);
  }
}
