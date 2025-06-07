import { Module } from '@nestjs/common';
import { ProductResolver } from './product.resolver';
import { GetProductsUseCase } from 'src/application/use-cases/product/get-product.use-case';
import { CategoryByProductLoader } from 'src/infrastructure/common/dataloaders/category-by-product.loader';
import { GetCategoriesByProductIdsUseCase } from 'src/application/use-cases/product/get-categories-by-id-product.use-case';
import { CreateProductUseCase } from 'src/application/use-cases/product/create-product-full.use-case';
import { PersistenceModule } from 'src/infrastructure/persistence/persistence.module';
import { GetProductsByCategoriesUseCase } from 'src/application/use-cases/product/get-products-by-categories.use-case';
import { UpdateProductUseCase } from 'src/application/use-cases/product/update-product.use-case';
import { GetProductByIdUseCase } from 'src/application/use-cases/product/get-product-by-id.use-case';
@Module({
  imports: [PersistenceModule],
  providers: [
    UpdateProductUseCase,
    ProductResolver,
    GetProductsUseCase,
    CategoryByProductLoader,
    GetCategoriesByProductIdsUseCase,
    CreateProductUseCase,
    GetProductsByCategoriesUseCase,
    GetProductByIdUseCase,
  ],
})
export class ProductModule {}
