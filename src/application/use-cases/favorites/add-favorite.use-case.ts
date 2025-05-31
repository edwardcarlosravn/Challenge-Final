import { Injectable, Inject } from '@nestjs/common';
import { UserFavoriteRepository } from 'src/application/contracts/persistence/favorite-repository.interface';
import { UserFavorite } from 'src/domain/favorite';
import { AddFavoriteDto } from 'src/application/dto/favorites/add-favorite.dto';

@Injectable()
export class AddFavoriteUseCase {
  constructor(
    @Inject('UserFavoriteRepository')
    private readonly userFavoriteRepository: UserFavoriteRepository,
  ) {}

  async execute(data: AddFavoriteDto): Promise<UserFavorite> {
    return await this.userFavoriteRepository.addFavorite(data);
  }
}
