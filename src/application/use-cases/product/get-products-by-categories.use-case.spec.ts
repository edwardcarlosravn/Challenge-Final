/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import {
  GetProductsByCategoriesUseCase,
  GetProductsByCategoriesRequest,
} from './get-products-by-categories.use-case';
import { ProductRepository } from 'src/application/contracts/persistence/product-repository.interface';
import { Product } from 'src/domain/product';
import { Category } from 'src/domain/category';
import { ProductVariation } from 'src/domain/variation';
import {
  PaginatedResponse,
  PaginationInput,
} from 'src/application/dto/common/pagination.dto';

describe('GetProductsByCategoriesUseCase', () => {
  let useCase: GetProductsByCategoriesUseCase;
  let mockProductRepository: jest.Mocked<ProductRepository>;

  const mockCategories: Category[] = [
    new Category(
      1,
      'T-Shirts',
      't-shirts',
      'Casual t-shirts collection',
      true,
      new Date('2024-01-01'),
    ),
    new Category(
      2,
      'Cotton',
      'cotton',
      'Cotton material products',
      true,
      new Date('2024-01-01'),
    ),
  ];

  const mockProductVariations: ProductVariation[] = [
    new ProductVariation(
      'var-550e8400-e29b-41d4-a716-446655440001',
      'product-123',
      true,
      [],
      [],
    ),
  ];

  const mockProducts: Product[] = [
    new Product(
      'product-123',
      'Cotton T-Shirt',
      'A comfortable cotton t-shirt',
      mockCategories,
      true,
      new Date('2024-01-01'),
      new Date('2024-01-01'),
      mockProductVariations,
    ),
    new Product(
      'product-456',
      'Basic T-Shirt',
      'A basic t-shirt',
      [mockCategories[0]],
      true,
      new Date('2024-01-02'),
      new Date('2024-01-02'),
      mockProductVariations,
    ),
  ];

  const mockPaginatedResponse: PaginatedResponse<Product> = {
    data: mockProducts,
    metadata: {
      totalItems: 2,
      totalPages: 1,
      currentPage: 1,
      pageSize: 10,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  };

  beforeEach(async () => {
    const mockRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      createProduct: jest.fn(),
      findByCategoryNames: jest.fn(),
      update: jest.fn(),
      getProductsWithCategoriesByIds: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetProductsByCategoriesUseCase,
        {
          provide: 'ProductRepository',
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetProductsByCategoriesUseCase>(
      GetProductsByCategoriesUseCase,
    );
    mockProductRepository = module.get('ProductRepository');
  });

  describe('execute', () => {
    it('should return products filtered by category names', async () => {
      const request: GetProductsByCategoriesRequest = {
        categoryNames: ['t-shirts', 'cotton'],
        pagination: {
          page: 1,
          pageSize: 10,
          sortBy: 'created_at',
          sortOrder: 'desc',
        },
      };

      mockProductRepository.findByCategoryNames.mockResolvedValue(
        mockPaginatedResponse,
      );

      const result = await useCase.execute(request);

      expect(mockProductRepository.findByCategoryNames).toHaveBeenCalledWith(
        ['t-shirts', 'cotton'],
        request.pagination,
      );
      expect(result).toEqual(mockPaginatedResponse);
      expect(result.data).toHaveLength(2);
      expect(result.metadata.totalItems).toBe(2);
    });

    it('should return all products when no category names provided', async () => {
      const emptyCases = [
        { categoryNames: [], description: 'empty array' },
        { categoryNames: undefined, description: 'undefined' },
      ];

      for (const testCase of emptyCases) {
        const request: GetProductsByCategoriesRequest = {
          categoryNames: testCase.categoryNames as string[],
          pagination: {
            page: 1,
            pageSize: 10,
            sortBy: 'created_at',
            sortOrder: 'desc',
          },
        };

        mockProductRepository.findAll.mockResolvedValue(mockPaginatedResponse);

        const result = await useCase.execute(request);

        expect(mockProductRepository.findAll).toHaveBeenCalledWith(
          request.pagination,
        );
        expect(
          mockProductRepository.findByCategoryNames,
        ).not.toHaveBeenCalled();
        expect(result).toEqual(mockPaginatedResponse);

        jest.clearAllMocks();
      }
    });

    it('should use default pagination when not provided', async () => {
      const request: GetProductsByCategoriesRequest = {
        categoryNames: ['t-shirts'],
      };

      const expectedPagination: PaginationInput = {
        page: 1,
        pageSize: 10,
        sortBy: 'created_at',
        sortOrder: 'desc',
      };

      mockProductRepository.findByCategoryNames.mockResolvedValue(
        mockPaginatedResponse,
      );

      const result = await useCase.execute(request);

      expect(mockProductRepository.findByCategoryNames).toHaveBeenCalledWith(
        ['t-shirts'],
        expectedPagination,
      );
      expect(result).toEqual(mockPaginatedResponse);
    });

    it('should handle empty result when no products match categories', async () => {
      const request: GetProductsByCategoriesRequest = {
        categoryNames: ['non-existent-category'],
        pagination: {
          page: 1,
          pageSize: 10,
          sortBy: 'created_at',
          sortOrder: 'desc',
        },
      };

      const emptyResponse: PaginatedResponse<Product> = {
        data: [],
        metadata: {
          totalItems: 0,
          totalPages: 0,
          currentPage: 1,
          pageSize: 10,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };

      mockProductRepository.findByCategoryNames.mockResolvedValue(
        emptyResponse,
      );

      const result = await useCase.execute(request);

      expect(mockProductRepository.findByCategoryNames).toHaveBeenCalledWith(
        ['non-existent-category'],
        request.pagination,
      );
      expect(result).toEqual(emptyResponse);
      expect(result.data).toHaveLength(0);
      expect(result.metadata.totalItems).toBe(0);
    });

    it('should propagate repository errors', async () => {
      const request: GetProductsByCategoriesRequest = {
        categoryNames: ['t-shirts'],
        pagination: {
          page: 1,
          pageSize: 10,
          sortBy: 'created_at',
          sortOrder: 'desc',
        },
      };

      const repositoryError = new Error('Database connection failed');
      mockProductRepository.findByCategoryNames.mockRejectedValue(
        repositoryError,
      );

      await expect(useCase.execute(request)).rejects.toThrow(
        'Database connection failed',
      );
      expect(mockProductRepository.findByCategoryNames).toHaveBeenCalledWith(
        ['t-shirts'],
        request.pagination,
      );
    });
  });
});
