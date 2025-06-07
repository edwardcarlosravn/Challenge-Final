import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { ProductRepository } from 'src/application/contracts/persistence/product-repository.interface';
import { CreateProductWithVariationsDto } from 'src/application/dto/product/create-product.dto';
import { Product } from 'src/domain/product';

@Injectable()
export class CreateProductUseCase {
  constructor(
    @Inject('ProductRepository')
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(request: CreateProductWithVariationsDto): Promise<Product> {
    if (!request.variations || request.variations.length === 0) {
      throw new BadRequestException('Product must have at least one variation');
    }

    for (const variation of request.variations) {
      if (!variation.items || variation.items.length === 0) {
        throw new BadRequestException(
          'Each variation must have at least one item',
        );
      }
    }
    return this.productRepository.createProduct(request);
  }
}
