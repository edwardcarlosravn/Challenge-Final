export class OrderLine {
  constructor(
    public readonly id: number,
    public readonly orderId: string,
    public readonly productItemId: number,
    public readonly quantity: number,
    public readonly price: number,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {}

  get totalPrice(): number {
    return this.price * this.quantity;
  }
  get unitPrice(): number {
    return this.price;
  }
}
