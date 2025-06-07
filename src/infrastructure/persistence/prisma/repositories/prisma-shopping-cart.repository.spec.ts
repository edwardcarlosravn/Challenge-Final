/* eslint-disable @typescript-eslint/unbound-method */

import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma.service';
import { ErrorHandlerService } from 'src/infrastructure/common/error-handler.service';
import { PrismaShoppingCartRepository } from './prisma-shopping-cart.repository';
import { ShoppingCartMapper } from '../mappers/shopping-cart.mapper';
import { ShoppingCartItemMapper } from '../mappers/shopping-cart-item.mapper';
import { ShoppingCart } from 'src/domain/cart';
import { ShoppingCartItem } from 'src/domain/cart-item';
import { AddItemToCartDto } from 'src/application/dto/shopping-cart/add-item-to-cart.dto';
import { UpdateCartItemDto } from 'src/application/dto/shopping-cart/update-cart-item.dto';

jest.mock('../mappers/shopping-cart.mapper');
jest.mock('../mappers/shopping-cart-item.mapper');

describe('PrismaShoppingCartRepository', () => {
  let repository: PrismaShoppingCartRepository;
  let prismaService: PrismaService;
  let errorHandlerService: ErrorHandlerService;

  const mockUserId = 1;
  const mockCartId = 10;
  const mockCartItemId = 1;
  const mockProductItemId = 123;

  const mockDomainCart = new ShoppingCart(
    mockCartId,
    mockUserId,
    [],
    new Date('2024-01-01'),
    new Date('2024-01-01'),
  );

  const mockDomainCartItem = new ShoppingCartItem(
    mockCartItemId,
    mockCartId,
    mockProductItemId,
    2,
    new Date('2024-01-01'),
    new Date('2024-01-01'),
  );

  const mockPrismaCart = {
    id: mockCartId,
    userId: mockUserId,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
    items: [],
  };

  const mockPrismaCartItem = {
    id: mockCartItemId,
    cartId: mockCartId,
    productItemId: mockProductItemId,
    quantity: 2,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaShoppingCartRepository,
        {
          provide: PrismaService,
          useValue: {
            shoppingCart: {
              findFirst: jest.fn(),
              create: jest.fn(),
            },
            shoppingCartItem: {
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              deleteMany: jest.fn(),
            },
          },
        },
        {
          provide: ErrorHandlerService,
          useValue: {
            handleDatabaseError: jest.fn(),
          },
        },
      ],
    }).compile();

    repository = module.get<PrismaShoppingCartRepository>(
      PrismaShoppingCartRepository,
    );
    prismaService = module.get<PrismaService>(PrismaService);
    errorHandlerService = module.get<ErrorHandlerService>(ErrorHandlerService);

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByUserId', () => {
    it('should return shopping cart when found for user', async () => {
      (prismaService.shoppingCart.findFirst as jest.Mock).mockResolvedValue(
        mockPrismaCart,
      );
      (ShoppingCartMapper.toDomain as jest.Mock).mockReturnValue(
        mockDomainCart,
      );

      const result = await repository.findByUserId(mockUserId);

      expect(prismaService.shoppingCart.findFirst).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        include: {
          items: {
            orderBy: { created_at: 'desc' },
          },
        },
      });
      expect(ShoppingCartMapper.toDomain).toHaveBeenCalledWith(mockPrismaCart);
      expect(result).toEqual(mockDomainCart);
    });

    it('should handle database error during cart retrieval', async () => {
      const error = new Error('Database connection failed');
      (prismaService.shoppingCart.findFirst as jest.Mock).mockRejectedValue(
        error,
      );

      await expect(repository.findByUserId(mockUserId)).rejects.toThrow(
        'Database connection failed',
      );
    });
  });

  describe('addItem', () => {
    const mockAddItemDto: AddItemToCartDto = {
      userId: mockUserId,
      productItemId: mockProductItemId,
      quantity: 2,
    };

    it('should add new item to existing cart', async () => {
      // Mock existing cart
      (repository.findByUserId as jest.Mock) = jest
        .fn()
        .mockResolvedValue(mockDomainCart);
      (repository.findCartItemByProductItem as jest.Mock) = jest
        .fn()
        .mockResolvedValue(null);
      (prismaService.shoppingCartItem.create as jest.Mock).mockResolvedValue(
        mockPrismaCartItem,
      );
      (ShoppingCartItemMapper.toDomain as jest.Mock).mockReturnValue(
        mockDomainCartItem,
      );

      const result = await repository.addItem(mockAddItemDto);

      expect(prismaService.shoppingCartItem.create).toHaveBeenCalledWith({
        data: {
          cartId: mockCartId,
          productItemId: mockProductItemId,
          quantity: 2,
        },
      });
      expect(ShoppingCartItemMapper.toDomain).toHaveBeenCalledWith(
        mockPrismaCartItem,
      );
      expect(result).toEqual(mockDomainCartItem);
    });

    it('should update quantity of existing item in cart', async () => {
      const existingItem = new ShoppingCartItem(
        mockCartItemId,
        mockCartId,
        mockProductItemId,
        1,
        new Date(),
        new Date(),
      );
      const updatedPrismaItem = { ...mockPrismaCartItem, quantity: 3 };
      const updatedDomainItem = new ShoppingCartItem(
        mockCartItemId,
        mockCartId,
        mockProductItemId,
        3,
        new Date(),
        new Date(),
      );

      (repository.findByUserId as jest.Mock) = jest
        .fn()
        .mockResolvedValue(mockDomainCart);
      (repository.findCartItemByProductItem as jest.Mock) = jest
        .fn()
        .mockResolvedValue(existingItem);
      (prismaService.shoppingCartItem.update as jest.Mock).mockResolvedValue(
        updatedPrismaItem,
      );
      (ShoppingCartItemMapper.toDomain as jest.Mock).mockReturnValue(
        updatedDomainItem,
      );

      const result = await repository.addItem(mockAddItemDto);

      expect(prismaService.shoppingCartItem.update).toHaveBeenCalledWith({
        where: { id: mockCartItemId },
        data: {
          quantity: 3,
          updated_at: expect.any(Date),
        },
      });
      expect(result).toEqual(updatedDomainItem);
    });

    it('should create cart and add item when user has no cart', async () => {
      const newCart = new ShoppingCart(
        mockCartId,
        mockUserId,
        [],
        new Date(),
        new Date(),
      );

      (repository.findByUserId as jest.Mock) = jest
        .fn()
        .mockResolvedValue(null);
      (repository.createForUser as jest.Mock) = jest
        .fn()
        .mockResolvedValue(newCart);
      (repository.findCartItemByProductItem as jest.Mock) = jest
        .fn()
        .mockResolvedValue(null);
      (prismaService.shoppingCartItem.create as jest.Mock).mockResolvedValue(
        mockPrismaCartItem,
      );
      (ShoppingCartItemMapper.toDomain as jest.Mock).mockReturnValue(
        mockDomainCartItem,
      );

      const result = await repository.addItem(mockAddItemDto);

      expect(prismaService.shoppingCartItem.create).toHaveBeenCalledWith({
        data: {
          cartId: mockCartId,
          productItemId: mockProductItemId,
          quantity: 2,
        },
      });
      expect(result).toEqual(mockDomainCartItem);
    });

    it('should handle database error during item addition', async () => {
      const error = new Error('Database error');
      (repository.findByUserId as jest.Mock) = jest
        .fn()
        .mockRejectedValue(error);

      await repository.addItem(mockAddItemDto);

      expect(errorHandlerService.handleDatabaseError).toHaveBeenCalledWith(
        error,
        'addItem',
      );
    });
  });

  describe('updateItemQuantity', () => {
    const mockUpdateDto: UpdateCartItemDto = {
      cartItemId: mockCartItemId,
      quantity: 5,
      userId: mockUserId,
    };

    it('should update item quantity successfully', async () => {
      const updatedPrismaItem = { ...mockPrismaCartItem, quantity: 5 };
      const updatedDomainItem = new ShoppingCartItem(
        mockCartItemId,
        mockCartId,
        mockProductItemId,
        5,
        new Date(),
        new Date(),
      );

      (prismaService.shoppingCartItem.update as jest.Mock).mockResolvedValue(
        updatedPrismaItem,
      );
      (ShoppingCartItemMapper.toDomain as jest.Mock).mockReturnValue(
        updatedDomainItem,
      );

      const result = await repository.updateItemQuantity(mockUpdateDto);

      expect(prismaService.shoppingCartItem.update).toHaveBeenCalledWith({
        where: { id: mockCartItemId },
        data: {
          quantity: 5,
          updated_at: expect.any(Date),
        },
      });
      expect(ShoppingCartItemMapper.toDomain).toHaveBeenCalledWith(
        updatedPrismaItem,
      );
      expect(result).toEqual(updatedDomainItem);
    });

    it('should handle update of non-existent item', async () => {
      const error = new Error('Record not found');
      (prismaService.shoppingCartItem.update as jest.Mock).mockRejectedValue(
        error,
      );

      await repository.updateItemQuantity(mockUpdateDto);

      expect(errorHandlerService.handleDatabaseError).toHaveBeenCalledWith(
        error,
        'updateItemQuantity',
      );
    });
  });

  describe('clearCart', () => {
    it('should clear all items from user cart', async () => {
      (repository.findByUserId as jest.Mock) = jest
        .fn()
        .mockResolvedValue(mockDomainCart);
      (
        prismaService.shoppingCartItem.deleteMany as jest.Mock
      ).mockResolvedValue({ count: 2 });

      await repository.clearCart(mockUserId);

      expect(prismaService.shoppingCartItem.deleteMany).toHaveBeenCalledWith({
        where: { cartId: mockCartId },
      });
    });

    it('should handle database error during cart clearing', async () => {
      const error = new Error('Delete operation failed');
      (repository.findByUserId as jest.Mock) = jest
        .fn()
        .mockRejectedValue(error);

      await expect(repository.clearCart(mockUserId)).rejects.toThrow(
        'Delete operation failed',
      );
    });
  });

  describe('findCartItemById', () => {
    it('should return cart item when found by ID', async () => {
      (
        prismaService.shoppingCartItem.findUnique as jest.Mock
      ).mockResolvedValue(mockPrismaCartItem);
      (ShoppingCartItemMapper.toDomain as jest.Mock).mockReturnValue(
        mockDomainCartItem,
      );

      const result = await repository.findCartItemById(mockCartItemId);

      expect(prismaService.shoppingCartItem.findUnique).toHaveBeenCalledWith({
        where: { id: mockCartItemId },
      });
      expect(ShoppingCartItemMapper.toDomain).toHaveBeenCalledWith(
        mockPrismaCartItem,
      );
      expect(result).toEqual(mockDomainCartItem);
    });

    it('should handle database error during cart item retrieval', async () => {
      const error = new Error('Database query failed');
      (
        prismaService.shoppingCartItem.findUnique as jest.Mock
      ).mockRejectedValue(error);

      await expect(repository.findCartItemById(mockCartItemId)).rejects.toThrow(
        'Database query failed',
      );
    });
  });

  describe('findCartItemByProductItem', () => {
    it('should return cart item when found by cart and product item', async () => {
      (prismaService.shoppingCartItem.findFirst as jest.Mock).mockResolvedValue(
        mockPrismaCartItem,
      );
      (ShoppingCartItemMapper.toDomain as jest.Mock).mockReturnValue(
        mockDomainCartItem,
      );

      const result = await repository.findCartItemByProductItem(
        mockCartId,
        mockProductItemId,
      );

      expect(prismaService.shoppingCartItem.findFirst).toHaveBeenCalledWith({
        where: {
          cartId: mockCartId,
          productItemId: mockProductItemId,
        },
      });
      expect(ShoppingCartItemMapper.toDomain).toHaveBeenCalledWith(
        mockPrismaCartItem,
      );
      expect(result).toEqual(mockDomainCartItem);
    });

    it('should handle database error during cart item search', async () => {
      const error = new Error('Search operation failed');
      (prismaService.shoppingCartItem.findFirst as jest.Mock).mockRejectedValue(
        error,
      );

      await expect(
        repository.findCartItemByProductItem(mockCartId, mockProductItemId),
      ).rejects.toThrow('Search operation failed');
    });
  });
});
