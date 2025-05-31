export interface VariationResponseDto {
  id: string;
  productId: string;
  isActive: boolean;
  items?: VariationItemResponseDto[];
}

export interface VariationItemResponseDto {
  id: number;
  sku: string;
  price: number;
  stock: number;
  attributes?: ItemAttributeResponseDto[];
}

export interface ItemAttributeResponseDto {
  attributeValueId: number;
  attributeName: string;
  attributeValue: string;
}
