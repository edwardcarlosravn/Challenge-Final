import { InputType, Field, Int } from '@nestjs/graphql';
import { IsNumber, IsNotEmpty } from 'class-validator';

@InputType()
export class AddFavoriteInput {
  @Field(() => Int)
  @IsNumber()
  @IsNotEmpty()
  productItemId: number;
}
