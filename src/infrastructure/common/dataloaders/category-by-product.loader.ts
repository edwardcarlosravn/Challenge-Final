import { Injectable } from '@nestjs/common';
import * as DataLoader from 'dataloader';
import { GetCategoriesByProductIdsUseCase } from 'src/application/use-cases/product/get-categories-by-id-product.use-case';

import { Category } from 'src/domain/category';

@Injectable()
export class CategoryByProductLoader {
  private readonly loader: DataLoader<string, Category[]>;

  constructor(
    private readonly getCategoriesByProductIdsUseCase: GetCategoriesByProductIdsUseCase,
  ) {
    this.loader = new DataLoader<string, Category[]>(
      (keys) => this.batchLoadFunction(keys),
      { cache: true },
    );
  }

  async load(productId: string): Promise<Category[]> {
    return this.loader.load(productId);
  }

  private async batchLoadFunction(
    productIds: readonly string[],
  ): Promise<Category[][]> {
    const categoriesByProduct =
      await this.getCategoriesByProductIdsUseCase.execute({
        productIds: [...productIds],
      });

    return this.mapResults(productIds, categoriesByProduct);
  }

  private mapResults(
    productIds: readonly string[],
    categoriesByProduct: Map<string, Category[]>,
  ): Category[][] {
    return productIds.map(
      (productId) => categoriesByProduct.get(productId) || [],
    );
  }
}
