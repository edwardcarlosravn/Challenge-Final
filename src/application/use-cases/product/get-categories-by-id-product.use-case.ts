import { Injectable, Inject } from '@nestjs/common';
import { ProductRepository } from 'src/application/contracts/persistence/product-repository.interface';

import { Category } from 'src/domain/category';

interface IGetCategoriesByProductIdsUseCaseProps {
  productIds: string[];
}

@Injectable()
export class GetCategoriesByProductIdsUseCase {
  constructor(
    @Inject('ProductRepository')
    private readonly productRepository: ProductRepository,
  ) {}

  async execute({
    productIds,
  }: IGetCategoriesByProductIdsUseCaseProps): Promise<Map<string, Category[]>> {
    const productsWithCategories =
      await this.productRepository.getProductsWithCategoriesByIds(productIds);

    const categoriesByProduct = new Map<string, Category[]>();

    productsWithCategories.forEach((product) => {
      categoriesByProduct.set(
        product.id,
        Array.isArray(product.categories) ? product.categories : [],
      );
    });

    return categoriesByProduct;
  }
}
