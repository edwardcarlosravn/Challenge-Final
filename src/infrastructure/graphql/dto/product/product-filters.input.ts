import { InputType, Field } from '@nestjs/graphql';
import {
  IsString,
  IsOptional,
  IsArray,
  ArrayMaxSize,
  IsBoolean,
} from 'class-validator';
import { PaginationInput } from '../common/pagination.input';

@InputType()
export class ProductFiltersInput extends PaginationInput {
  @Field(() => [String], { nullable: true })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  categoryNames?: string[];

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
