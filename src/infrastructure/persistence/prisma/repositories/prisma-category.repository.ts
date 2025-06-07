import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CategoryMapper } from '../mappers/category.mapper';
import { PrismaService } from '../prisma.service';
import { CategoryRepository } from 'src/application/contracts/persistence/category-repository.interface';
import { Category } from 'src/domain/category';

@Injectable()
export class PrismaCategoryRepository implements CategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Category[]> {
    try {
      const categories = await this.prisma.productCategory.findMany({
        where: { is_active: true },
        orderBy: { created_at: 'desc' },
      });
      return categories.map((category) => CategoryMapper.toDomain(category));
    } catch (error) {
      if (error instanceof Error)
        throw new InternalServerErrorException('Failed to retrieve categories');
      return [];
    }
  }

  async create(
    category: Omit<Category, 'id' | 'isActive' | 'createdAt'>,
  ): Promise<Category> {
    try {
      const created = await this.prisma.productCategory.create({
        data: {
          name: category.name,
          slug: category.slug,
          description: category.description,
          is_active: true,
          created_at: new Date(),
        },
      });
      return CategoryMapper.toDomain(created);
    } catch (error) {
      if (error instanceof Error)
        throw new InternalServerErrorException('Failed to create category');
      throw error;
    }
  }

  async existsByName(name: string): Promise<boolean> {
    try {
      const count = await this.prisma.productCategory.count({
        where: { name },
      });
      return count > 0;
    } catch (error) {
      if (error instanceof Error)
        throw new InternalServerErrorException(
          'Failed to check category existence',
        );
      return false;
    }
  }

  async validateAndGetIds(names: string[]): Promise<number[]> {
    try {
      const categories = await this.prisma.productCategory.findMany({
        where: {
          name: {
            in: names,
            mode: 'insensitive',
          },
          is_active: true,
        },
        select: { id: true },
      });
      return categories.map((category) => category.id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to validate categories');
    }
  }
}
