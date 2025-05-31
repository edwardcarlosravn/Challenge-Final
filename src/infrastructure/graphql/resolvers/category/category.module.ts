import { Module } from '@nestjs/common';
import { CategoryResolver } from './category.resolver';
import { GetCategoriesUseCase } from 'src/application/use-cases/category/get-categories.use-case';
import { CreateCategoryUseCase } from 'src/application/use-cases/category/create-category.use-case';
import { PersistenceModule } from 'src/infrastructure/persistence/persistence.module';

@Module({
  imports: [PersistenceModule],
  providers: [GetCategoriesUseCase, CategoryResolver, CreateCategoryUseCase],
  exports: [CategoryResolver],
})
export class CategoryModule {}
