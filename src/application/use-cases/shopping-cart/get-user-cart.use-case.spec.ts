import { Test, TestingModule } from '@nestjs/testing';
import { GetUserCartUseCase } from './get-user-cart.use-case';
import { GetUserCartDto } from 'src/application/dto/shopping-cart/get-user-cart.dto';
import { ShoppingCart } from 'src/domain/cart';
import { ShoppingCartItem } from 'src/domain/cart-item';
import { ShoppingCartRepository } from 'src/application/contracts/persistence/shopping-cart-repository.interface';

describe('GetUserCartUseCase', () => {
  let useCase: GetUserCartUseCase;
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
    const mockRepository = {
      findByUserId: jest.fn(),
      createForUser: jest.fn(),
      addItem: jest.fn(),
      updateItemQuantity: jest.fn(),
      removeItem: jest.fn(),
      clearCart: jest.fn(),
      findCartItemById: jest.fn(),
      findCartItemByProductItem: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetUserCartUseCase,
        {
          provide: 'ShoppingCartRepository',
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetUserCartUseCase>(GetUserCartUseCase);
    mockShoppingCartRepository = module.get('ShoppingCartRepository');
  });

  describe('execute', () => {
    it('should return user cart when found', async () => {
      const dto: GetUserCartDto = { userId: 1 };
      mockShoppingCartRepository.findByUserId.mockResolvedValue(
        mockShoppingCart,
      );

      const result = await useCase.execute(dto);

      expect(mockShoppingCartRepository.findByUserId).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockShoppingCart);
      expect(result?.id).toBe(10);
      expect(result?.userId).toBe(1);
      expect(result?.items).toHaveLength(1);
    });

    it('should return null when user cart does not exist', async () => {
      const dto: GetUserCartDto = { userId: 2 };
      mockShoppingCartRepository.findByUserId.mockResolvedValue(null);

      const result = await useCase.execute(dto);

      expect(mockShoppingCartRepository.findByUserId).toHaveBeenCalledWith(2);
      expect(result).toBeNull();
    });

    it('should propagate repository errors', async () => {
      const dto: GetUserCartDto = { userId: 1 };
      const repositoryError = new Error('Database connection failed');
      mockShoppingCartRepository.findByUserId.mockRejectedValue(
        repositoryError,
      );

      await expect(useCase.execute(dto)).rejects.toThrow(
        'Database connection failed',
      );
      expect(mockShoppingCartRepository.findByUserId).toHaveBeenCalledWith(1);
    });
  });
});
