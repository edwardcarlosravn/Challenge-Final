export class ProductItem {
  constructor(
    public readonly id: number,
    public readonly variationId: string,
    public readonly sku: string,
    public readonly price: number,
    public readonly stock: number = 0,
    public readonly attributes?: Array<{ attributeValueId: number }>,
  ) {}
}
