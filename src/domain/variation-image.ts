export class VariationImage {
  constructor(
    public readonly id: string,
    public readonly s3Key: string,
    public readonly variationId: string,
    public readonly altText: string | null,
    public readonly createdAt: Date,
  ) {}
}
