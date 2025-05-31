import { Injectable, Inject } from '@nestjs/common';
import { ProductRepository } from 'src/application/contracts/persistence/product-repository.interface';
import { CreateProductWithVariationsDto } from 'src/application/dto/product/create-product.dto';
import { Product } from 'src/domain/product';

@Injectable()
export class CreateProduct2UseCase {
  constructor(
    @Inject('ProductRepository')
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(request: CreateProductWithVariationsDto): Promise<Product> {
    return this.productRepository.createProduct(request);
  }
}
