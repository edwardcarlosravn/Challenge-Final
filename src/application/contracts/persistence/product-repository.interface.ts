import { CreateProductWithVariationsDto } from 'src/application/dto/product/create-product.dto';
import { Product } from 'src/domain/product';
import { ProductWithCategories } from './interfaces/product-with-categories.interface';
import {
  PaginatedResponse,
  PaginationInput,
} from 'src/application/dto/common/pagination.dto';

export interface ProductRepository {
  findAll(pagination?: PaginationInput): Promise<PaginatedResponse<Product>>;
  findById(id: string): Promise<Product | null>;
  getProductsWithCategoriesByIds(
    productIds: string[],
  ): Promise<ProductWithCategories[]>;
  createProduct(product: CreateProductWithVariationsDto): Promise<Product>;
  findByCategoryNames(
    categoryNames: string[],
    pagination?: PaginationInput,
  ): Promise<PaginatedResponse<Product>>;
  update(
    id: string,
    product: Partial<Omit<Product, 'id' | 'createdAt'>>,
  ): Promise<Product>;
}
