import {
  Query,
  Resolver,
  Mutation,
  Args,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { ProductType } from '../../entities/product.entity';
import { CategoryType } from '../../entities/category.entity';
import { GetProductsUseCase } from 'src/application/use-cases/product/get-product.use-case';
import { CategoryByProductLoader } from 'src/infrastructure/common/dataloaders/category-by-product.loader';
import { CreateProduct2UseCase } from 'src/application/use-cases/product/create-product-full.use-case';
import { CreateProductWithVariationsInput } from '../../dto/product/create-product.input';
import { ProductFiltersInput } from '../../dto/product/product-filters.input';
import { GetProductsByCategoriesUseCase } from 'src/application/use-cases/product/get-products-by-categories.use-case';
import { PaginationInput } from '../../dto/common/pagination.input';
import { PaginatedProductResponse } from '../../entities/paginated-product.entity';
import { NotFoundException, UseGuards } from '@nestjs/common';
import { Roles } from 'src/infrastructure/http/decorators/auth/roles.decorators';
import { GqlJwtAuthGuard } from '../../guards/gql-jwt-auth.guard';
import { GqlRolesGuard } from '../../guards/gql-roles.guard';
import { Role } from 'src/infrastructure/http/enums/auth/role.enums';
import { UpdateProductUseCase } from 'src/application/use-cases/product/update-product.use-case';
import { UpdateProductInput } from '../../dto/product/update-product.input';
import { SkipThrottle } from '@nestjs/throttler';
import { GetProductByIdUseCase } from 'src/application/use-cases/product/get-product-by-id.use-case';
@Resolver(() => ProductType)
export class ProductResolver {
  constructor(
    private readonly createProductWithVariationsUseCase: CreateProduct2UseCase,
    private readonly getProductsUseCase: GetProductsUseCase,
    private readonly categoryByProductLoader: CategoryByProductLoader,
    private readonly getProductsByCategoriesUseCase: GetProductsByCategoriesUseCase,
    private readonly updateProductUseCase: UpdateProductUseCase,
    private readonly getProductByIdUseCase: GetProductByIdUseCase,
  ) {}
  @SkipThrottle()
  @Query(() => PaginatedProductResponse, { name: 'products' })
  async getProducts(
    @Args('pagination', { nullable: true }) pagination?: PaginationInput,
  ): Promise<PaginatedProductResponse> {
    const result = await this.getProductsUseCase.execute({ pagination });

    return {
      data: result.data.map((product) =>
        ProductType.fromDomainToEntity(product),
      ),
      metadata: result.metadata,
    };
  }

  @Query(() => PaginatedProductResponse, { name: 'productsByCategories' })
  async getProductsByCategories(
    @Args('filters') filters: ProductFiltersInput,
  ): Promise<PaginatedProductResponse> {
    const result = await this.getProductsByCategoriesUseCase.execute({
      categoryNames: filters.categoryNames || [],
      pagination: {
        page: filters.page || 1,
        pageSize: filters.pageSize || 10,
        sortBy: filters.sortBy || 'created_at',
        sortOrder: filters.sortOrder || 'desc',
      },
    });

    return {
      data: result.data.map((product) =>
        ProductType.fromDomainToEntity(product),
      ),
      metadata: result.metadata,
    };
  }
  @Roles(Role.ADMIN)
  @UseGuards(GqlJwtAuthGuard, GqlRolesGuard)
  @Mutation(() => ProductType)
  async updateProduct(
    @Args('input') input: UpdateProductInput,
  ): Promise<ProductType> {
    const updatedProduct = await this.updateProductUseCase.execute(input.id, {
      name: input.name,
      description: input.description,
      isActive: input.isActive,
    });

    return ProductType.fromDomainToEntity(updatedProduct);
  }
  @Roles(Role.ADMIN)
  @UseGuards(GqlJwtAuthGuard, GqlRolesGuard)
  @Mutation(() => ProductType)
  async createProductWithVariations(
    @Args('input') input: CreateProductWithVariationsInput,
  ): Promise<ProductType> {
    const result = await this.createProductWithVariationsUseCase.execute({
      name: input.name,
      description: input.description || '',
      categoryIds: input.categoryNames || [],
      variations: (input.variations || []).map((variation) => ({
        ...variation,
        productId: variation.productId ?? '',
      })),
    });

    return ProductType.fromDomainToEntity(result);
  }
  @ResolveField(() => [CategoryType], { nullable: true })
  async categories(@Parent() product: ProductType): Promise<CategoryType[]> {
    const categories = await this.categoryByProductLoader.load(product.id);
    return categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      is_active: category.isActive,
      createdAt: category.createdAt,
    }));
  }
  @Query(() => ProductType, {
    nullable: true,
    name: 'product',
    description: 'Get a single product by ID with all details including images',
  })
  async findById(
    @Args('id', { description: 'Product ID' }) id: string,
  ): Promise<ProductType | null> {
    try {
      const product = await this.getProductByIdUseCase.execute(id);
      return ProductType.fromDomainToEntity(product);
    } catch (error) {
      if (error instanceof NotFoundException) {
        return null;
      }
      throw error;
    }
  }
}
