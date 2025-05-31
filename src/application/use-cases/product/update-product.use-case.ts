import { Injectable, Inject } from '@nestjs/common';
import { ProductRepository } from 'src/application/contracts/persistence/product-repository.interface';
import { UpdateProductDto } from 'src/application/dto/product/update-product.dto';
import { Product } from 'src/domain/product';

@Injectable()
export class UpdateProductUseCase {
  constructor(
    @Inject('ProductRepository')
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(id: string, updateData: UpdateProductDto): Promise<Product> {
    if (updateData.name && updateData.name.trim().length < 3) {
      throw new Error('Product name must be at least 3 characters long');
    }

    return await this.productRepository.update(id, updateData);
  }
}
