import { VariationImage } from 'src/domain/variation-image';

export interface VariationImageRepository {
  create(s3Key: string, variationId: string): Promise<VariationImage>;
  findManyByVariationId(variationId: string): Promise<VariationImage[]>;
}
