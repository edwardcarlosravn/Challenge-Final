import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { PrismaCategoryRepository } from './prisma-category.repository';
import { PrismaService } from '../prisma.service';
import { Category } from '../../../../domain/category';
import { CategoryMapper } from '../mappers/category.mapper';
import { ProductCategory } from '@prisma/client';

jest.mock('../mappers/category.mapper');

describe('PrismaCategoryRepository', () => {
  let repository: PrismaCategoryRepository;
  let mockPrismaService: {
    productCategory: {
      findMany: jest.MockedFunction<(...args: any[]) => Promise<any>>;
      create: jest.MockedFunction<(...args: any[]) => Promise<ProductCategory>>;
      count: jest.MockedFunction<(...args: any[]) => Promise<number>>;
    };
  };

  const mockCategoryMapperToDomain =
    CategoryMapper.toDomain as jest.MockedFunction<
      (category: ProductCategory) => Category
    >;

  beforeEach(async () => {
    mockPrismaService = {
      productCategory: {
        findMany: jest.fn(),
        create: jest.fn(),
        count: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaCategoryRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<PrismaCategoryRepository>(PrismaCategoryRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return array of categories - happy path', async () => {
      // Arrange
      const mockPrismaCategories: ProductCategory[] = [
        {
          id: 1,
          name: 'T-Shirts',
          slug: 't-shirts',
          description: 'Casual t-shirts collection',
          is_active: true,
          created_at: new Date('2024-01-01'),
        },
        {
          id: 2,
          name: 'Hoodies',
          slug: 'hoodies',
          description: 'Warm hoodies collection',
          is_active: true,
          created_at: new Date('2024-01-02'),
        },
      ];

      const mockDomainCategories = [
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
          'Hoodies',
          'hoodies',
          'Warm hoodies collection',
          true,
          new Date('2024-01-02'),
        ),
      ];

      mockPrismaService.productCategory.findMany.mockResolvedValue(
        mockPrismaCategories,
      );
      mockCategoryMapperToDomain
        .mockReturnValueOnce(mockDomainCategories[0])
        .mockReturnValueOnce(mockDomainCategories[1]);

      // Act
      const result = await repository.findAll();

      // Assert
      expect(result).toEqual(mockDomainCategories);
      expect(result).toHaveLength(2);
      expect(mockPrismaService.productCategory.findMany).toHaveBeenCalledWith({
        where: { is_active: true },
        orderBy: { created_at: 'desc' },
      });
      expect(mockCategoryMapperToDomain).toHaveBeenCalledTimes(2);
    });

    it('should return empty array when no active categories exist', async () => {
      // Arrange
      mockPrismaService.productCategory.findMany.mockResolvedValue([]);

      // Act
      const result = await repository.findAll();

      // Assert
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
      expect(mockPrismaService.productCategory.findMany).toHaveBeenCalledWith({
        where: { is_active: true },
        orderBy: { created_at: 'desc' },
      });
      expect(mockCategoryMapperToDomain).not.toHaveBeenCalled();
    });

    it('should handle database error during findAll', async () => {
      // Arrange
      const databaseError = new Error('Database connection failed');
      mockPrismaService.productCategory.findMany.mockRejectedValue(
        databaseError,
      );

      // Act & Assert
      await expect(repository.findAll()).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(repository.findAll()).rejects.toThrow(
        'Failed to retrieve categories',
      );
    });
  });

  describe('create', () => {
    const mockCategoryInput = {
      name: 'New Category',
      slug: 'new-category',
      description: 'A new category description',
    };

    it('should create a new category with default values', async () => {
      // Arrange
      const mockCreatedPrismaCategory: ProductCategory = {
        id: 1,
        name: 'New Category',
        slug: 'new-category',
        description: 'A new category description',
        is_active: true,
        created_at: new Date('2024-01-01'),
      };

      const mockDomainCategory = new Category(
        1,
        'New Category',
        'new-category',
        'A new category description',
        true,
        new Date('2024-01-01'),
      );

      mockPrismaService.productCategory.create.mockResolvedValue(
        mockCreatedPrismaCategory,
      );
      mockCategoryMapperToDomain.mockReturnValue(mockDomainCategory);

      // Act
      const result = await repository.create(mockCategoryInput);

      // Assert
      expect(result).toEqual(mockDomainCategory);
      expect(mockPrismaService.productCategory.create).toHaveBeenCalledWith({
        data: {
          name: 'New Category',
          slug: 'new-category',
          description: 'A new category description',
          is_active: true,
          created_at: expect.any(Date) as unknown as Date,
        },
      });
      expect(mockCategoryMapperToDomain).toHaveBeenCalledWith(
        mockCreatedPrismaCategory,
      );
    });

    it('should handle unique constraint violation', async () => {
      // Arrange
      const constraintError = new Error('Unique constraint violation');
      mockPrismaService.productCategory.create.mockRejectedValue(
        constraintError,
      );

      // Act & Assert
      await expect(repository.create(mockCategoryInput)).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(repository.create(mockCategoryInput)).rejects.toThrow(
        'Failed to create category',
      );
      expect(mockCategoryMapperToDomain).not.toHaveBeenCalled();
    });

    it('should handle validation error for missing required fields', async () => {
      // Arrange
      const validationError = new Error(
        'Validation failed: missing required fields',
      );
      mockPrismaService.productCategory.create.mockRejectedValue(
        validationError,
      );

      // Act & Assert
      await expect(repository.create(mockCategoryInput)).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(repository.create(mockCategoryInput)).rejects.toThrow(
        'Failed to create category',
      );
    });
  });

  describe('existsByName', () => {
    it('should return true when category exists', async () => {
      // Arrange
      const categoryName = 'Existing Category';
      mockPrismaService.productCategory.count.mockResolvedValue(1);

      // Act
      const result = await repository.existsByName(categoryName);

      // Assert
      expect(result).toBe(true);
      expect(mockPrismaService.productCategory.count).toHaveBeenCalledWith({
        where: { name: categoryName },
      });
    });

    it('should handle empty string name', async () => {
      // Arrange
      const emptyName = '';
      mockPrismaService.productCategory.count.mockResolvedValue(0);

      // Act
      const result = await repository.existsByName(emptyName);

      // Assert
      expect(result).toBe(false);
      expect(mockPrismaService.productCategory.count).toHaveBeenCalledWith({
        where: { name: emptyName },
      });
    });

    it('should handle database error during count', async () => {
      // Arrange
      const categoryName = 'Error Category';
      const databaseError = new Error('Database connection failed');
      mockPrismaService.productCategory.count.mockRejectedValue(databaseError);

      // Act & Assert
      await expect(repository.existsByName(categoryName)).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(repository.existsByName(categoryName)).rejects.toThrow(
        'Failed to check category existence',
      );
    });
  });

  describe('validateAndGetIds', () => {
    it('should return IDs for existing active categories', async () => {
      // Arrange
      const categoryNames = ['T-Shirts', 'Hoodies'];
      const mockFoundCategories = [{ id: 1 }, { id: 2 }];

      mockPrismaService.productCategory.findMany.mockResolvedValue(
        mockFoundCategories,
      );

      // Act
      const result = await repository.validateAndGetIds(categoryNames);

      // Assert
      expect(result).toEqual([1, 2]);
      expect(mockPrismaService.productCategory.findMany).toHaveBeenCalledWith({
        where: {
          name: {
            in: categoryNames,
            mode: 'insensitive',
          },
          is_active: true,
        },
        select: { id: true },
      });
    });

    it('should return empty array when no categories match', async () => {
      // Arrange
      const categoryNames = ['Non-existing Category'];
      mockPrismaService.productCategory.findMany.mockResolvedValue([]);

      // Act
      const result = await repository.validateAndGetIds(categoryNames);

      // Assert
      expect(result).toEqual([]);
      expect(mockPrismaService.productCategory.findMany).toHaveBeenCalledWith({
        where: {
          name: {
            in: categoryNames,
            mode: 'insensitive',
          },
          is_active: true,
        },
        select: { id: true },
      });
    });

    it('should handle case insensitive matching', async () => {
      // Arrange
      const categoryNames = ['t-shirts', 'HOODIES'];
      const mockFoundCategories = [{ id: 1 }, { id: 2 }];

      mockPrismaService.productCategory.findMany.mockResolvedValue(
        mockFoundCategories,
      );

      // Act
      const result = await repository.validateAndGetIds(categoryNames);

      // Assert
      expect(result).toEqual([1, 2]);
      expect(mockPrismaService.productCategory.findMany).toHaveBeenCalledWith({
        where: {
          name: {
            in: categoryNames,
            mode: 'insensitive',
          },
          is_active: true,
        },
        select: { id: true },
      });
    });

    it('should ignore inactive categories', async () => {
      // Arrange
      const categoryNames = ['Active Category', 'Inactive Category'];
      const mockFoundCategories = [{ id: 1 }];

      mockPrismaService.productCategory.findMany.mockResolvedValue(
        mockFoundCategories,
      );

      // Act
      const result = await repository.validateAndGetIds(categoryNames);

      // Assert
      expect(result).toEqual([1]);
      expect(mockPrismaService.productCategory.findMany).toHaveBeenCalledWith({
        where: {
          name: {
            in: categoryNames,
            mode: 'insensitive',
          },
          is_active: true,
        },
        select: { id: true },
      });
    });

    it('should handle empty names array', async () => {
      // Arrange
      const categoryNames: string[] = [];
      mockPrismaService.productCategory.findMany.mockResolvedValue([]);

      // Act
      const result = await repository.validateAndGetIds(categoryNames);

      // Assert
      expect(result).toEqual([]);
      expect(mockPrismaService.productCategory.findMany).toHaveBeenCalledWith({
        where: {
          name: {
            in: [],
            mode: 'insensitive',
          },
          is_active: true,
        },
        select: { id: true },
      });
    });

    it('should handle database error during validateAndGetIds', async () => {
      // Arrange
      const categoryNames = ['Test Category'];
      const databaseError = new Error('Database connection failed');
      mockPrismaService.productCategory.findMany.mockRejectedValue(
        databaseError,
      );

      // Act & Assert
      await expect(repository.validateAndGetIds(categoryNames)).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(repository.validateAndGetIds(categoryNames)).rejects.toThrow(
        'Failed to validate categories',
      );
    });
  });
});
