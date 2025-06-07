/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma.service';
import { ErrorHandlerService } from 'src/infrastructure/common/error-handler.service';
import { PrismaProductRepository } from './prisma-product.repository';
import { ProductMapper } from '../mappers/product.mapper';
import { CategoryMapper } from '../mappers/category.mapper';
import { Product } from 'src/domain/product';
import { Category } from 'src/domain/category';
import { CreateProductWithVariationsDto } from 'src/application/dto/product/create-product.dto';

jest.mock('../mappers/product.mapper');
jest.mock('../mappers/category.mapper');

describe('PrismaProductRepository', () => {
  let repository: PrismaProductRepository;
  let prismaService: PrismaService;
  let errorHandlerService: ErrorHandlerService;

  const mockProductDomain = new Product(
    '550e8400-e29b-41d4-a716-446655440000',
    'Premium Cotton T-Shirt',
    'High-quality cotton t-shirt',
    [],
    true,
    new Date('2024-01-01'),
    new Date('2024-01-01'),
    [],
  );

  const mockPrismaProduct = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Premium Cotton T-Shirt',
    description: 'High-quality cotton t-shirt',
    is_active: true,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
    categories: [],
    variations: [],
  };

  const mockCategoryDomain = new Category(
    1,
    'T-Shirts',
    't-shirts',
    'Casual t-shirts',
    true,
    new Date('2024-01-01'),
  );

  const mockCreateProductDto: CreateProductWithVariationsDto = {
    name: 'New Product',
    description: 'A new product',
    categoryIds: ['T-Shirts'],
    variations: [
      {
        productId: 'product-123',
        items: [
          {
            sku: 'SKU-001',
            price: 39.99,
            stock: 50,
            attributes: [{ attributeValueId: 1 }],
          },
        ],
      },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaProductRepository,
        {
          provide: PrismaService,
          useValue: {
            product: {
              count: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            productCategory: {
              findMany: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
        {
          provide: ErrorHandlerService,
          useValue: {
            handleDatabaseError: jest.fn(),
          },
        },
      ],
    }).compile();

    repository = module.get<PrismaProductRepository>(PrismaProductRepository);
    prismaService = module.get<PrismaService>(PrismaService);
    errorHandlerService = module.get<ErrorHandlerService>(ErrorHandlerService);
  });

  describe('findAll', () => {
    it('should return paginated products with proper structure', async () => {
      const mockPaginationInput = { page: 1, pageSize: 10 };
      const mockProducts = [mockPrismaProduct];
      const totalItems = 1;

      (prismaService.product.count as jest.Mock).mockResolvedValue(totalItems);
      (prismaService.product.findMany as jest.Mock).mockResolvedValue(
        mockProducts,
      );
      (ProductMapper.toDomain as jest.Mock).mockReturnValue(mockProductDomain);

      const result = await repository.findAll(mockPaginationInput);

      expect(prismaService.product.count).toHaveBeenCalledWith({
        where: { is_active: true },
      });
      expect(prismaService.product.findMany).toHaveBeenCalledWith({
        where: { is_active: true },
        orderBy: { created_at: 'desc' },
        skip: 0,
        take: 10,
        include: expect.objectContaining({
          categories: true,
          variations: expect.any(Object),
        }),
      });
      expect(result.data).toEqual([mockProductDomain]);
      expect(result.metadata.totalItems).toBe(1);
      expect(result.metadata.currentPage).toBe(1);
    });

    it('should handle database error during products retrieval', async () => {
      const error = new Error('Database connection error');
      (prismaService.product.count as jest.Mock).mockRejectedValue(error);

      await repository.findAll();

      expect(errorHandlerService.handleDatabaseError).toHaveBeenCalledWith(
        error,
        'findAll',
      );
    });
  });

  describe('findByCategoryNames', () => {
    it('should return products filtered by category names', async () => {
      const categoryNames = ['T-Shirts', 'Cotton'];
      const mockPaginationInput = { page: 1, pageSize: 10 };
      const mockProducts = [mockPrismaProduct];
      const totalItems = 1;

      (prismaService.product.count as jest.Mock).mockResolvedValue(totalItems);
      (prismaService.product.findMany as jest.Mock).mockResolvedValue(
        mockProducts,
      );
      (ProductMapper.toDomain as jest.Mock).mockReturnValue(mockProductDomain);

      const result = await repository.findByCategoryNames(
        categoryNames,
        mockPaginationInput,
      );

      const expectedWhereCondition = {
        is_active: true,
        categories: {
          some: {
            name: {
              in: categoryNames,
              mode: 'insensitive',
            },
            is_active: true,
          },
        },
      };

      expect(prismaService.product.count).toHaveBeenCalledWith({
        where: expectedWhereCondition,
      });
      expect(prismaService.product.findMany).toHaveBeenCalledWith({
        where: expectedWhereCondition,
        orderBy: { created_at: 'desc' },
        skip: 0,
        take: 10,
        include: expect.any(Object),
      });
      expect(result.data).toEqual([mockProductDomain]);
    });

    it('should handle database error during category filtering', async () => {
      const error = new Error('Database query error');
      (prismaService.product.count as jest.Mock).mockRejectedValue(error);

      await repository.findByCategoryNames(['T-Shirts']);

      expect(errorHandlerService.handleDatabaseError).toHaveBeenCalledWith(
        error,
        'findByCategoryNames',
      );
    });
  });

  describe('createProduct', () => {
    it('should create product with variations successfully', async () => {
      const mockExistingCategories = [{ id: 1, name: 'T-Shirts' }];
      const mockCreatedProduct = {
        ...mockPrismaProduct,
        id: 'new-product-id',
        name: mockCreateProductDto.name,
      };

      (prismaService.productCategory.findMany as jest.Mock).mockResolvedValue(
        mockExistingCategories,
      );
      (prismaService.$transaction as jest.Mock).mockImplementation(
        async (callback) => {
          const tx = {
            product: {
              create: jest.fn().mockResolvedValue(mockCreatedProduct),
            },
            productVariation: {
              create: jest.fn(),
            },
          };
          return await callback(tx);
        },
      );
      (ProductMapper.toDomain as jest.Mock).mockReturnValue(mockProductDomain);

      const result = await repository.createProduct(mockCreateProductDto);

      expect(prismaService.productCategory.findMany).toHaveBeenCalledWith({
        where: { name: { in: mockCreateProductDto.categoryIds } },
        select: { id: true, name: true },
      });
      expect(prismaService.$transaction).toHaveBeenCalled();
      expect(result).toEqual(mockProductDomain);
    });

    it('should create product without variations', async () => {
      const dtoNoVariations = { ...mockCreateProductDto, variations: [] };
      const mockExistingCategories = [{ id: 1, name: 'T-Shirts' }];

      (prismaService.productCategory.findMany as jest.Mock).mockResolvedValue(
        mockExistingCategories,
      );
      (prismaService.$transaction as jest.Mock).mockImplementation(
        async (callback) => {
          const tx = {
            product: {
              create: jest.fn().mockResolvedValue(mockPrismaProduct),
            },
          };
          return await callback(tx);
        },
      );
      (ProductMapper.toDomain as jest.Mock).mockReturnValue(mockProductDomain);

      const result = await repository.createProduct(dtoNoVariations);

      expect(result).toEqual(mockProductDomain);
    });

    it('should throw error when categories are not found', async () => {
      const dtoInvalidCategory = {
        ...mockCreateProductDto,
        categoryIds: ['NonExistentCategory'],
      };

      (prismaService.productCategory.findMany as jest.Mock).mockResolvedValue(
        [],
      );

      await repository.createProduct(dtoInvalidCategory);

      expect(errorHandlerService.handleDatabaseError).toHaveBeenCalledWith(
        new Error('Category Not Found: NonExistentCategory'),
        'createProduct',
      );
    });

    it('should handle database error during product creation', async () => {
      const error = new Error('Transaction failed');
      const mockExistingCategories = [{ id: 1, name: 'T-Shirts' }];

      (prismaService.productCategory.findMany as jest.Mock).mockResolvedValue(
        mockExistingCategories,
      );
      (prismaService.$transaction as jest.Mock).mockRejectedValue(error);

      await repository.createProduct(mockCreateProductDto);

      expect(errorHandlerService.handleDatabaseError).toHaveBeenCalledWith(
        error,
        'createProduct',
      );
    });
  });

  describe('getProductsWithCategoriesByIds', () => {
    it('should return products with categories by IDs', async () => {
      const productIds = ['550e8400-e29b-41d4-a716-446655440000'];
      const mockProducts = [mockPrismaProduct];

      (prismaService.product.findMany as jest.Mock).mockResolvedValue(
        mockProducts,
      );
      (ProductMapper.toDomain as jest.Mock).mockReturnValue(mockProductDomain);
      (CategoryMapper.toDomain as jest.Mock).mockReturnValue(
        mockCategoryDomain,
      );

      const result =
        await repository.getProductsWithCategoriesByIds(productIds);

      expect(prismaService.product.findMany).toHaveBeenCalledWith({
        where: { id: { in: productIds }, is_active: true },
        include: expect.objectContaining({
          categories: true,
          variations: expect.any(Object),
        }),
      });
      expect(result).toHaveLength(1);
    });

    it('should handle database error during products retrieval by IDs', async () => {
      const error = new Error('Database query error');
      const productIds = ['550e8400-e29b-41d4-a716-446655440000'];

      (prismaService.product.findMany as jest.Mock).mockRejectedValue(error);

      await repository.getProductsWithCategoriesByIds(productIds);

      expect(errorHandlerService.handleDatabaseError).toHaveBeenCalledWith(
        error,
        'getProductsWithCategoriesByIds',
      );
    });
  });

  describe('update', () => {
    it('should update product successfully', async () => {
      const productId = '550e8400-e29b-41d4-a716-446655440000';
      const updateData = {
        name: 'Updated Product Name',
        description: 'Updated description',
        isActive: false,
      };
      const mockUpdatedProduct = {
        ...mockPrismaProduct,
        ...updateData,
        is_active: updateData.isActive,
      };

      (prismaService.product.update as jest.Mock).mockResolvedValue(
        mockUpdatedProduct,
      );
      (ProductMapper.toDomain as jest.Mock).mockReturnValue(mockProductDomain);

      const result = await repository.update(productId, updateData);

      expect(prismaService.product.update).toHaveBeenCalledWith({
        where: { id: productId },
        data: {
          name: updateData.name,
          description: updateData.description,
          is_active: updateData.isActive,
          updated_at: expect.any(Date),
        },
      });
      expect(result).toEqual(mockProductDomain);
    });

    it('should handle database error during product update', async () => {
      const error = new Error('Update failed');
      const productId = '550e8400-e29b-41d4-a716-446655440000';

      (prismaService.product.update as jest.Mock).mockRejectedValue(error);

      await repository.update(productId, { name: 'Updated Name' });

      expect(errorHandlerService.handleDatabaseError).toHaveBeenCalledWith(
        error,
        'update',
      );
    });
  });

  describe('findById', () => {
    it('should return product when found by ID', async () => {
      const productId = '550e8400-e29b-41d4-a716-446655440000';

      (prismaService.product.findUnique as jest.Mock).mockResolvedValue(
        mockPrismaProduct,
      );
      (ProductMapper.toDomain as jest.Mock).mockReturnValue(mockProductDomain);

      const result = await repository.findById(productId);

      expect(prismaService.product.findUnique).toHaveBeenCalledWith({
        where: { id: productId, is_active: true },
        include: expect.objectContaining({
          categories: true,
          variations: expect.any(Object),
        }),
      });
      expect(result).toEqual(mockProductDomain);
    });

    it('should return null when product not found', async () => {
      const productId = 'non-existent-id';

      (prismaService.product.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await repository.findById(productId);

      expect(ProductMapper.toDomain).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should handle database error during product retrieval by ID', async () => {
      const error = new Error('Database connection error');
      const productId = '550e8400-e29b-41d4-a716-446655440000';

      (prismaService.product.findUnique as jest.Mock).mockRejectedValue(error);

      await repository.findById(productId);

      expect(errorHandlerService.handleDatabaseError).toHaveBeenCalledWith(
        error,
        'findById',
      );
    });
  });
});
