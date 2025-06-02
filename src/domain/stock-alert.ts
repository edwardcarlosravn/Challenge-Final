export class StockAlert {
  constructor(
    public readonly id: number,
    public readonly userId: number,
    public readonly productItemId: number,
    public readonly notifiedAt: Date | null,
    public readonly createdAt: Date,
  ) {}
}
