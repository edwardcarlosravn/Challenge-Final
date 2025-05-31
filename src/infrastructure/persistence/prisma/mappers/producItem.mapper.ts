import { ProductItem } from 'src/domain/product-item';
import {
  ProductItem as PrismaProductItemEntity,
  ProductItemAttribute as PrismaProductItemAttributeEntity,
  AttributeValue,
  Attribute,
  Prisma,
} from '@prisma/client';
type PrismaProductItemWithFullAttributes = PrismaProductItemEntity & {
  attributes?: (PrismaProductItemAttributeEntity & {
    attributeValue?: AttributeValue & {
      attribute?: Attribute;
    };
  })[];
};

export class ProductItemMapper {
  static toDomain(raw: PrismaProductItemWithFullAttributes): ProductItem {
    const domainAttributes = raw.attributes?.map((attr) => ({
      attributeValueId: attr.attributeValueId,
      ...(attr.attributeValue && {
        value: attr.attributeValue.value,
        attributeName: attr.attributeValue.attribute?.name,
      }),
    }));

    return new ProductItem(
      raw.id,
      raw.variationId,
      raw.sku,
      parseFloat(raw.price.toString()),
      raw.stock,
      domainAttributes,
    );
  }

  static toPersistence(
    item: ProductItem,
  ): Prisma.ProductItemCreateWithoutVariationInput {
    const data: Prisma.ProductItemCreateWithoutVariationInput = {
      sku: item.sku,
      price: item.price,
      stock: item.stock,
    };

    if (item.attributes && item.attributes.length > 0) {
      data.attributes = {
        create: item.attributes.map((attr) => ({
          attributeValueId: attr.attributeValueId,
        })),
      };
    }
    return data;
  }
}
