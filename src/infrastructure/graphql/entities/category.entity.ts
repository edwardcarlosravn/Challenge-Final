import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class CategoryType {
  @Field(() => Int)
  id: number;

  @Field()
  name: string;

  @Field()
  slug: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  is_active: boolean;

  @Field()
  createdAt: Date;
}
