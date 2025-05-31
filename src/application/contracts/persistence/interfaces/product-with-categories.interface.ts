import { Category } from 'src/domain/category';
import { Product } from 'src/domain/product';

export interface ProductWithCategories extends Product {
  categories?: Category[];
}
