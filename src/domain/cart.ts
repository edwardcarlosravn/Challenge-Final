import { ShoppingCartItem } from './cart-item';
export class ShoppingCart {
  constructor(
    public readonly id: number,
    public readonly userId: number,
    public readonly items?: ShoppingCartItem[],
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {}
}
