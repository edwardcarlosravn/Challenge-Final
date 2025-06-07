/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';

import { ClearCartUseCase } from './clear-cart.use-case';
import { GetUserCartDto } from 'src/application/dto/shopping-cart/get-user-cart.dto';
import { ShoppingCart } from 'src/domain/cart';
import { ShoppingCartRepository } from 'src/application/contracts/persistence/shopping-cart-repository.interface';

describe('ClearCartUseCase', () => {
  let useCase: ClearCartUseCase;
  let mockShoppingCartRepository: jest.Mocked<ShoppingCartRepository>;

  beforeEach(async () => {
    mockShoppingCartRepository = {
      findByUserId: jest.fn(),
      clearCart: jest.fn(),
      addItem: jest.fn(),
      updateItemQuantity: jest.fn(),
      removeItem: jest.fn(),
      createForUser: jest.fn(),
      findCartItemById: jest.fn(),
      findCartItemByProductItem: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClearCartUseCase,
        {
          provide: 'ShoppingCartRepository',
          useValue: mockShoppingCartRepository,
        },
      ],
    }).compile();

    useCase = module.get<ClearCartUseCase>(ClearCartUseCase);
  });

  describe('execute', () => {
    it('should clear the cart when user has a cart', async () => {
      // Arrange
      const dto: GetUserCartDto = { userId: 1 };
      const userCart: ShoppingCart = {
        id: 1,
        userId: 1,
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockShoppingCartRepository.findByUserId.mockResolvedValue(userCart);
      mockShoppingCartRepository.clearCart.mockResolvedValue();

      // Act
      await useCase.execute(dto);

      // Assert
      expect(mockShoppingCartRepository.findByUserId).toHaveBeenCalledWith(1);
      expect(mockShoppingCartRepository.clearCart).toHaveBeenCalledWith(1);
    });

    it('should throw error when user does not have a cart', async () => {
      // Arrange
      const dto: GetUserCartDto = { userId: 1 };

      mockShoppingCartRepository.findByUserId.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(dto)).rejects.toThrow(
        'User does not have a cart',
      );
      expect(mockShoppingCartRepository.findByUserId).toHaveBeenCalledWith(1);
      expect(mockShoppingCartRepository.clearCart).not.toHaveBeenCalled();
    });

    it('should propagate repository error when findByUserId fails', async () => {
      // Arrange
      const dto: GetUserCartDto = { userId: 1 };
      const repositoryError = new Error('Database connection failed');

      mockShoppingCartRepository.findByUserId.mockRejectedValue(
        repositoryError,
      );

      // Act & Assert
      await expect(useCase.execute(dto)).rejects.toThrow(
        'Database connection failed',
      );
      expect(mockShoppingCartRepository.findByUserId).toHaveBeenCalledWith(1);
      expect(mockShoppingCartRepository.clearCart).not.toHaveBeenCalled();
    });

    it('should propagate repository error when clearCart fails', async () => {
      // Arrange
      const dto: GetUserCartDto = { userId: 1 };
      const userCart: ShoppingCart = {
        id: 1,
        userId: 1,
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const repositoryError = new Error('Failed to clear cart');

      mockShoppingCartRepository.findByUserId.mockResolvedValue(userCart);
      mockShoppingCartRepository.clearCart.mockRejectedValue(repositoryError);

      // Act & Assert
      await expect(useCase.execute(dto)).rejects.toThrow(
        'Failed to clear cart',
      );
      expect(mockShoppingCartRepository.findByUserId).toHaveBeenCalledWith(1);
      expect(mockShoppingCartRepository.clearCart).toHaveBeenCalledWith(1);
    });

    it('should handle clearing cart for different users', async () => {
      // Arrange
      const dto1: GetUserCartDto = { userId: 1 };
      const dto2: GetUserCartDto = { userId: 2 };
      const userCart1: ShoppingCart = {
        id: 1,
        userId: 1,
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const userCart2: ShoppingCart = {
        id: 2,
        userId: 2,
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockShoppingCartRepository.findByUserId
        .mockResolvedValueOnce(userCart1)
        .mockResolvedValueOnce(userCart2);
      mockShoppingCartRepository.clearCart.mockResolvedValue();

      // Act
      await useCase.execute(dto1);
      await useCase.execute(dto2);

      // Assert
      expect(mockShoppingCartRepository.findByUserId).toHaveBeenNthCalledWith(
        1,
        1,
      );
      expect(mockShoppingCartRepository.findByUserId).toHaveBeenNthCalledWith(
        2,
        2,
      );
      expect(mockShoppingCartRepository.clearCart).toHaveBeenNthCalledWith(
        1,
        1,
      );
      expect(mockShoppingCartRepository.clearCart).toHaveBeenNthCalledWith(
        2,
        2,
      );
    });

    it('should handle clearing cart for user with undefined result', async () => {
      // Arrange
      const dto: GetUserCartDto = { userId: 1 };

      mockShoppingCartRepository.findByUserId.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(dto)).rejects.toThrow(
        'User does not have a cart',
      );
      expect(mockShoppingCartRepository.findByUserId).toHaveBeenCalledWith(1);
      expect(mockShoppingCartRepository.clearCart).not.toHaveBeenCalled();
    });
  });
});
