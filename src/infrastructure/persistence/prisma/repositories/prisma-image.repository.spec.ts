/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaVariationImageRepository } from './prisma-image.repository';
import { PrismaService } from '../prisma.service';
import { ErrorHandlerService } from 'src/infrastructure/common/error-handler.service';
import { VariationImageMapper } from '../mappers/variation-image.mapper';
import { VariationImage } from 'src/domain/variation-image';

jest.mock('../mappers/variation-image.mapper');

describe('PrismaVariationImageRepository', () => {
  let repository: PrismaVariationImageRepository;
  let mockPrismaService: any;
  let mockErrorHandlerService: any;

  // Shared mock data - ONLY USED ONES
  const mockS3Key = 'variations/123/image-1.jpg';
  const mockVariationId = 'variation-123';

  const mockPrismaVariationImage = {
    id: '1',
    s3Key: mockS3Key,
    variationId: mockVariationId,
    altText: null,
    createdAt: new Date('2024-01-01'),
  };

  const mockDomainVariationImage = new VariationImage(
    '1',
    mockS3Key,
    mockVariationId,
    null,
    new Date('2024-01-01'),
  );

  beforeEach(async () => {
    mockPrismaService = {
      variationImage: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
    };

    mockErrorHandlerService = {
      handleDatabaseError: jest.fn(),
    };

    jest.clearAllMocks();

    (VariationImageMapper.toDomain as jest.Mock) = jest
      .fn()
      .mockReturnValue(mockDomainVariationImage);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaVariationImageRepository,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ErrorHandlerService, useValue: mockErrorHandlerService },
      ],
    }).compile();

    repository = module.get<PrismaVariationImageRepository>(
      PrismaVariationImageRepository,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create variation image successfully with valid data', async () => {
      // Arrange
      mockPrismaService.variationImage.create.mockResolvedValue(
        mockPrismaVariationImage,
      );

      // Act
      const result = await repository.create(mockS3Key, mockVariationId);

      // Assert
      expect(result).toEqual(mockDomainVariationImage);
      expect(mockPrismaService.variationImage.create).toHaveBeenCalledWith({
        data: {
          s3Key: mockS3Key,
          variationId: mockVariationId,
        },
      });
      expect(VariationImageMapper.toDomain).toHaveBeenCalledWith(
        mockPrismaVariationImage,
      );
    });

    it('should handle database error during image creation', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      mockPrismaService.variationImage.create.mockRejectedValue(error);
      mockErrorHandlerService.handleDatabaseError.mockImplementation(() => {
        throw error;
      });

      // Act & Assert
      await expect(
        repository.create(mockS3Key, mockVariationId),
      ).rejects.toThrow();
      expect(mockErrorHandlerService.handleDatabaseError).toHaveBeenCalledWith(
        error,
        'create',
      );
    });

    it('should handle invalid variationId constraint violation', async () => {
      // Arrange
      const constraintError = new Error('Foreign key constraint violation');
      mockPrismaService.variationImage.create.mockRejectedValue(
        constraintError,
      );
      mockErrorHandlerService.handleDatabaseError.mockImplementation(() => {
        throw constraintError;
      });

      // Act & Assert
      await expect(
        repository.create(mockS3Key, 'invalid-variation-id'),
      ).rejects.toThrow();
      expect(mockErrorHandlerService.handleDatabaseError).toHaveBeenCalledWith(
        constraintError,
        'create',
      );
    });
  });

  describe('findManyByVariationId', () => {
    it('should return array of variation images when images exist', async () => {
      // Arrange
      const mockImages = [mockPrismaVariationImage];
      mockPrismaService.variationImage.findMany.mockResolvedValue(mockImages);

      // Act
      const result = await repository.findManyByVariationId(mockVariationId);

      // Assert
      expect(result).toEqual([mockDomainVariationImage]);
      expect(mockPrismaService.variationImage.findMany).toHaveBeenCalledWith({
        where: { variationId: mockVariationId },
      });
      expect(VariationImageMapper.toDomain).toHaveBeenCalledWith(
        mockPrismaVariationImage,
      );
    });

    it('should return empty array when no images exist for variation', async () => {
      // Arrange
      mockPrismaService.variationImage.findMany.mockResolvedValue([]);

      // Act
      const result = await repository.findManyByVariationId(mockVariationId);

      // Assert
      expect(result).toEqual([]);
      expect(mockPrismaService.variationImage.findMany).toHaveBeenCalledWith({
        where: { variationId: mockVariationId },
      });
      expect(VariationImageMapper.toDomain).not.toHaveBeenCalled();
    });

    it('should handle database error during images retrieval', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      mockPrismaService.variationImage.findMany.mockRejectedValue(error);
      mockErrorHandlerService.handleDatabaseError.mockImplementation(() => {
        throw error;
      });

      // Act & Assert
      await expect(
        repository.findManyByVariationId(mockVariationId),
      ).rejects.toThrow();
      expect(mockErrorHandlerService.handleDatabaseError).toHaveBeenCalledWith(
        error,
        'findManyByVariationId',
      );
    });
  });
});
