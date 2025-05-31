export class ProductVariation {
  constructor(
    public readonly id: string,
    public readonly productId: string,
    public readonly isActive: boolean = true,
    public readonly items?: ProductItem[],
  ) {}
}
export class ProductItem {
  constructor(
    public readonly id: string,
    public readonly variationId: string,
    public readonly sku: string,
    public readonly price: number,
    public readonly stock: number,
    public readonly attributes?: ProductItemAttribute[],
  ) {}
}
export class ProductItemAttribute {
  constructor(
    public readonly productItemId: number,
    public readonly attributeValueId: number,
  ) {}
}
