import { Test, TestingModule } from '@nestjs/testing';
import { GetCategoriesByProductIdsUseCase } from './get-categories-by-id-product.use-case';
import { ProductRepository } from 'src/application/contracts/persistence/product-repository.interface';
import { Category } from 'src/domain/category';
import { Product } from 'src/domain/product';

describe('GetCategoriesByProductIdsUseCase', () => {
  let useCase: GetCategoriesByProductIdsUseCase;
  let mockProductRepository: jest.Mocked<ProductRepository>;

  beforeEach(async () => {
    const mockRepository = {
      getProductsWithCategoriesByIds: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      createProduct: jest.fn(),
      findByCategoryNames: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetCategoriesByProductIdsUseCase,
        { provide: 'ProductRepository', useValue: mockRepository },
      ],
    }).compile();

    useCase = module.get<GetCategoriesByProductIdsUseCase>(
      GetCategoriesByProductIdsUseCase,
    );
    mockProductRepository = module.get('ProductRepository');
  });

  describe('execute', () => {
    const mockCategories: Category[] = [
      new Category(
        1,
        'T-Shirts',
        't-shirts',
        'Casual t-shirts',
        true,
        new Date(),
      ),
      new Category(2, 'Hoodies', 'hoodies', 'Warm hoodies', true, new Date()),
      new Category(
        3,
        'Accessories',
        'accessories',
        'Fashion accessories',
        true,
        new Date(),
      ),
    ];

    it('should transform products into categories Map correctly', async () => {
      const mockProducts: Product[] = [
        {
          id: 'product-1',
          name: 'Basic T-Shirt',
          description: 'A basic cotton t-shirt',
          isActive: true,
          createdAt: new Date(),
          variations: [],
          categories: [mockCategories[0], mockCategories[2]],
          updatedAt: new Date(),
        },
        {
          id: 'product-2',
          name: 'Premium Hoodie',
          description: 'A premium cotton hoodie',
          isActive: true,
          createdAt: new Date(),
          variations: [],
          categories: [mockCategories[1]],
          updatedAt: new Date(),
        },
        {
          id: 'product-3',
          name: 'Uncategorized Product',
          description: 'Product without categories',
          isActive: true,
          createdAt: new Date(),
          variations: [],
          categories: [],
          updatedAt: new Date(),
        },
      ];

      const productIds = ['product-1', 'product-2', 'product-3'];
      mockProductRepository.getProductsWithCategoriesByIds.mockResolvedValue(
        mockProducts,
      );

      const result = await useCase.execute({ productIds });

      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(3);

      expect(result.get('product-1')).toEqual([
        mockCategories[0],
        mockCategories[2],
      ]);
      expect(result.get('product-2')).toEqual([mockCategories[1]]);
      expect(result.get('product-3')).toEqual([]);

      expect(
        mockProductRepository.getProductsWithCategoriesByIds,
      ).toHaveBeenCalledWith(productIds);
      expect(
        mockProductRepository.getProductsWithCategoriesByIds,
      ).toHaveBeenCalledTimes(1);
    });

    it('should return empty Map when no products found', async () => {
      const productIds = ['non-existent-1', 'non-existent-2'];
      mockProductRepository.getProductsWithCategoriesByIds.mockResolvedValue(
        [],
      );

      const result = await useCase.execute({ productIds });

      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(0);
      expect(
        mockProductRepository.getProductsWithCategoriesByIds,
      ).toHaveBeenCalledWith(productIds);
    });

    it('should propagate repository errors', async () => {
      const repositoryError = new Error('Database connection failed');
      const productIds = ['product-1', 'product-2'];

      mockProductRepository.getProductsWithCategoriesByIds.mockRejectedValue(
        repositoryError,
      );

      await expect(useCase.execute({ productIds })).rejects.toThrow(
        'Database connection failed',
      );
      expect(
        mockProductRepository.getProductsWithCategoriesByIds,
      ).toHaveBeenCalledWith(productIds);
    });

    it('should not modify input parameters', async () => {
      const originalInput = { productIds: ['product-1', 'product-2'] };
      const originalValues = {
        ...originalInput,
        productIds: [...originalInput.productIds],
      };

      mockProductRepository.getProductsWithCategoriesByIds.mockResolvedValue(
        [],
      );

      await useCase.execute(originalInput);

      expect(originalInput).toEqual(originalValues);
    });
  });
});
