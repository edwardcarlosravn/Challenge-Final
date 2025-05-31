import { ProductItem } from './product-item';
import { VariationImage } from './variation-image';
export class ProductVariation {
  constructor(
    public readonly id: string,
    public readonly productId: string,
    public readonly isActive: boolean = true,
    public readonly items?: ProductItem[],
    public readonly images?: VariationImage[],
  ) {}
}
