/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import { RedisStockAlert } from './redis-stock-alert.service';
import { PrismaService } from 'src/infrastructure/persistence/prisma/prisma.service';
import { getQueueToken } from '@nestjs/bull';

describe('RedisStockAlert', () => {
  let service: RedisStockAlert;
  let mockPrismaService: any;
  let mockStockQueue: any;

  const mockProductItemId = 1;
  const mockUserId = 1;

  const mockProductItemLowStock = {
    id: mockProductItemId,
    stock: 2,
    variation: {
      id: 1,
      product: {
        id: 1,
        name: 'Test Product',
      },
    },
  };

  const mockProductItemHighStock = {
    id: mockProductItemId,
    stock: 5,
    variation: {
      id: 1,
      product: {
        id: 1,
        name: 'Test Product',
      },
    },
  };

  const mockEligibleUserFavorite = {
    id: 1,
    userId: mockUserId,
    productItemId: mockProductItemId,
    created_at: new Date('2024-01-15'),
    user: {
      id: mockUserId,
      email: 'user@test.com',
    },
  };

  const mockRecentUserFavorite = {
    id: 2,
    userId: 2,
    productItemId: mockProductItemId,
    created_at: new Date('2024-01-20'),
    user: {
      id: 2,
      email: 'recent@test.com',
    },
  };

  const mockExistingStockAlert = {
    id: 1,
    userId: mockUserId,
    productItemId: mockProductItemId,
    notifiedAt: new Date(),
  };

  beforeEach(async () => {
    const mockPrisma = {
      productItem: {
        findUnique: jest.fn(),
      },
      userFavorite: {
        findFirst: jest.fn(),
      },
      stockAlert: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
    };

    const mockQueue = {
      add: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisStockAlert,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: getQueueToken('stock-notifications'),
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<RedisStockAlert>(RedisStockAlert);
    mockPrismaService = module.get(PrismaService);
    mockStockQueue = module.get(getQueueToken('stock-notifications'));

    jest.clearAllMocks();
  });

  describe('checkStockAndNotify', () => {
    it('should notify user when stock is low and user has favorites but no purchases', async () => {
      // Arrange
      mockPrismaService.productItem.findUnique.mockResolvedValue(
        mockProductItemLowStock,
      );
      mockPrismaService.userFavorite.findFirst.mockResolvedValue(
        mockEligibleUserFavorite,
      );
      mockPrismaService.stockAlert.findFirst.mockResolvedValue(null);
      mockPrismaService.stockAlert.create.mockResolvedValue({
        id: 1,
        userId: mockUserId,
        productItemId: mockProductItemId,
        notifiedAt: new Date(),
      });

      // Act
      await service.checkStockAndNotify(mockProductItemId);

      // Assert
      expect(mockPrismaService.productItem.findUnique).toHaveBeenCalledWith({
        where: { id: mockProductItemId },
        include: {
          variation: {
            include: {
              product: true,
            },
          },
        },
      });

      expect(mockPrismaService.userFavorite.findFirst).toHaveBeenCalledWith({
        where: {
          productItemId: mockProductItemId,
          user: {
            shopOrders: {
              none: {
                orderLines: {
                  some: {
                    productItemId: mockProductItemId,
                  },
                },
              },
            },
          },
        },
        orderBy: { created_at: 'desc' },
        include: { user: true },
      });

      expect(mockPrismaService.stockAlert.findFirst).toHaveBeenCalledWith({
        where: {
          userId: mockUserId,
          productItemId: mockProductItemId,
        },
      });

      expect(mockStockQueue.add).toHaveBeenCalledWith('notify-user', {
        userId: mockUserId,
        productItemId: mockProductItemId,
      });

      expect(mockPrismaService.stockAlert.create).toHaveBeenCalledWith({
        data: {
          userId: mockUserId,
          productItemId: mockProductItemId,
          notifiedAt: expect.any(Date),
        },
      });
    });

    it('should handle low stock scenario with multiple favorites but selects most recent', async () => {
      // Arrange
      mockPrismaService.productItem.findUnique.mockResolvedValue(
        mockProductItemLowStock,
      );
      mockPrismaService.userFavorite.findFirst.mockResolvedValue(
        mockRecentUserFavorite,
      );
      mockPrismaService.stockAlert.findFirst.mockResolvedValue(null);

      // Act
      await service.checkStockAndNotify(mockProductItemId);

      // Assert
      expect(mockPrismaService.userFavorite.findFirst).toHaveBeenCalledWith({
        where: {
          productItemId: mockProductItemId,
          user: {
            shopOrders: {
              none: {
                orderLines: {
                  some: {
                    productItemId: mockProductItemId,
                  },
                },
              },
            },
          },
        },
        orderBy: { created_at: 'desc' },
        include: { user: true },
      });

      expect(mockStockQueue.add).toHaveBeenCalledWith('notify-user', {
        userId: 2,
        productItemId: mockProductItemId,
      });
    });

    it('should throw error when ProductItem not found', async () => {
      // Arrange
      mockPrismaService.productItem.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.checkStockAndNotify(mockProductItemId),
      ).rejects.toThrow('ProductItem not found');

      expect(mockPrismaService.userFavorite.findFirst).not.toHaveBeenCalled();
      expect(mockStockQueue.add).not.toHaveBeenCalled();
    });

    it('should throw error when sufficient stock available', async () => {
      // Arrange
      mockPrismaService.productItem.findUnique.mockResolvedValue(
        mockProductItemHighStock,
      );

      // Act & Assert
      await expect(
        service.checkStockAndNotify(mockProductItemId),
      ).rejects.toThrow('Sufficient stock available, no notification required');

      expect(mockPrismaService.userFavorite.findFirst).not.toHaveBeenCalled();
      expect(mockStockQueue.add).not.toHaveBeenCalled();
    });

    it('should throw error when notification already sent', async () => {
      // Arrange
      mockPrismaService.productItem.findUnique.mockResolvedValue(
        mockProductItemLowStock,
      );
      mockPrismaService.userFavorite.findFirst.mockResolvedValue(
        mockEligibleUserFavorite,
      );
      mockPrismaService.stockAlert.findFirst.mockResolvedValue(
        mockExistingStockAlert,
      );

      // Act & Assert
      await expect(
        service.checkStockAndNotify(mockProductItemId),
      ).rejects.toThrow(
        'Notification already sent to this user for this product',
      );

      expect(mockStockQueue.add).not.toHaveBeenCalled();
      expect(mockPrismaService.stockAlert.create).not.toHaveBeenCalled();
    });

    it('should handle Redis queue error during notification', async () => {
      // Arrange
      mockPrismaService.productItem.findUnique.mockResolvedValue(
        mockProductItemLowStock,
      );
      mockPrismaService.userFavorite.findFirst.mockResolvedValue(
        mockEligibleUserFavorite,
      );
      mockPrismaService.stockAlert.findFirst.mockResolvedValue(null);
      mockStockQueue.add.mockRejectedValue(
        new Error('Redis connection failed'),
      );

      // Act & Assert
      await expect(
        service.checkStockAndNotify(mockProductItemId),
      ).rejects.toThrow('Redis connection failed');

      expect(mockPrismaService.stockAlert.create).not.toHaveBeenCalled();
    });
  });
});
