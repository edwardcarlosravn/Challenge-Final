import { Test, TestingModule } from '@nestjs/testing';
import { GetVariationsUseCase } from './find-all.user-case';
import { VariationRepository } from 'src/application/contracts/persistence/productVariation-repository.interface';
import { ProductVariation } from 'src/domain/variation';

describe('GetVariationsUseCase', () => {
  let useCase: GetVariationsUseCase;
  let mockVariationRepository: jest.Mocked<VariationRepository>;

  beforeEach(async () => {
    mockVariationRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      updateStatus: jest.fn(),
      findAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetVariationsUseCase,
        {
          provide: 'VariationRepository',
          useValue: mockVariationRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetVariationsUseCase>(GetVariationsUseCase);
  });

  describe('execute', () => {
    it('should return all variations from repository', async () => {
      const mockVariations = [
        new ProductVariation('variation-1', 'product-1', true),
        new ProductVariation('variation-2', 'product-2', false),
        new ProductVariation('variation-3', 'product-1', true),
      ];

      mockVariationRepository.findAll.mockResolvedValue(mockVariations);

      const result = await useCase.execute();

      expect(result).toEqual(mockVariations);
      expect(result).toHaveLength(3);
      expect(mockVariationRepository.findAll).toHaveBeenCalledWith();
      expect(mockVariationRepository.findAll).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no variations exist', async () => {
      mockVariationRepository.findAll.mockResolvedValue([]);

      const result = await useCase.execute();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
      expect(mockVariationRepository.findAll).toHaveBeenCalledWith();
    });

    it('should propagate repository errors', async () => {
      const repositoryError = new Error('Database connection failed');
      mockVariationRepository.findAll.mockRejectedValue(repositoryError);

      await expect(useCase.execute()).rejects.toThrow(
        'Database connection failed',
      );
      expect(mockVariationRepository.findAll).toHaveBeenCalledWith();
    });
  });
});
