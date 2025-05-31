import { Query, Resolver, Mutation, Args } from '@nestjs/graphql';
import { GetCategoriesUseCase } from 'src/application/use-cases/category/get-categories.use-case';
import { CreateCategoryUseCase } from 'src/application/use-cases/category/create-category.use-case';
import { CategoryType } from '../../entities/category.entity';
import { CreateCategoryInput } from '../../dto/category/create-category.input';

@Resolver(() => CategoryType)
export class CategoryResolver {
  constructor(
    private readonly getCategoriesUseCase: GetCategoriesUseCase,
    private readonly createCategoryUseCase: CreateCategoryUseCase,
  ) {}

  @Query(() => [CategoryType], { name: 'categories' })
  async getCategories(): Promise<CategoryType[]> {
    const categories = await this.getCategoriesUseCase.execute();
    return categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      is_active: category.isActive,
      createdAt: category.createdAt,
    }));
  }

  @Mutation(() => CategoryType)
  async createCategory(
    @Args('input') input: CreateCategoryInput,
  ): Promise<CategoryType> {
    const category = await this.createCategoryUseCase.execute({
      name: input.name,
      slug: input.slug,
      description: input.description,
    });
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      is_active: category.isActive,
      createdAt: category.createdAt,
    };
  }
}
