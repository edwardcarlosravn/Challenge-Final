import { InputType, Field, Int } from '@nestjs/graphql';
import { IsNumber, Min, IsNotEmpty } from 'class-validator';

@InputType()
export class UpdateCartItemInput {
  @Field(() => Int)
  @IsNumber()
  @IsNotEmpty()
  cartItemId: number;

  @Field(() => Int)
  @IsNumber()
  @Min(1, { message: 'Quantity must be at least 1' })
  quantity: number;
}
