// src/infrastructure/persistence/prisma/mappers/product.mapper.ts
import { Product } from 'src/domain/product';
import {
  Product as PrismaProduct,
  ProductCategory as PrismaProductCategory,
  ProductVariation as PrismaProductVariation,
  ProductItem as PrismaProductItem,
  ProductItemAttribute as PrismaProductItemAttribute,
  AttributeValue,
  Attribute,
  Prisma,
} from '@prisma/client';
import { VariationMapper } from './variation.mapper';

type PrismaVariationWithDetails = PrismaProductVariation & {
  items?: (PrismaProductItem & {
    attributes?: (PrismaProductItemAttribute & {
      attributeValue?: AttributeValue & {
        attribute?: Attribute;
      };
    })[];
  })[];
};

type PrismaProductWithDetails = PrismaProduct & {
  categories?: PrismaProductCategory[];
  variations?: PrismaVariationWithDetails[];
};

export class ProductMapper {
  static toDomain(raw: PrismaProductWithDetails): Product {
    const variations = raw.variations?.map((variation) =>
      VariationMapper.toDomain(variation),
    );

    return new Product(
      raw.id,
      raw.name,
      raw.description,
      raw.categories?.map((cat) => cat.id) || [],
      raw.is_active,
      raw.created_at,
      raw.updated_at,
      variations,
    );
  }

  static toPersistence(product: Product): Prisma.ProductCreateInput {
    return {
      name: product.name,
      description: product.description,
      is_active: product.isActive,
      created_at: product.createdAt,
      updated_at: product.updatedAt,

      ...(product.variations &&
        product.variations.length > 0 && {
          variations: {
            create: product.variations.map((variation) =>
              VariationMapper.toPersistence(variation),
            ),
          },
        }),
    };
  }

  static toBasicPersistence(
    product: Product,
  ): Omit<Prisma.ProductCreateInput, 'variations'> {
    return {
      name: product.name,
      description: product.description,
      is_active: product.isActive,
      created_at: product.createdAt,
      updated_at: product.updatedAt,
    };
  }
}
