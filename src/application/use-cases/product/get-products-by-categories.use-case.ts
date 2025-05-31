import { Injectable, Inject } from '@nestjs/common';
import { ProductRepository } from 'src/application/contracts/persistence/product-repository.interface';
import { Product } from 'src/domain/product';
import {
  PaginatedResponse,
  PaginationInput,
} from 'src/application/dto/common/pagination.dto';

export interface GetProductsByCategoriesRequest {
  categoryNames: string[];
  pagination?: PaginationInput;
}

@Injectable()
export class GetProductsByCategoriesUseCase {
  constructor(
    @Inject('ProductRepository')
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(
    request: GetProductsByCategoriesRequest,
  ): Promise<PaginatedResponse<Product>> {
    const pagination = request.pagination || {
      page: 1,
      pageSize: 10,
      sortBy: 'created_at',
      sortOrder: 'desc' as const,
    };

    if (!request.categoryNames || request.categoryNames.length === 0) {
      return this.productRepository.findAll(pagination);
    }

    return this.productRepository.findByCategoryNames(
      request.categoryNames,
      pagination,
    );
  }
}
