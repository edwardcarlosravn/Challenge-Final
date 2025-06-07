/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { AddItemToCartUseCase } from './add-item-to-cart.use-case';
import { ShoppingCartRepository } from 'src/application/contracts/persistence/shopping-cart-repository.interface';
import { AddItemToCartDto } from 'src/application/dto/shopping-cart/add-item-to-cart.dto';
import { ShoppingCartItem } from 'src/domain/cart-item';

describe('AddItemToCartUseCase', () => {
  let useCase: AddItemToCartUseCase;
  let mockShoppingCartRepository: jest.Mocked<ShoppingCartRepository>;

  const mockCartItem: ShoppingCartItem = new ShoppingCartItem(
    1,
    10,
    123,
    2,
    new Date('2025-01-01'),
    new Date('2025-01-01'),
  );

  beforeEach(async () => {
    const mockRepository = {
      findByUserId: jest.fn(),
      createForUser: jest.fn(),
      addItem: jest.fn(),
      removeItem: jest.fn(),
      updateItemQuantity: jest.fn(),
      clearCart: jest.fn(),
      findCartItemById: jest.fn(),
      findCartItemByProductItem: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AddItemToCartUseCase,
        {
          provide: 'ShoppingCartRepository',
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<AddItemToCartUseCase>(AddItemToCartUseCase);
    mockShoppingCartRepository = module.get('ShoppingCartRepository');
  });

  describe('execute', () => {
    it('should add item to cart successfully', async () => {
      const addItemDto: AddItemToCartDto = {
        userId: 1,
        productItemId: 123,
        quantity: 3,
      };

      mockShoppingCartRepository.addItem.mockResolvedValue(mockCartItem);

      const result = await useCase.execute(addItemDto);

      expect(mockShoppingCartRepository.addItem).toHaveBeenCalledWith(
        addItemDto,
      );
      expect(result).toEqual(mockCartItem);
      expect(result.productItemId).toBe(123);
      expect(result.quantity).toBe(2);
    });

    it('should throw error when quantity is invalid', async () => {
      const invalidCases = [
        { quantity: 0, description: 'zero' },
        { quantity: -1, description: 'negative integer' },
        { quantity: -0.5, description: 'negative decimal' },
      ];

      for (const testCase of invalidCases) {
        const invalidDto: AddItemToCartDto = {
          userId: 1,
          productItemId: 123,
          quantity: testCase.quantity,
        };

        await expect(useCase.execute(invalidDto)).rejects.toThrow(
          BadRequestException,
        );
        await expect(useCase.execute(invalidDto)).rejects.toThrow(
          'Quantity must be greater than 0',
        );
        expect(mockShoppingCartRepository.addItem).not.toHaveBeenCalled();
        jest.clearAllMocks();
      }
    });

    it('should propagate repository errors', async () => {
      const addItemDto: AddItemToCartDto = {
        userId: 1,
        productItemId: 123,
        quantity: 2,
      };

      const repositoryError = new Error('Database connection failed');
      mockShoppingCartRepository.addItem.mockRejectedValue(repositoryError);

      await expect(useCase.execute(addItemDto)).rejects.toThrow(
        'Database connection failed',
      );
      expect(mockShoppingCartRepository.addItem).toHaveBeenCalledWith(
        addItemDto,
      );
    });

    it('should handle product not found error from repository', async () => {
      const addItemDto: AddItemToCartDto = {
        userId: 1,
        productItemId: 999,
        quantity: 1,
      };

      const notFoundError = new Error('Product item not found');
      mockShoppingCartRepository.addItem.mockRejectedValue(notFoundError);

      await expect(useCase.execute(addItemDto)).rejects.toThrow(
        'Product item not found',
      );
      expect(mockShoppingCartRepository.addItem).toHaveBeenCalledWith(
        addItemDto,
      );
    });

    it('should handle out of stock error from repository', async () => {
      const addItemDto: AddItemToCartDto = {
        userId: 1,
        productItemId: 123,
        quantity: 5,
      };

      const stockError = new Error('Insufficient stock');
      mockShoppingCartRepository.addItem.mockRejectedValue(stockError);

      await expect(useCase.execute(addItemDto)).rejects.toThrow(
        'Insufficient stock',
      );
      expect(mockShoppingCartRepository.addItem).toHaveBeenCalledWith(
        addItemDto,
      );
    });

    it('should handle maximum valid quantity', async () => {
      const addItemDto: AddItemToCartDto = {
        userId: 1,
        productItemId: 123,
        quantity: 999,
      };

      const maxQuantityItem = new ShoppingCartItem(
        3,
        10,
        123,
        999,
        new Date('2025-01-01'),
        new Date('2025-01-01'),
      );

      mockShoppingCartRepository.addItem.mockResolvedValue(maxQuantityItem);

      const result = await useCase.execute(addItemDto);

      expect(mockShoppingCartRepository.addItem).toHaveBeenCalledWith(
        addItemDto,
      );
      expect(result).toEqual(maxQuantityItem);
      expect(result.quantity).toBe(999);
    });
  });
});
