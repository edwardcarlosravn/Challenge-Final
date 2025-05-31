import { Category } from 'src/domain/category';

export interface CategoryRepository {
  findAll(): Promise<Category[]>;
  create(
    category: Omit<Category, 'id' | 'isActive' | 'createdAt'>,
  ): Promise<Category>;
  existsByName(name: string): Promise<boolean>;
}
