export interface CreateVariationDto {
  productId: string;
  items?: CreateVariationItemDto[];
}

export interface CreateVariationItemDto {
  sku: string;
  price: number;
  stock?: number;
  attributes?: CreateItemAttributeDto[];
}

export interface CreateItemAttributeDto {
  attributeValueId: number;
}
