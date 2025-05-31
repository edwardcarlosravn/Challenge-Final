import { InputType, Field, Int } from '@nestjs/graphql';
import { IsNumber, IsNotEmpty } from 'class-validator';

@InputType()
export class RemoveFromCartInput {
  @Field(() => Int)
  @IsNumber()
  @IsNotEmpty()
  cartItemId: number;
}
