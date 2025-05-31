import { InputType, Field, Int } from '@nestjs/graphql';
import { IsInt, IsOptional, IsString, IsIn, Min, Max } from 'class-validator';

@InputType()
export class PaginationInput {
  @Field(() => Int, { defaultValue: 1 })
  @IsInt()
  @Min(1)
  page: number;

  @Field(() => Int, { defaultValue: 10 })
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}
