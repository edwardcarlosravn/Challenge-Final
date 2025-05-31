import { Module } from '@nestjs/common';
import { ProductItemResolver } from './product-item.resolver';
import { DeleteProductItemUseCase } from 'src/application/use-cases/variation/delete-product-item.use-case';
import { PersistenceModule } from 'src/infrastructure/persistence/persistence.module';

@Module({
  imports: [PersistenceModule],
  providers: [ProductItemResolver, DeleteProductItemUseCase],
  exports: [DeleteProductItemUseCase],
})
export class ProductItemModule {}
