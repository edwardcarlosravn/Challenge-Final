import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsNotEmpty, Length } from 'class-validator';

@InputType()
export class CreateCategoryInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  @Length(3, 100)
  name: string;

  @Field({ nullable: true })
  @IsString()
  slug?: string;

  @Field({ nullable: true })
  @IsString()
  description?: string;
}
