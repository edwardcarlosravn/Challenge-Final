import { Test, TestingModule } from '@nestjs/testing';
import { PrismaUserFavoriteRepository } from './prisma-favorite.repository';
import { PrismaService } from '../prisma.service';
import { ErrorHandlerService } from 'src/infrastructure/common/error-handler.service';
import { UserFavoriteMapper } from '../mappers/favorite.mapper';
import { UserFavorite } from 'src/domain/favorite';
import { AddFavoriteDto } from 'src/application/dto/favorites/add-favorite.dto';

jest.mock('../mappers/favorite.mapper');

describe('PrismaUserFavoriteRepository', () => {
  let repository: PrismaUserFavoriteRepository;
  let mockPrismaService: any;
  let mockErrorHandlerService: any;
  const mockAddFavoriteDto: AddFavoriteDto = {
    userId: 1,
    productItemId: 100,
  };

  const mockProductItem = {
    id: 100,
    product_id: 1,
    sku: 'TSHIRT-001-S',
    color_name: 'Red',
    size_name: 'S',
    quantity_in_stock: 10,
    price: 25.99,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockPrismaUserFavorite = {
    id: 1,
    userId: 1,
    productItemId: 100,
    created_at: new Date('2024-01-01'),
  };

  const mockDomainUserFavorite = new UserFavorite(
    1,
    1,
    100,
    new Date('2024-01-01'),
  );

  beforeEach(async () => {
    mockPrismaService = {
      productItem: {
        findUnique: jest.fn(),
      },
      userFavorite: {
        findUnique: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
      },
    };

    mockErrorHandlerService = {
      handleDatabaseError: jest.fn(),
    };

    jest.clearAllMocks();

    (UserFavoriteMapper.toDomain as jest.Mock) = jest
      .fn()
      .mockReturnValue(mockDomainUserFavorite);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaUserFavoriteRepository,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ErrorHandlerService, useValue: mockErrorHandlerService },
      ],
    }).compile();

    repository = module.get<PrismaUserFavoriteRepository>(
      PrismaUserFavoriteRepository,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('addFavorite', () => {
    it('should add a favorite successfully when product exists and not already favorited', async () => {
      // Arrange
      mockPrismaService.productItem.findUnique.mockResolvedValue(
        mockProductItem,
      );
      mockPrismaService.userFavorite.findUnique.mockResolvedValue(null);
      mockPrismaService.userFavorite.create.mockResolvedValue(
        mockPrismaUserFavorite,
      );

      // Act
      const result = await repository.addFavorite(mockAddFavoriteDto);

      // Assert
      expect(result).toEqual(mockDomainUserFavorite);
      expect(mockPrismaService.productItem.findUnique).toHaveBeenCalledWith({
        where: { id: mockAddFavoriteDto.productItemId },
      });
      expect(mockPrismaService.userFavorite.create).toHaveBeenCalledWith({
        data: {
          userId: mockAddFavoriteDto.userId,
          productItemId: mockAddFavoriteDto.productItemId,
        },
      });
      expect(UserFavoriteMapper.toDomain).toHaveBeenCalledWith(
        mockPrismaUserFavorite,
      );
    });

    it('should throw error when product item does not exist', async () => {
      // Arrange
      mockPrismaService.productItem.findUnique.mockResolvedValue(null);
      const error = new Error(
        `Product item with ID ${mockAddFavoriteDto.productItemId} not found`,
      );
      mockErrorHandlerService.handleDatabaseError.mockImplementation(() => {
        throw error;
      });

      // Act & Assert
      await expect(
        repository.addFavorite(mockAddFavoriteDto),
      ).rejects.toThrow();
      expect(mockErrorHandlerService.handleDatabaseError).toHaveBeenCalled();
    });

    it('should throw error when product is already in favorites', async () => {
      // Arrange
      mockPrismaService.productItem.findUnique.mockResolvedValue(
        mockProductItem,
      );
      mockPrismaService.userFavorite.findUnique.mockResolvedValue(
        mockPrismaUserFavorite,
      );
      const error = new Error('Product item is already in favorites');
      mockErrorHandlerService.handleDatabaseError.mockImplementation(() => {
        throw error;
      });

      // Act & Assert
      await expect(
        repository.addFavorite(mockAddFavoriteDto),
      ).rejects.toThrow();
      expect(mockErrorHandlerService.handleDatabaseError).toHaveBeenCalled();
    });

    it('should handle database error during product lookup', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      mockPrismaService.productItem.findUnique.mockRejectedValue(error);
      mockErrorHandlerService.handleDatabaseError.mockImplementation(() => {
        throw error;
      });

      // Act & Assert
      await expect(
        repository.addFavorite(mockAddFavoriteDto),
      ).rejects.toThrow();
      expect(mockErrorHandlerService.handleDatabaseError).toHaveBeenCalledWith(
        error,
        'addFavorite',
      );
    });

    it('should handle database error during favorite creation', async () => {
      // Arrange
      mockPrismaService.productItem.findUnique.mockResolvedValue(
        mockProductItem,
      );
      mockPrismaService.userFavorite.findUnique.mockResolvedValue(null);
      const error = new Error('Failed to create favorite');
      mockPrismaService.userFavorite.create.mockRejectedValue(error);
      mockErrorHandlerService.handleDatabaseError.mockImplementation(() => {
        throw error;
      });

      // Act & Assert
      await expect(
        repository.addFavorite(mockAddFavoriteDto),
      ).rejects.toThrow();
      expect(mockErrorHandlerService.handleDatabaseError).toHaveBeenCalledWith(
        error,
        'addFavorite',
      );
    });
  });

  describe('getUserFavorites', () => {
    it('should return user favorites ordered by created_at desc - happy path', async () => {
      // Arrange
      const favorites = [mockPrismaUserFavorite];
      mockPrismaService.userFavorite.findMany.mockResolvedValue(favorites);

      // Act
      const result = await repository.getUserFavorites(1);

      // Assert
      expect(result).toEqual([mockDomainUserFavorite]);
      expect(mockPrismaService.userFavorite.findMany).toHaveBeenCalledWith({
        where: { userId: 1 },
        orderBy: { created_at: 'desc' },
      });
      expect(UserFavoriteMapper.toDomain).toHaveBeenCalledWith(
        mockPrismaUserFavorite,
      );
    });

    it('should return empty array when user has no favorites', async () => {
      // Arrange
      mockPrismaService.userFavorite.findMany.mockResolvedValue([]);

      // Act
      const result = await repository.getUserFavorites(1);

      // Assert
      expect(result).toEqual([]);
      expect(UserFavoriteMapper.toDomain).not.toHaveBeenCalled();
    });

    it('should handle database error during favorites retrieval', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      mockPrismaService.userFavorite.findMany.mockRejectedValue(error);
      mockErrorHandlerService.handleDatabaseError.mockImplementation(() => {
        throw error;
      });

      // Act & Assert
      await expect(repository.getUserFavorites(1)).rejects.toThrow();
      expect(mockErrorHandlerService.handleDatabaseError).toHaveBeenCalledWith(
        error,
        'getUserFavorites',
      );
    });
  });
});
