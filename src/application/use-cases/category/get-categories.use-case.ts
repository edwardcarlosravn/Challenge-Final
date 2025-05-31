import { Injectable, Inject } from '@nestjs/common';
import { CategoryRepository } from 'src/application/contracts/persistence/category-repository.interface';
import { Category } from 'src/domain/category';

@Injectable()
export class GetCategoriesUseCase {
  constructor(
    @Inject('CategoryRepository')
    private readonly categoryRepository: CategoryRepository,
  ) {}

  async execute(): Promise<Category[]> {
    return this.categoryRepository.findAll();
  }
}
