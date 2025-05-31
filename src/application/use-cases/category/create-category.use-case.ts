import { Injectable, Inject } from '@nestjs/common';
import { CategoryRepository } from 'src/application/contracts/persistence/category-repository.interface';
import { Category } from 'src/domain/category';

@Injectable()
export class CreateCategoryUseCase {
  constructor(
    @Inject('CategoryRepository')
    private readonly categoryRepository: CategoryRepository,
  ) {}

  async execute(input: {
    name: string;
    slug?: string;
    description?: string;
  }): Promise<Category> {
    if (await this.categoryRepository.existsByName(input.name)) {
      throw new Error('Category name already exists');
    }

    const slug = input.slug || input.name;

    return this.categoryRepository.create({
      name: input.name,
      slug: slug,
      description: input.description,
    });
  }
}
