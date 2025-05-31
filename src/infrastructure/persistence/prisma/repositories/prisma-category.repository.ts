import { Injectable } from '@nestjs/common';
import { CategoryMapper } from '../mappers/category.mapper';
import { PrismaService } from '../prisma.service';
import { CategoryRepository } from 'src/application/contracts/persistence/category-repository.interface';
import { Category } from 'src/domain/category';
import { ErrorHandlerService } from 'src/infrastructure/common/error-handler.service';

@Injectable()
export class PrismaCategoryRepository implements CategoryRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly errorHandler: ErrorHandlerService,
  ) {}

  async findAll(): Promise<Category[]> {
    try {
      const categories = await this.prisma.productCategory.findMany({
        where: { is_active: true },
        orderBy: { created_at: 'desc' },
      });
      return categories.map((category) => CategoryMapper.toDomain(category));
    } catch (error) {
      this.errorHandler.handleDatabaseError(error, 'findAll');
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
      this.errorHandler.handleDatabaseError(error, 'create');
    }
  }

  async existsByName(name: string): Promise<boolean> {
    try {
      const count = await this.prisma.productCategory.count({
        where: { name },
      });
      return count > 0;
    } catch (error) {
      this.errorHandler.handleDatabaseError(error, 'existsByName');
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
      this.errorHandler.handleDatabaseError(error, 'validateAndGetIds');
    }
  }
}
