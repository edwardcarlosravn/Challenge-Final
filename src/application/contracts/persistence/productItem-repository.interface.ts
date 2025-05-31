import { ProductItem } from 'src/domain/product-item';

export interface ProductItemRepository {
  deleteById(id: number): Promise<void>;
  findById(id: number): Promise<ProductItem | null>;
}
