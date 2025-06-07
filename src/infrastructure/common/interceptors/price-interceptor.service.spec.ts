import { Test, TestingModule } from '@nestjs/testing';
import {
  PriceInterceptorService,
  CartItemWithCurrentPrice,
} from './price-interceptor.service';
import { PrismaService } from '../../persistence/prisma/prisma.service';

describe('PriceInterceptorService', () => {
  let service: PriceInterceptorService;
  let mockPrismaService: {
    productItem: {
      findUnique: jest.MockedFunction<any>;
      findMany: jest.MockedFunction<any>;
    };
  };

  beforeEach(async () => {
    mockPrismaService = {
      productItem: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PriceInterceptorService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<PriceInterceptorService>(PriceInterceptorService);
  });

  describe('getCartItemsWithCurrentPrices', () => {
    it('should return cart items with current prices and line totals', async () => {
      const mockCartItems = [
        { productItemId: 1, quantity: 2 },
        { productItemId: 2, quantity: 1 },
      ];

      const mockProductItem1 = { price: 29.99, stock: 10 };
      const mockProductItem2 = { price: 49.99, stock: 5 };

      mockPrismaService.productItem.findUnique
        .mockResolvedValueOnce(mockProductItem1)
        .mockResolvedValueOnce(mockProductItem2);

      const expectedResult: CartItemWithCurrentPrice[] = [
        {
          productItemId: 1,
          quantity: 2,
          currentPrice: 29.99,
          lineTotal: 59.98,
        },
        {
          productItemId: 2,
          quantity: 1,
          currentPrice: 49.99,
          lineTotal: 49.99,
        },
      ];

      const result = await service.getCartItemsWithCurrentPrices(mockCartItems);

      expect(mockPrismaService.productItem.findUnique).toHaveBeenCalledTimes(2);
      expect(result).toEqual(expectedResult);
    });

    it('should handle empty cart items array', async () => {
      const emptyCartItems: Array<{
        productItemId: number;
        quantity: number;
      }> = [];

      const result =
        await service.getCartItemsWithCurrentPrices(emptyCartItems);

      expect(mockPrismaService.productItem.findUnique).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should throw error when product item is not found', async () => {
      const cartItems = [{ productItemId: 999, quantity: 1 }];
      mockPrismaService.productItem.findUnique.mockResolvedValue(null);

      await expect(
        service.getCartItemsWithCurrentPrices(cartItems),
      ).rejects.toThrow('Product item 999 not found');
    });

    it('should handle database errors', async () => {
      const cartItems = [{ productItemId: 1, quantity: 1 }];
      const databaseError = new Error('Database connection failed');

      mockPrismaService.productItem.findUnique.mockRejectedValue(databaseError);

      await expect(
        service.getCartItemsWithCurrentPrices(cartItems),
      ).rejects.toThrow('Database connection failed');
    });
  });

  describe('calculateOrderTotal', () => {
    it('should calculate total for multiple items', async () => {
      const cartItems = [
        { productItemId: 1, quantity: 2 },
        { productItemId: 2, quantity: 1 },
        { productItemId: 3, quantity: 3 },
      ];

      const mockProductItems = [
        { price: 10, stock: 20 },
        { price: 25.5, stock: 15 },
        { price: 5.99, stock: 30 },
      ];

      mockPrismaService.productItem.findUnique
        .mockResolvedValueOnce(mockProductItems[0])
        .mockResolvedValueOnce(mockProductItems[1])
        .mockResolvedValueOnce(mockProductItems[2]);

      const result = await service.calculateOrderTotal(cartItems);

      expect(result).toBe(63.47);
    });

    it('should return zero for empty cart', async () => {
      const emptyCartItems: Array<{
        productItemId: number;
        quantity: number;
      }> = [];

      const result = await service.calculateOrderTotal(emptyCartItems);

      expect(result).toBe(0);
      expect(mockPrismaService.productItem.findUnique).not.toHaveBeenCalled();
    });

    it('should propagate errors from getCartItemsWithCurrentPrices', async () => {
      const cartItems = [{ productItemId: 999, quantity: 1 }];
      mockPrismaService.productItem.findUnique.mockResolvedValue(null);

      await expect(service.calculateOrderTotal(cartItems)).rejects.toThrow(
        'Product item 999 not found',
      );
    });
  });

  describe('validateProductItemsExist', () => {
    it('should not throw error when all product items exist', async () => {
      const productItemIds = [1, 2, 3];
      const mockExistingItems = [{ id: 1 }, { id: 2 }, { id: 3 }];

      mockPrismaService.productItem.findMany.mockResolvedValue(
        mockExistingItems,
      );

      await expect(
        service.validateProductItemsExist(productItemIds),
      ).resolves.toBeUndefined();
      expect(mockPrismaService.productItem.findMany).toHaveBeenCalledWith({
        where: { id: { in: [1, 2, 3] } },
        select: { id: true },
      });
    });

    it('should throw error when some product items do not exist', async () => {
      const productItemIds = [1, 2, 3, 4];
      const mockExistingItems = [{ id: 1 }, { id: 3 }]; // Missing 2 and 4

      mockPrismaService.productItem.findMany.mockResolvedValue(
        mockExistingItems,
      );

      await expect(
        service.validateProductItemsExist(productItemIds),
      ).rejects.toThrow('Product items not found: 2, 4');
    });

    it('should handle empty product items array', async () => {
      const productItemIds: number[] = [];

      await expect(
        service.validateProductItemsExist(productItemIds),
      ).resolves.toBeUndefined();
      expect(mockPrismaService.productItem.findMany).toHaveBeenCalledWith({
        where: { id: { in: [] } },
        select: { id: true },
      });
    });

    it('should handle database errors', async () => {
      const productItemIds = [1, 2];
      const databaseError = new Error('Database query failed');

      mockPrismaService.productItem.findMany.mockRejectedValue(databaseError);

      await expect(
        service.validateProductItemsExist(productItemIds),
      ).rejects.toThrow('Database query failed');
    });
  });
});
