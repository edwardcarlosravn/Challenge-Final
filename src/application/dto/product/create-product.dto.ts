export interface CreateProductDto {
  name: string;
  description?: string;
  categoryIds?: string[];
}
export interface CreateItemAttributeDto {
  attributeValueId: number;
}

export interface CreateVariationItemDto {
  sku: string;
  price: number;
  stock?: number;
  attributes?: CreateItemAttributeDto[];
}

export interface CreateVariationDto {
  productId: string;
  items?: CreateVariationItemDto[];
}

export interface CreateProductWithVariationsDto {
  name: string;
  description?: string;
  categoryIds?: string[];
  variations: CreateVariationDto[];
}
