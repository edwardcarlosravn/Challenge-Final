// src/infrastructure/persistence/prisma/mappers/category.mapper.ts
import { Category } from '../../../../domain/category';
import { ProductCategory } from '@prisma/client';

export class CategoryMapper {
  static toDomain(raw: ProductCategory): Category {
    return new Category(
      raw.id,
      raw.name,
      raw.slug,
      raw.description ?? undefined,
      raw.is_active,
      raw.created_at,
    );
  }

  static toPersistence(category: Category): any {
    return {
      name: category.name,
      slug: category.slug,
      description: category.description,
      is_active: category.isActive,
      created_at: category.createdAt,
    };
  }
}
