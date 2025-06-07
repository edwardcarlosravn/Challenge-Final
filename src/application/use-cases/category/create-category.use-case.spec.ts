import { Test, TestingModule } from '@nestjs/testing';
import { CreateCategoryUseCase } from './create-category.use-case';
import { CategoryRepository } from 'src/application/contracts/persistence/category-repository.interface';
import { Category } from 'src/domain/category';

describe('CreateCategoryUseCase', () => {
  let useCase: CreateCategoryUseCase;
  const mockRepository = {
    findAll: jest.fn(),
    create: jest.fn(),
    existsByName: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateCategoryUseCase,
        {
          provide: 'CategoryRepository',
          useValue: mockRepository as CategoryRepository,
        },
      ],
    }).compile();

    useCase = module.get<CreateCategoryUseCase>(CreateCategoryUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    describe('Success scenarios', () => {
      it('should create category with all fields provided', async () => {
        // Arrange
        const input = {
          name: 'T-Shirts',
          slug: 't-shirts',
          description: 'Casual t-shirts collection',
        };
        const expectedCategory = new Category(
          1,
          'T-Shirts',
          't-shirts',
          'Casual t-shirts collection',
          true,
          new Date('2024-01-01'),
        );

        mockRepository.existsByName.mockResolvedValue(false);
        mockRepository.create.mockResolvedValue(expectedCategory);

        // Act
        const result = await useCase.execute(input);

        // Assert
        expect(mockRepository.existsByName).toHaveBeenCalledWith('T-Shirts');
        expect(mockRepository.create).toHaveBeenCalledWith({
          name: 'T-Shirts',
          slug: 't-shirts',
          description: 'Casual t-shirts collection',
        });
        expect(result).toEqual(expectedCategory);
        expect(result.name).toBe('T-Shirts');
        expect(result.slug).toBe('t-shirts');
        expect(result.description).toBe('Casual t-shirts collection');
      });

      it('should create category with only name provided (slug auto-generated)', async () => {
        // Arrange
        const input = {
          name: 'Hoodies',
        };
        const expectedCategory = new Category(
          2,
          'Hoodies',
          'Hoodies',
          undefined,
          true,
          new Date('2024-01-01'),
        );

        mockRepository.existsByName.mockResolvedValue(false);
        mockRepository.create.mockResolvedValue(expectedCategory);

        // Act
        const result = await useCase.execute(input);

        // Assert
        expect(mockRepository.existsByName).toHaveBeenCalledWith('Hoodies');
        expect(mockRepository.create).toHaveBeenCalledWith({
          name: 'Hoodies',
          slug: 'Hoodies',
          description: undefined,
        });
        expect(result).toEqual(expectedCategory);
        expect(result.slug).toBe('Hoodies');
        expect(result.description).toBeUndefined();
      });

      it('should create category with name and description but no slug', async () => {
        // Arrange
        const input = {
          name: 'Accessories',
          description: 'Fashion accessories and add-ons',
        };
        const expectedCategory = new Category(
          3,
          'Accessories',
          'Accessories',
          'Fashion accessories and add-ons',
          true,
          new Date('2024-01-01'),
        );

        mockRepository.existsByName.mockResolvedValue(false);
        mockRepository.create.mockResolvedValue(expectedCategory);

        // Act
        const result = await useCase.execute(input);

        // Assert
        expect(mockRepository.create).toHaveBeenCalledWith({
          name: 'Accessories',
          slug: 'Accessories',
          description: 'Fashion accessories and add-ons',
        });
        expect(result.slug).toBe('Accessories');
        expect(result.description).toBe('Fashion accessories and add-ons');
      });
    });

    describe('Error handling', () => {
      it('should throw error when category name already exists', async () => {
        // Arrange
        const input = {
          name: 'T-Shirts',
          slug: 't-shirts',
          description: 'Casual t-shirts collection',
        };

        mockRepository.existsByName.mockResolvedValue(true);

        // Act & Assert
        await expect(useCase.execute(input)).rejects.toThrow(
          'Category name already exists',
        );
        expect(mockRepository.existsByName).toHaveBeenCalledWith('T-Shirts');
        expect(mockRepository.create).not.toHaveBeenCalled();
      });

      it('should throw error when repository existsByName throws', async () => {
        // Arrange
        const input = {
          name: 'T-Shirts',
          slug: 't-shirts',
          description: 'Casual t-shirts collection',
        };
        const error = new Error('Database connection failed');

        mockRepository.existsByName.mockRejectedValue(error);

        // Act & Assert
        await expect(useCase.execute(input)).rejects.toThrow(
          'Database connection failed',
        );
        expect(mockRepository.existsByName).toHaveBeenCalledWith('T-Shirts');
        expect(mockRepository.create).not.toHaveBeenCalled();
      });

      it('should throw error when repository create fails', async () => {
        // Arrange
        const input = {
          name: 'T-Shirts',
          slug: 't-shirts',
          description: 'Casual t-shirts collection',
        };
        const error = new Error('Failed to create category');

        mockRepository.existsByName.mockResolvedValue(false);
        mockRepository.create.mockRejectedValue(error);

        // Act & Assert
        await expect(useCase.execute(input)).rejects.toThrow(
          'Failed to create category',
        );
        expect(mockRepository.existsByName).toHaveBeenCalledWith('T-Shirts');
        expect(mockRepository.create).toHaveBeenCalledWith({
          name: 'T-Shirts',
          slug: 't-shirts',
          description: 'Casual t-shirts collection',
        });
      });
    });
  });
});
