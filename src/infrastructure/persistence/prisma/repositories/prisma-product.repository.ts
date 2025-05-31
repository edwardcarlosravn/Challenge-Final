import { Injectable } from '@nestjs/common';
import { ProductMapper } from '../mappers/product.mapper';
import { ProductRepository } from 'src/application/contracts/persistence/product-repository.interface';
import { Product } from 'src/domain/product';
import { CreateProductWithVariationsDto } from 'src/application/dto/product/create-product.dto';
import { ProductWithCategories } from 'src/application/contracts/persistence/interfaces/product-with-categories.interface';
import { CategoryMapper } from '../mappers/category.mapper';
import { PrismaService } from '../prisma.service';
import { ErrorHandlerService } from 'src/infrastructure/common/error-handler.service';
import {
  PaginatedResponse,
  PaginationInput,
  PaginationMetadata,
} from 'src/application/dto/common/pagination.dto';

@Injectable()
export class PrismaProductRepository implements ProductRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly errorHandler: ErrorHandlerService,
  ) {}
  async findAll(
    pagination?: PaginationInput,
  ): Promise<PaginatedResponse<Product>> {
    try {
      const page = pagination?.page || 1;
      const pageSize = pagination?.pageSize || 10;
      const sortBy = pagination?.sortBy || 'created_at';
      const sortOrder = pagination?.sortOrder || 'desc';

      const skip = (page - 1) * pageSize;

      const totalItems = await this.prisma.product.count({
        where: {
          is_active: true,
        },
      });

      const products = await this.prisma.product.findMany({
        where: {
          is_active: true,
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip: skip,
        take: pageSize,
        include: {
          categories: true,
          variations: {
            include: {
              items: {
                include: {
                  attributes: {
                    include: {
                      attributeValue: {
                        include: {
                          attribute: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      const totalPages = Math.ceil(totalItems / pageSize);
      const hasNextPage = page < totalPages;
      const hasPreviousPage = page > 1;

      const metadata: PaginationMetadata = {
        totalItems,
        totalPages,
        currentPage: page,
        pageSize,
        hasNextPage,
        hasPreviousPage,
      };

      const mappedProducts = products.map((product) =>
        ProductMapper.toDomain(product),
      );

      return {
        data: mappedProducts,
        metadata,
      };
    } catch (error) {
      this.errorHandler.handleDatabaseError(error, 'findAll');
    }
  }

  async findByCategoryNames(
    categoryNames: string[],
    pagination?: PaginationInput,
  ): Promise<PaginatedResponse<Product>> {
    try {
      const page = pagination?.page || 1;
      const pageSize = pagination?.pageSize || 10;
      const sortBy = pagination?.sortBy || 'created_at';
      const sortOrder = pagination?.sortOrder || 'desc';

      const skip = (page - 1) * pageSize;

      const whereCondition = {
        is_active: true,
        categories: {
          some: {
            name: {
              in: categoryNames,
              mode: 'insensitive' as const,
            },
            is_active: true,
          },
        },
      };

      const totalItems = await this.prisma.product.count({
        where: whereCondition,
      });

      const products = await this.prisma.product.findMany({
        where: whereCondition,
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip: skip,
        take: pageSize,
        include: {
          categories: true,
          variations: {
            include: {
              items: {
                include: {
                  attributes: {
                    include: {
                      attributeValue: {
                        include: {
                          attribute: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      const totalPages = Math.ceil(totalItems / pageSize);
      const hasNextPage = page < totalPages;
      const hasPreviousPage = page > 1;

      const metadata: PaginationMetadata = {
        totalItems,
        totalPages,
        currentPage: page,
        pageSize,
        hasNextPage,
        hasPreviousPage,
      };
      const mappedProducts = products.map((product) =>
        ProductMapper.toDomain(product),
      );

      return {
        data: mappedProducts,
        metadata,
      };
    } catch (error) {
      this.errorHandler.handleDatabaseError(error, 'findByCategoryNames');
    }
  }

  async createProduct(
    product: CreateProductWithVariationsDto,
  ): Promise<Product> {
    try {
      const existingCategories = await this.prisma.productCategory.findMany({
        where: {
          name: {
            in: product.categoryIds || [],
          },
        },
        select: {
          id: true,
          name: true,
        },
      });

      const missingCategories = (product.categoryIds || []).filter(
        (categoryName) =>
          !existingCategories.some((c) => c.name === categoryName),
      );

      if (missingCategories.length > 0) {
        throw new Error(`Category Not Found: ${missingCategories.join(', ')}`);
      }
      const result = await this.prisma.$transaction(async (tx) => {
        const createdProduct = await tx.product.create({
          data: {
            name: product.name,
            description: product.description,
            is_active: true,
            created_at: new Date(),
            updated_at: new Date(),
            categories: {
              connect: existingCategories.map((category) => ({
                id: category.id,
              })),
            },
          },
          include: {
            categories: true,
          },
        });
        const createdVariations: Array<any> = [];
        if (product.variations.length > 0) {
          for (const variationData of product.variations) {
            const variation = await tx.productVariation.create({
              data: {
                productId: createdProduct.id,
                is_active: true,
                items: {
                  create:
                    variationData.items?.map((item) => ({
                      sku: item.sku,
                      price: item.price,
                      stock: item.stock || 0,
                      attributes: {
                        create:
                          item.attributes?.map((attr) => ({
                            attributeValueId: attr.attributeValueId,
                          })) || [],
                      },
                    })) || [],
                },
              },
              include: {
                items: {
                  include: {
                    attributes: {
                      include: {
                        attributeValue: {
                          include: {
                            attribute: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            });
            createdVariations.push(variation);
          }
        }
        return {
          ...createdProduct,
          variations: createdVariations,
        };
      });

      return ProductMapper.toDomain(result);
    } catch (error) {
      this.errorHandler.handleDatabaseError(error, 'createProduct');
    }
  }
  async getProductsWithCategoriesByIds(
    productIds: string[],
  ): Promise<ProductWithCategories[]> {
    try {
      const products = await this.prisma.product.findMany({
        where: {
          id: { in: productIds },
          is_active: true,
        },
        include: {
          categories: true,
          variations: {
            include: {
              items: {
                include: {
                  attributes: {
                    include: {
                      attributeValue: {
                        include: {
                          attribute: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      return products.map((product) => {
        const domainProduct = ProductMapper.toDomain(product);
        return {
          ...domainProduct,
          categories: Array.isArray(product.categories)
            ? product.categories.map((category) =>
                CategoryMapper.toDomain(category),
              )
            : [],
        };
      });
    } catch (error) {
      this.errorHandler.handleDatabaseError(
        error,
        'getProductsWithCategoriesByIds',
      );
    }
  }
  async update(
    id: string,
    updateData: Partial<Omit<Product, 'id' | 'createdAt'>>,
  ): Promise<Product> {
    try {
      console.log(id);

      const updatedProduct = await this.prisma.product.update({
        where: { id },
        data: {
          ...(updateData.name && { name: updateData.name }),
          ...(updateData.description !== undefined && {
            description: updateData.description,
          }),
          ...(updateData.isActive !== undefined && {
            is_active: updateData.isActive,
          }),
          updated_at: new Date(),
        },
      });

      return ProductMapper.toDomain(updatedProduct);
    } catch (error) {
      this.errorHandler.handleDatabaseError(error, 'update');
    }
  }
  async findById(id: string): Promise<Product | null> {
    try {
      const product = await this.prisma.product.findUnique({
        where: {
          id,
          is_active: true,
        },
        include: {
          categories: true,
          variations: {
            where: { is_active: true },
            include: {
              items: {
                include: {
                  attributes: {
                    include: {
                      attributeValue: {
                        include: {
                          attribute: true,
                        },
                      },
                    },
                  },
                },
              },
              images: true,
            },
          },
        },
      });

      return product ? ProductMapper.toDomain(product) : null;
    } catch (error) {
      this.errorHandler.handleDatabaseError(error, 'findById');
    }
  }
}
