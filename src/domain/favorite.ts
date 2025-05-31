export class UserFavorite {
  constructor(
    public readonly id: number,
    public readonly userId: number,
    public readonly productItemId: number,
    public readonly createdAt: Date = new Date(),
  ) {}
}
