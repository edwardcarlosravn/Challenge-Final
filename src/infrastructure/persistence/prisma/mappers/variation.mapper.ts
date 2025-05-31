import { ProductVariation } from 'src/domain/variation';
import {
  ProductVariation as PrismaProductVariationEntity,
  ProductItem as PrismaProductItemEntity,
  ProductItemAttribute as PrismaProductItemAttributeEntity,
  VariationImage as PrismaVariationImageEntity,
  AttributeValue,
  Attribute,
  Prisma,
} from '@prisma/client';
import { ProductItemMapper } from './producItem.mapper';
import { VariationImage } from 'src/domain/variation-image';
type PrismaVariationWithDetails = PrismaProductVariationEntity & {
  items?: (PrismaProductItemEntity & {
    attributes?: (PrismaProductItemAttributeEntity & {
      attributeValue?: AttributeValue & {
        attribute?: Attribute;
      };
    })[];
  })[];
  images?: PrismaVariationImageEntity[];
};

export class VariationMapper {
  static toDomain(raw: PrismaVariationWithDetails): ProductVariation {
    const domainItems = raw.items?.map((item) =>
      ProductItemMapper.toDomain(item),
    );
    const domainImages = raw.images?.map(
      (image) =>
        new VariationImage(
          String(image.id),
          image.variationId,
          image.s3Key,
          image.alt_text || null,
          image.created_at,
        ),
    );
    return new ProductVariation(
      raw.id,
      raw.productId,
      raw.is_active,
      domainItems,
      domainImages,
    );
  }

  static toPersistence(
    variation: ProductVariation,
  ): Prisma.ProductVariationCreateInput {
    const data: Prisma.ProductVariationCreateInput = {
      id: variation.id,
      is_active: variation.isActive,
      product: {
        connect: { id: variation.productId },
      },
    };

    if (variation.items && variation.items.length > 0) {
      data.items = {
        create: variation.items.map((item) =>
          ProductItemMapper.toPersistence(item),
        ),
      };
    }

    return data;
  }
}
