import { UserFavorite } from 'src/domain/favorite';
import { AddFavoriteDto } from 'src/application/dto/favorites/add-favorite.dto';

export interface UserFavoriteRepository {
  addFavorite(data: AddFavoriteDto): Promise<UserFavorite>;
  getUserFavorites(userId: number): Promise<UserFavorite[]>;
}
