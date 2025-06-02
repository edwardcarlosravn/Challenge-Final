import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ProductRepository } from 'src/application/contracts/persistence/product-repository.interface';
import { Product } from 'src/domain/product';

@Injectable()
export class GetProductByIdUseCase {
  constructor(
    @Inject('ProductRepository')
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(id: string): Promise<Product> {
    if (!id || id.trim().length === 0) {
      throw new NotFoundException('Product ID is required');
    }

    const product = await this.productRepository.findById(id);

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }
}
