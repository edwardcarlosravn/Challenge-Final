import { Test, TestingModule } from '@nestjs/testing';
import { RemoveItemFromCartUseCase } from './remove-item-from-cart.use-case';
import { RemoveItemFromCartDto } from 'src/application/dto/shopping-cart/remove-item-from-cart.dto';
import { ShoppingCart } from 'src/domain/cart';
import { ShoppingCartItem } from 'src/domain/cart-item';
import { ShoppingCartRepository } from 'src/application/contracts/persistence/shopping-cart-repository.interface';

describe('RemoveItemFromCartUseCase', () => {
  let useCase: RemoveItemFromCartUseCase;
  let mockShoppingCartRepository: jest.Mocked<ShoppingCartRepository>;

  const mockCartItem: ShoppingCartItem = new ShoppingCartItem(
    1,
    10,
    123,
    2,
    new Date('2025-01-01'),
    new Date('2025-01-01'),
  );

  const mockShoppingCart: ShoppingCart = {
    id: 10,
    userId: 1,
    items: [mockCartItem],
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  beforeEach(async () => {
    mockShoppingCartRepository = {
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
        RemoveItemFromCartUseCase,
        {
          provide: 'ShoppingCartRepository',
          useValue: mockShoppingCartRepository,
        },
      ],
    }).compile();

    useCase = module.get<RemoveItemFromCartUseCase>(RemoveItemFromCartUseCase);
  });

  describe('execute', () => {
    const validDto: RemoveItemFromCartDto = {
      userId: 1,
      cartItemId: 1,
    };

    it('should remove item from cart successfully', async () => {
      mockShoppingCartRepository.findCartItemById.mockResolvedValue(
        mockCartItem,
      );
      mockShoppingCartRepository.findByUserId.mockResolvedValue(
        mockShoppingCart,
      );
      mockShoppingCartRepository.removeItem.mockResolvedValue();

      await useCase.execute(validDto);

      expect(mockShoppingCartRepository.findCartItemById).toHaveBeenCalledWith(
        1,
      );
      expect(mockShoppingCartRepository.findByUserId).toHaveBeenCalledWith(1);
      expect(mockShoppingCartRepository.removeItem).toHaveBeenCalledWith(
        validDto,
      );
      expect(mockShoppingCartRepository.findCartItemById).toHaveBeenCalledTimes(
        1,
      );
      expect(mockShoppingCartRepository.findByUserId).toHaveBeenCalledTimes(1);
      expect(mockShoppingCartRepository.removeItem).toHaveBeenCalledTimes(1);
    });

    it('should throw error when cart item does not exist', async () => {
      const dto: RemoveItemFromCartDto = {
        userId: 1,
        cartItemId: 999,
      };

      mockShoppingCartRepository.findCartItemById.mockResolvedValue(null);

      await expect(useCase.execute(dto)).rejects.toThrow('Cart item not found');
      expect(mockShoppingCartRepository.findCartItemById).toHaveBeenCalledWith(
        999,
      );
      expect(mockShoppingCartRepository.findByUserId).not.toHaveBeenCalled();
      expect(mockShoppingCartRepository.removeItem).not.toHaveBeenCalled();
    });

    it('should throw error when user does not have a cart', async () => {
      const dto: RemoveItemFromCartDto = {
        userId: 2,
        cartItemId: 1,
      };

      mockShoppingCartRepository.findCartItemById.mockResolvedValue(
        mockCartItem,
      );
      mockShoppingCartRepository.findByUserId.mockResolvedValue(null);

      await expect(useCase.execute(dto)).rejects.toThrow(
        'Unauthorized: Cart item does not belong to user',
      );
      expect(mockShoppingCartRepository.findCartItemById).toHaveBeenCalledWith(
        1,
      );
      expect(mockShoppingCartRepository.findByUserId).toHaveBeenCalledWith(2);
      expect(mockShoppingCartRepository.removeItem).not.toHaveBeenCalled();
    });

    it('should throw error when cart item does not belong to user', async () => {
      const dto: RemoveItemFromCartDto = {
        userId: 1,
        cartItemId: 1,
      };

      const differentCartItem = new ShoppingCartItem(
        1,
        20,
        123,
        2,
        new Date('2025-01-01'),
        new Date('2025-01-01'),
      );

      mockShoppingCartRepository.findCartItemById.mockResolvedValue(
        differentCartItem,
      );
      mockShoppingCartRepository.findByUserId.mockResolvedValue(
        mockShoppingCart,
      );

      await expect(useCase.execute(dto)).rejects.toThrow(
        'Unauthorized: Cart item does not belong to user',
      );
      expect(mockShoppingCartRepository.findCartItemById).toHaveBeenCalledWith(
        1,
      );
      expect(mockShoppingCartRepository.findByUserId).toHaveBeenCalledWith(1);
      expect(mockShoppingCartRepository.removeItem).not.toHaveBeenCalled();
    });

    it('should propagate repository errors', async () => {
      const repositoryError = new Error('Database connection failed');

      // Test error from findCartItemById
      mockShoppingCartRepository.findCartItemById.mockRejectedValue(
        repositoryError,
      );

      await expect(useCase.execute(validDto)).rejects.toThrow(
        'Database connection failed',
      );
      expect(mockShoppingCartRepository.findCartItemById).toHaveBeenCalledWith(
        1,
      );

      // Reset mocks for next test
      jest.clearAllMocks();

      // Test error from removeItem
      mockShoppingCartRepository.findCartItemById.mockResolvedValue(
        mockCartItem,
      );
      mockShoppingCartRepository.findByUserId.mockResolvedValue(
        mockShoppingCart,
      );
      mockShoppingCartRepository.removeItem.mockRejectedValue(repositoryError);

      await expect(useCase.execute(validDto)).rejects.toThrow(
        'Database connection failed',
      );
      expect(mockShoppingCartRepository.removeItem).toHaveBeenCalledWith(
        validDto,
      );
    });
  });
});
