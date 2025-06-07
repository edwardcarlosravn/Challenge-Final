import { Test, TestingModule } from '@nestjs/testing';
import { GetCategoriesUseCase } from './get-categories.use-case';
import { CategoryRepository } from 'src/application/contracts/persistence/category-repository.interface';
import { Category } from 'src/domain/category';

describe('GetCategoriesUseCase', () => {
  let useCase: GetCategoriesUseCase;
  const mockRepository = {
    findAll: jest.fn(),
    create: jest.fn(),
    existsByName: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetCategoriesUseCase,
        {
          provide: 'CategoryRepository',
          useValue: mockRepository as CategoryRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetCategoriesUseCase>(GetCategoriesUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return categories from repository', async () => {
      const expectedCategories = [
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

      mockRepository.findAll.mockResolvedValue(expectedCategories);

      const result = await useCase.execute();

      expect(mockRepository.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedCategories);
      expect(result).toHaveLength(2);
    });
    it('should return empty array when no categories exist', async () => {
      mockRepository.findAll.mockResolvedValue([]);

      const result = await useCase.execute();

      expect(mockRepository.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
    it('should propagate repository errors', async () => {
      const error = new Error('Database connection failed');
      mockRepository.findAll.mockRejectedValue(error);

      await expect(useCase.execute()).rejects.toThrow(
        'Database connection failed',
      );
      expect(mockRepository.findAll).toHaveBeenCalledTimes(1);
    });
  });
});
