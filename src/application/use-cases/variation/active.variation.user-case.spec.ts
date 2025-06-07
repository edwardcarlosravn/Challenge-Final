import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ActivateVariationUseCase } from './active.variation.user-case';
import { VariationRepository } from 'src/application/contracts/persistence/productVariation-repository.interface';
import { ProductVariation } from 'src/domain/variation';

describe('ActivateVariationUseCase', () => {
  let useCase: ActivateVariationUseCase;
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
        ActivateVariationUseCase,
        {
          provide: 'VariationRepository',
          useValue: mockVariationRepository,
        },
      ],
    }).compile();

    useCase = module.get<ActivateVariationUseCase>(ActivateVariationUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const validVariationId = '123e4567-e89b-12d3-a456-426614174000';

    const mockVariation = new ProductVariation(
      validVariationId,
      'product-123',
      false,
    );

    const mockActivatedVariation = new ProductVariation(
      validVariationId,
      'product-123',
      true,
    );

    it('should successfully activate a variation', async () => {
      // Arrange
      mockVariationRepository.findById.mockResolvedValue(mockVariation);
      mockVariationRepository.updateStatus.mockResolvedValue(
        mockActivatedVariation,
      );

      // Act
      const result = await useCase.execute(validVariationId);

      // Assert
      expect(mockVariationRepository.findById).toHaveBeenCalledWith(
        validVariationId,
      );
      expect(mockVariationRepository.updateStatus).toHaveBeenCalledWith(
        validVariationId,
        true,
      );
      expect(result).toEqual(mockActivatedVariation);
      expect(result.isActive).toBe(true);
    });

    it('should throw NotFoundException when variation is not found', async () => {
      // Arrange
      mockVariationRepository.findById.mockResolvedValue(null);

      // Act & Assert
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

    it('should handle repository errors during findById', async () => {
      // Arrange
      const repositoryError = new Error('Database connection failed');
      mockVariationRepository.findById.mockRejectedValue(repositoryError);

      // Act & Assert
      await expect(useCase.execute(validVariationId)).rejects.toThrow(
        repositoryError,
      );
      expect(mockVariationRepository.findById).toHaveBeenCalledWith(
        validVariationId,
      );
      expect(mockVariationRepository.updateStatus).not.toHaveBeenCalled();
    });

    it('should handle repository errors during updateStatus', async () => {
      // Arrange
      const repositoryError = new Error('Failed to update variation status');
      mockVariationRepository.findById.mockResolvedValue(mockVariation);
      mockVariationRepository.updateStatus.mockRejectedValue(repositoryError);

      // Act & Assert
      await expect(useCase.execute(validVariationId)).rejects.toThrow(
        repositoryError,
      );
      expect(mockVariationRepository.findById).toHaveBeenCalledWith(
        validVariationId,
      );
      expect(mockVariationRepository.updateStatus).toHaveBeenCalledWith(
        validVariationId,
        true,
      );
    });

    it('should work with variations that are already active', async () => {
      // Arrange
      const alreadyActiveVariation = new ProductVariation(
        validVariationId,
        'product-123',
        true,
      );

      mockVariationRepository.findById.mockResolvedValue(
        alreadyActiveVariation,
      );
      mockVariationRepository.updateStatus.mockResolvedValue(
        alreadyActiveVariation,
      );

      // Act
      const result = await useCase.execute(validVariationId);

      // Assert
      expect(mockVariationRepository.findById).toHaveBeenCalledWith(
        validVariationId,
      );
      expect(mockVariationRepository.updateStatus).toHaveBeenCalledWith(
        validVariationId,
        true,
      );
      expect(result).toEqual(alreadyActiveVariation);
      expect(result.isActive).toBe(true);
    });
  });
});
