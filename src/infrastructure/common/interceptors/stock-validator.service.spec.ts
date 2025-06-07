import { Test, TestingModule } from '@nestjs/testing';
import { StockValidatorService } from './stock-validator.service';
import { PrismaService } from '../../persistence/prisma/prisma.service';

describe('StockValidatorService', () => {
  let service: StockValidatorService;
  let mockPrismaService: {
    productItem: {
      findMany: jest.MockedFunction<any>;
    };
  };

  beforeEach(async () => {
    mockPrismaService = {
      productItem: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockValidatorService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<StockValidatorService>(StockValidatorService);
  });

  describe('validateCartStock', () => {
    const mockCartItems = [
      { productItemId: 1, quantity: 2 },
      { productItemId: 2, quantity: 1 },
    ];

    it('should return valid result when all items have sufficient stock', async () => {
      const mockProductItems = [
        { id: 1, stock: 10, sku: 'SKU-001' },
        { id: 2, stock: 5, sku: 'SKU-002' },
      ];

      mockPrismaService.productItem.findMany.mockResolvedValue(
        mockProductItems,
      );

      const result = await service.validateCartStock(mockCartItems);

      expect(result).toEqual({
        isValid: true,
        insufficientStockItems: [],
      });
      expect(mockPrismaService.productItem.findMany).toHaveBeenCalledWith({
        where: { id: { in: [1, 2] } },
        select: { id: true, stock: true, sku: true },
      });
    });

    it('should return invalid result when some items have insufficient stock', async () => {
      const mockProductItems = [
        { id: 1, stock: 1, sku: 'SKU-001' },
        { id: 2, stock: 5, sku: 'SKU-002' },
      ];

      mockPrismaService.productItem.findMany.mockResolvedValue(
        mockProductItems,
      );

      const result = await service.validateCartStock(mockCartItems);

      expect(result).toEqual({
        isValid: false,
        insufficientStockItems: [
          {
            productItemId: 1,
            sku: 'SKU-001',
            requested: 2,
            available: 1,
          },
        ],
      });
    });

    it('should return invalid result when all items have insufficient stock', async () => {
      const mockProductItems = [
        { id: 1, stock: 0, sku: 'SKU-001' },
        { id: 2, stock: 0, sku: 'SKU-002' },
      ];

      mockPrismaService.productItem.findMany.mockResolvedValue(
        mockProductItems,
      );

      const result = await service.validateCartStock(mockCartItems);

      expect(result).toEqual({
        isValid: false,
        insufficientStockItems: [
          {
            productItemId: 1,
            sku: 'SKU-001',
            requested: 2,
            available: 0,
          },
          {
            productItemId: 2,
            sku: 'SKU-002',
            requested: 1,
            available: 0,
          },
        ],
      });
    });

    it('should handle empty cart items array', async () => {
      mockPrismaService.productItem.findMany.mockResolvedValue([]);

      const result = await service.validateCartStock([]);

      expect(result).toEqual({
        isValid: true,
        insufficientStockItems: [],
      });
      expect(mockPrismaService.productItem.findMany).toHaveBeenCalledWith({
        where: { id: { in: [] } },
        select: { id: true, stock: true, sku: true },
      });
    });

    it('should throw error when product item is not found', async () => {
      const cartItems = [{ productItemId: 999, quantity: 1 }];
      mockPrismaService.productItem.findMany.mockResolvedValue([]);

      await expect(service.validateCartStock(cartItems)).rejects.toThrow(
        'Product item 999 not found',
      );
    });

    it('should handle multiple cart items with mixed stock availability', async () => {
      const mixedCartItems = [
        { productItemId: 1, quantity: 2 },
        { productItemId: 2, quantity: 5 },
        { productItemId: 3, quantity: 1 },
        { productItemId: 4, quantity: 10 },
      ];
      const mockProductItems = [
        { id: 1, stock: 10, sku: 'SKU-001' },
        { id: 2, stock: 3, sku: 'SKU-002' },
        { id: 3, stock: 5, sku: 'SKU-003' },
        { id: 4, stock: 5, sku: 'SKU-004' },
      ];

      mockPrismaService.productItem.findMany.mockResolvedValue(
        mockProductItems,
      );

      const result = await service.validateCartStock(mixedCartItems);

      expect(result).toEqual({
        isValid: false,
        insufficientStockItems: [
          {
            productItemId: 2,
            sku: 'SKU-002',
            requested: 5,
            available: 3,
          },
          {
            productItemId: 4,
            sku: 'SKU-004',
            requested: 10,
            available: 5,
          },
        ],
      });
    });

    it('should handle database errors gracefully', async () => {
      const dbError = new Error('Database connection failed');
      mockPrismaService.productItem.findMany.mockRejectedValue(dbError);

      await expect(service.validateCartStock(mockCartItems)).rejects.toThrow(
        'Database connection failed',
      );
    });
  });
});
