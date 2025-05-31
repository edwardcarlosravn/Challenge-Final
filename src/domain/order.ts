import { OrderLine } from './order-line';

export class Order {
  constructor(
    public readonly id: string,
    public readonly userId: number,
    public readonly shippingAddress: string,
    public readonly orderStatus: string,
    public readonly orderDate: Date,
    public readonly orderTotal: number,
    public readonly orderLines?: OrderLine[],
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {}

  get calculatedTotal(): number {
    if (!this.orderLines || this.orderLines.length === 0) {
      return this.orderTotal;
    }
    return this.orderLines.reduce((sum, line) => sum + line.totalPrice, 0);
  }
}
