import { VariationImage } from 'src/domain/variation-image';

export class VariationImageMapper {
  static toDomain(prismaVariationImage: {
    id: number;
    variationId: string;
    s3Key: string;
    alt_text: string | null;
    created_at: Date;
  }): VariationImage {
    return new VariationImage(
      prismaVariationImage.id.toString(),
      prismaVariationImage.s3Key,
      prismaVariationImage.variationId,
      prismaVariationImage.alt_text,
      prismaVariationImage.created_at,
    );
  }
}
