import { ProductVariation } from './variation';
import { Category } from './category';

export class Product {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly categories?: Category[],
    public readonly isActive: boolean = true,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
    public readonly variations?: ProductVariation[],
  ) {}
}
