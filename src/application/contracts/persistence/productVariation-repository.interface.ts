import { CreateVariationDto } from 'src/application/dto/variation/create-variation.dto';
import { ProductVariation } from 'src/domain/variation';

export interface CreateProductItemData {
  sku: string;
  price: number;
  stock?: number;
  attributes?: { attributeValueId: number }[];
}

export interface VariationRepository {
  create(data: CreateVariationDto): Promise<ProductVariation>;
  findById(id: string): Promise<ProductVariation | null>;
  updateStatus(id: string, isActive: boolean): Promise<ProductVariation>;
  findAll(): Promise<ProductVariation[]>;
}
