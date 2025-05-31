import { Injectable, Inject } from '@nestjs/common';
import { ProductRepository } from 'src/application/contracts/persistence/product-repository.interface';
import { Product } from 'src/domain/product';
import {
  PaginatedResponse,
  PaginationInput,
} from 'src/application/dto/common/pagination.dto';

export interface GetProductsRequest {
  pagination?: PaginationInput;
}

@Injectable()
export class GetProductsUseCase {
  constructor(
    @Inject('ProductRepository')
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(
    request?: GetProductsRequest,
  ): Promise<PaginatedResponse<Product>> {
    const pagination = request?.pagination || {
      page: 1,
      pageSize: 10,
      sortBy: 'created_at',
      sortOrder: 'desc' as const,
    };

    return this.productRepository.findAll(pagination);
  }
}
