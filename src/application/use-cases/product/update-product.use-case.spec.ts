/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { UpdateProductUseCase } from './update-product.use-case';
import { ProductRepository } from 'src/application/contracts/persistence/product-repository.interface';
import { UpdateProductDto } from 'src/application/dto/product/update-product.dto';
import { Product } from 'src/domain/product';
import { Category } from 'src/domain/category';
import { ProductVariation } from 'src/domain/variation';
import { NotFoundException } from '@nestjs/common';

describe('UpdateProductUseCase', () => {
  let useCase: UpdateProductUseCase;
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
        UpdateProductUseCase,
        {
          provide: 'ProductRepository',
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<UpdateProductUseCase>(UpdateProductUseCase);
    mockProductRepository = module.get('ProductRepository');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const validProductId = 'product-123';

    it('should update a product successfully', async () => {
      // ARRANGE
      const updateData: UpdateProductDto = {
        name: 'Updated T-Shirt',
        description: 'Updated description',
        isActive: false,
      };

      const updatedProduct = new Product(
        validProductId,
        'Updated T-Shirt',
        'Updated description',
        mockCategories,
        false,
        new Date('2024-01-01'),
        new Date('2024-01-02'),
        mockProductVariations,
      );

      mockProductRepository.update.mockResolvedValue(updatedProduct);

      // ACT
      const result = await useCase.execute(validProductId, updateData);

      // ASSERT
      expect(mockProductRepository.update).toHaveBeenCalledWith(
        validProductId,
        updateData,
      );
      expect(result).toEqual(updatedProduct);
      expect(result.name).toBe('Updated T-Shirt');
      expect(result.description).toBe('Updated description');
      expect(result.isActive).toBe(false);
    });

    it('should maintain existing values for non-updated fields', async () => {
      // ARRANGE
      const updateData: UpdateProductDto = {
        name: 'New Product Name',
      };

      const partiallyUpdatedProduct = new Product(
        validProductId,
        'New Product Name',
        'Original description',
        mockCategories,
        true,
        new Date('2024-01-01'),
        new Date('2024-01-02'),
        mockProductVariations,
      );

      mockProductRepository.update.mockResolvedValue(partiallyUpdatedProduct);

      // ACT
      const result = await useCase.execute(validProductId, updateData);

      // ASSERT
      expect(mockProductRepository.update).toHaveBeenCalledWith(
        validProductId,
        updateData,
      );
      expect(result.name).toBe('New Product Name');
      expect(result.description).toBe('Original description');
      expect(result.isActive).toBe(true);
    });

    it('should throw error if product is not found', async () => {
      // ARRANGE
      const updateData: UpdateProductDto = {
        name: 'Valid Name',
      };

      const notFoundError = new NotFoundException('Product not found');
      mockProductRepository.update.mockRejectedValue(notFoundError);

      // ACT & ASSERT
      await expect(
        useCase.execute('non-existent-id', updateData),
      ).rejects.toThrow('Product not found');

      expect(mockProductRepository.update).toHaveBeenCalledWith(
        'non-existent-id',
        updateData,
      );
    });

    it('should throw error if update fails', async () => {
      // ARRANGE
      const updateData: UpdateProductDto = {
        name: 'Valid Name',
      };

      const repositoryError = new Error('Database connection failed');
      mockProductRepository.update.mockRejectedValue(repositoryError);

      // ACT & ASSERT
      await expect(useCase.execute(validProductId, updateData)).rejects.toThrow(
        'Database connection failed',
      );

      expect(mockProductRepository.update).toHaveBeenCalledWith(
        validProductId,
        updateData,
      );
    });
  });
});
