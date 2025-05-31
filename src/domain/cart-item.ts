export class ShoppingCartItem {
  constructor(
    public readonly id: number,
    public readonly cartId: number,
    public readonly productItemId: number,
    public readonly quantity: number,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {}
}
