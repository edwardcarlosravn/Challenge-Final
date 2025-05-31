export class Category {
  constructor(
    public readonly id: number,
    public readonly name: string,
    public readonly slug: string,
    public readonly description?: string,
    public readonly isActive: boolean = true,
    public readonly createdAt: Date = new Date(),
  ) {}
}
