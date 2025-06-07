import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GetProductByIdUseCase } from './get-product-by-id.use-case';
import { ProductRepository } from 'src/application/contracts/persistence/product-repository.interface';
import { Product } from 'src/domain/product';
import { Category } from 'src/domain/category';
import { ProductVariation } from 'src/domain/variation';

describe('GetProductByIdUseCase', () => {
  let useCase: GetProductByIdUseCase;
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

  const mockProduct: Product = new Product(
    'product-123',
    'Test T-Shirt',
    'A comfortable test t-shirt',
    mockCategories,
    true,
    new Date('2024-01-01'),
    new Date('2024-01-01'),
    mockProductVariations,
  );

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
        GetProductByIdUseCase,
        {
          provide: 'ProductRepository',
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetProductByIdUseCase>(GetProductByIdUseCase);
    mockProductRepository = module.get('ProductRepository');
  });

  describe('execute', () => {
    const validProductId = 'product-123';

    it('should return product when found by valid ID', async () => {
      mockProductRepository.findById.mockResolvedValue(mockProduct);

      const result = await useCase.execute(validProductId);

      expect(mockProductRepository.findById).toHaveBeenCalledWith(
        validProductId,
      );
      expect(result).toEqual(mockProduct);
      expect(result.id).toBe('product-123');
      expect(result.name).toBe('Test T-Shirt');
    });

    it('should throw NotFoundException when product ID is invalid', async () => {
      const invalidCases = ['', '   ', '\t \n ', '   \t\n   '];

      for (const invalidId of invalidCases) {
        await expect(useCase.execute(invalidId)).rejects.toThrow(
          NotFoundException,
        );
        await expect(useCase.execute(invalidId)).rejects.toThrow(
          'Product ID is required',
        );
        expect(mockProductRepository.findById).not.toHaveBeenCalled();
        jest.clearAllMocks();
      }
    });

    it('should throw NotFoundException when product is not found', async () => {
      const nonExistentId = 'non-existent-product-id';
      mockProductRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(nonExistentId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(useCase.execute(nonExistentId)).rejects.toThrow(
        `Product with ID ${nonExistentId} not found`,
      );
      expect(mockProductRepository.findById).toHaveBeenCalledWith(
        nonExistentId,
      );
    });
    it('should propagate repository errors', async () => {
      const repositoryError = new Error('Database connection failed');
      mockProductRepository.findById.mockRejectedValue(repositoryError);

      await expect(useCase.execute(validProductId)).rejects.toThrow(
        'Database connection failed',
      );
      expect(mockProductRepository.findById).toHaveBeenCalledWith(
        validProductId,
      );
    });
  });
});
