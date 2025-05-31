import { InputType, Field, Int, Float } from '@nestjs/graphql';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsNumber,
  Min,
} from 'class-validator';

@InputType()
export class CreateItemAttributeInput {
  @Field(() => Int)
  @IsNumber()
  attributeValueId: number;
}

@InputType()
export class CreateVariationItemInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  sku: string;

  @Field(() => Float)
  @IsNumber()
  @Min(0)
  price: number;

  @Field(() => Int, { nullable: true, defaultValue: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;

  @Field(() => [CreateItemAttributeInput], { nullable: true })
  @IsOptional()
  @IsArray()
  attributes?: CreateItemAttributeInput[];
}

@InputType()
export class CreateVariationInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  productId?: string;

  @Field(() => [CreateVariationItemInput], { nullable: true })
  @IsOptional()
  @IsArray()
  items?: CreateVariationItemInput[];
}
