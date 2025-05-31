import { InputType, Field } from '@nestjs/graphql';
import {
  IsString,
  IsOptional,
  MaxLength,
  MinLength,
  IsBoolean,
  IsUUID,
} from 'class-validator';

@InputType()
export class UpdateProductInput {
  @Field(() => String)
  @IsString()
  @IsUUID()
  id: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  @MinLength(3)
  name?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @Field({ nullable: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
