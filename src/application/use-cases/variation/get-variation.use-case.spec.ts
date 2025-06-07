import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GetVariationUseCase } from './get-variation.use-case';
import { VariationRepository } from 'src/application/contracts/persistence/productVariation-repository.interface';
import { ProductVariation } from 'src/domain/variation';

describe('GetVariationUseCase', () => {
  let useCase: GetVariationUseCase;
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
        GetVariationUseCase,
        {
          provide: 'VariationRepository',
          useValue: mockVariationRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetVariationUseCase>(GetVariationUseCase);
  });

  describe('execute', () => {
    const validVariationId = '123e4567-e89b-12d3-a456-426614174000';
    const mockVariation = new ProductVariation(
      validVariationId,
      'product-123',
      true,
    );

    it('should return variation when it exists', async () => {
      mockVariationRepository.findById.mockResolvedValue(mockVariation);

      const result = await useCase.execute(validVariationId);

      expect(result).toEqual(mockVariation);
      expect(mockVariationRepository.findById).toHaveBeenCalledWith(
        validVariationId,
      );
      expect(mockVariationRepository.findById).toHaveBeenCalledTimes(1);
    });

    it('should throw error when variation ID is invalid', async () => {
      const invalidCases = ['', null, undefined, '   '];

      for (const invalidId of invalidCases) {
        await expect(useCase.execute(invalidId as any)).rejects.toThrow(
          'Variation ID is required',
        );
        expect(mockVariationRepository.findById).not.toHaveBeenCalled();
        jest.clearAllMocks();
      }
    });

    it('should throw NotFoundException when variation does not exist', async () => {
      mockVariationRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(validVariationId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(useCase.execute(validVariationId)).rejects.toThrow(
        `Variation with id ${validVariationId} not found`,
      );
      expect(mockVariationRepository.findById).toHaveBeenCalledWith(
        validVariationId,
      );
    });

    it('should propagate repository errors', async () => {
      const repositoryError = new Error('Database connection failed');
      mockVariationRepository.findById.mockRejectedValue(repositoryError);

      await expect(useCase.execute(validVariationId)).rejects.toThrow(
        'Database connection failed',
      );
      expect(mockVariationRepository.findById).toHaveBeenCalledWith(
        validVariationId,
      );
    });

    it('should preserve all variation properties in response', async () => {
      const completeVariation = new ProductVariation(
        validVariationId,
        'product-complete',
        true,
        [
          {
            id: 1,
            variationId: validVariationId,
            sku: 'SKU-123',
            price: 29.99,
            stock: 10,
            attributes: [],
          },
        ],
        [
          {
            id: '1',
            s3Key: 'images/product/variation-image.jpg',
            variationId: validVariationId,
            altText: 'Product image',
            createdAt: new Date(),
          },
        ],
      );

      mockVariationRepository.findById.mockResolvedValue(completeVariation);

      const result = await useCase.execute(validVariationId);

      expect(result).toEqual(completeVariation);
      expect(result.items).toHaveLength(1);
      expect(result.images).toHaveLength(1);
    });
  });
});
