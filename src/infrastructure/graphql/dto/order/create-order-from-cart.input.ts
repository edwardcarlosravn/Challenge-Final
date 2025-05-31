import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

@InputType()
export class CreateOrderFromCartInput {
  @Field()
  @IsString()
  @IsNotEmpty({ message: 'Shipping address is required' })
  @MaxLength(100, { message: 'Shipping address cannot exceed 100 characters' })
  shippingAddress: string;
}
