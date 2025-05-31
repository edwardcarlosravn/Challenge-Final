import { ObjectType, Field, Int } from '@nestjs/graphql';
import { UserFavorite } from 'src/domain/favorite';

@ObjectType()
export class UserFavoriteType {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  userId: number;

  @Field(() => Int)
  productItemId: number;

  @Field()
  created_at: Date;

  static fromDomainToEntity(favorite: UserFavorite): UserFavoriteType {
    const entity = new UserFavoriteType();
    entity.id = favorite.id;
    entity.userId = favorite.userId;
    entity.productItemId = favorite.productItemId;
    entity.created_at = favorite.createdAt;
    return entity;
  }
}
