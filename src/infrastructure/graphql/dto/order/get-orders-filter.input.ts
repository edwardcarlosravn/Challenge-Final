import { InputType, Field } from '@nestjs/graphql';
import { IsOptional, IsEnum, IsDateString } from 'class-validator';
import { PaginationInput } from '../common/pagination.input';
import { OrderStatus } from './order-status.enum.input';

@InputType()
export class GetOrdersFilterInput extends PaginationInput {
  @Field(() => OrderStatus, { nullable: true })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
