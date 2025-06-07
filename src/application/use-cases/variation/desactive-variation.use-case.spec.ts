import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DeactivateVariationUseCase } from './desactive-variation.use-case';
import { VariationRepository } from 'src/application/contracts/persistence/productVariation-repository.interface';
import { ProductVariation } from 'src/domain/variation';

describe('DeactivateVariationUseCase', () => {
  let useCase: DeactivateVariationUseCase;
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
        DeactivateVariationUseCase,
        {
          provide: 'VariationRepository',
          useValue: mockVariationRepository,
        },
      ],
    }).compile();

    useCase = module.get<DeactivateVariationUseCase>(
      DeactivateVariationUseCase,
    );
  });

  describe('execute', () => {
    const validVariationId = '123e4567-e89b-12d3-a456-426614174000';
    const mockVariation = new ProductVariation(
      validVariationId,
      'product-123',
      true,
    );
    const mockDeactivatedVariation = new ProductVariation(
      validVariationId,
      'product-123',
      false,
    );

    it('should successfully deactivate a variation when it exists', async () => {
      mockVariationRepository.findById.mockResolvedValue(mockVariation);
      mockVariationRepository.updateStatus.mockResolvedValue(
        mockDeactivatedVariation,
      );

      const result = await useCase.execute(validVariationId);

      expect(result).toEqual(mockDeactivatedVariation);
      expect(result.isActive).toBe(false);
      expect(mockVariationRepository.findById).toHaveBeenCalledWith(
        validVariationId,
      );
      expect(mockVariationRepository.updateStatus).toHaveBeenCalledWith(
        validVariationId,
        false,
      );
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
      expect(mockVariationRepository.updateStatus).not.toHaveBeenCalled();
    });

    it('should propagate repository errors from findById', async () => {
      const repositoryError = new Error('Database connection failed');
      mockVariationRepository.findById.mockRejectedValue(repositoryError);

      await expect(useCase.execute(validVariationId)).rejects.toThrow(
        'Database connection failed',
      );
      expect(mockVariationRepository.findById).toHaveBeenCalledWith(
        validVariationId,
      );
      expect(mockVariationRepository.updateStatus).not.toHaveBeenCalled();
    });

    it('should propagate repository errors from updateStatus', async () => {
      const repositoryError = new Error('Failed to update variation status');
      mockVariationRepository.findById.mockResolvedValue(mockVariation);
      mockVariationRepository.updateStatus.mockRejectedValue(repositoryError);

      await expect(useCase.execute(validVariationId)).rejects.toThrow(
        'Failed to update variation status',
      );
      expect(mockVariationRepository.findById).toHaveBeenCalledWith(
        validVariationId,
      );
      expect(mockVariationRepository.updateStatus).toHaveBeenCalledWith(
        validVariationId,
        false,
      );
    });
  });
});
