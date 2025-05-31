import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { OrderStatus } from './order-status.enum.input'; // ✅ CORRECTO

@InputType()
export class UpdateOrderStatusInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @Field(() => OrderStatus)
  @IsEnum(OrderStatus)
  newStatus: OrderStatus;
}
