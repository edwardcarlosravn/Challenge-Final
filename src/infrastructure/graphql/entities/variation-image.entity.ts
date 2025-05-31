// src/infrastructure/graphql/entities/variation-image.entity.ts
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { VariationImage as DomainVariationImage } from 'src/domain/variation-image';

@ObjectType()
export class VariationImageType {
  @Field(() => ID)
  id: number;

  @Field()
  variationId: string;

  @Field()
  s3Key: string;

  @Field({ nullable: true })
  alt_text?: string;

  @Field()
  created_at: Date;

  static fromDomainToEntity(
    domainImage: DomainVariationImage,
  ): VariationImageType {
    return {
      id: Number(domainImage.id),
      variationId: domainImage.variationId,
      s3Key: domainImage.s3Key,
      alt_text: domainImage.altText ?? undefined,
      created_at: domainImage.createdAt,
    };
  }
}
