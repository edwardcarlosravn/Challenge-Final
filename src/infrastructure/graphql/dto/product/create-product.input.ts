import { InputType, Field } from '@nestjs/graphql';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  MinLength,
  IsArray,
  ArrayMaxSize,
  ArrayNotEmpty,
} from 'class-validator';
import { CreateVariationInput } from '../variation/create-product-variation.input';

@InputType()
export class CreateProductWithVariationsInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @MinLength(10)
  name: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @Field(() => [String], { nullable: true })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  categoryNames?: string[];

  @Field(() => [CreateVariationInput], { nullable: true })
  @IsArray()
  @IsOptional()
  @ArrayNotEmpty()
  variations?: CreateVariationInput[];
}
