import { Test, TestingModule } from '@nestjs/testing';
import { CreateOrderFromCartUseCase } from './create-order-from-cart.use-case';
import { OrderRepository } from 'src/application/contracts/persistence/order-repository.interface';
import { Order } from 'src/domain/order';
import { CreateOrderFromCartDto } from 'src/application/dto/orders/create-order-from-cart.dto';
import { BadRequestException } from '@nestjs/common';

describe('CreateOrderFromCartUseCase', () => {
  let useCase: CreateOrderFromCartUseCase;
  const mockOrderRepository = {
    createFromCart: jest.fn(),
    findOrders: jest.fn(),
    getOrder: jest.fn(),
    updateStatus: jest.fn(),
    getOrderOrThrow: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateOrderFromCartUseCase,
        {
          provide: 'OrderRepository',
          useValue: mockOrderRepository as OrderRepository,
        },
      ],
    }).compile();

    useCase = module.get<CreateOrderFromCartUseCase>(
      CreateOrderFromCartUseCase,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const validDto: CreateOrderFromCartDto = {
      userId: 1,
      shippingAddress: '123 Main St, City, State 12345',
    };

    const mockOrder = new Order(
      'order-123',
      1,
      '123 Main St, City, State 12345',
      'pending',
      new Date('2025-01-01'),
      99.99,
      [],
      new Date('2025-01-01'),
      new Date('2025-01-01'),
    );

    it('should successfully create order from cart', async () => {
      mockOrderRepository.createFromCart.mockResolvedValue(mockOrder);

      const result = await useCase.execute(validDto);

      expect(result).toEqual(mockOrder);
      expect(mockOrderRepository.createFromCart).toHaveBeenCalledWith(validDto);
      expect(mockOrderRepository.createFromCart).toHaveBeenCalledTimes(1);
    });

    it('should throw error when shipping address is invalid', async () => {
      const invalidCases = [
        { shippingAddress: '' },
        { shippingAddress: '   \t\n   ' },
      ];

      for (const invalidCase of invalidCases) {
        const invalidDto = { ...validDto, ...invalidCase };

        await expect(useCase.execute(invalidDto)).rejects.toThrow(
          'Shipping address is required',
        );

        expect(mockOrderRepository.createFromCart).not.toHaveBeenCalled();
        jest.clearAllMocks();
      }

      const nullDto = {
        ...validDto,
        shippingAddress: null as unknown as string,
      };
      await expect(useCase.execute(nullDto)).rejects.toThrow(
        'Shipping address is required',
      );

      const undefinedDto = {
        ...validDto,
        shippingAddress: undefined as unknown as string,
      };
      await expect(useCase.execute(undefinedDto)).rejects.toThrow(
        'Shipping address is required',
      );
    });

    it('should throw error when shipping address exceeds maximum length', async () => {
      const longAddress = 'A'.repeat(101);
      const invalidDto = { ...validDto, shippingAddress: longAddress };

      await expect(useCase.execute(invalidDto)).rejects.toThrow(
        'Shipping address cannot exceed 100 characters',
      );

      expect(mockOrderRepository.createFromCart).not.toHaveBeenCalled();
    });

    it('should accept valid address with whitespace but reject whitespace-only addresses', async () => {
      const dtoWithWhitespace: CreateOrderFromCartDto = {
        ...validDto,
        shippingAddress: '  123 Valid Street, City  ',
      };

      mockOrderRepository.createFromCart.mockResolvedValue(mockOrder);

      await expect(useCase.execute(dtoWithWhitespace)).resolves.toEqual(
        mockOrder,
      );
      const whitespaceOnlyDto = {
        ...validDto,
        shippingAddress: '   \t\n   ',
      };

      await expect(useCase.execute(whitespaceOnlyDto)).rejects.toThrow(
        'Shipping address is required',
      );
    });
    it('should propagate repository errors', async () => {
      const repositoryError = new Error('Database connection failed');
      mockOrderRepository.createFromCart.mockRejectedValue(repositoryError);

      await expect(useCase.execute(validDto)).rejects.toThrow(
        'Database connection failed',
      );

      expect(mockOrderRepository.createFromCart).toHaveBeenCalledWith(validDto);
    });
    it('should not modify input parameters', async () => {
      const originalDto: CreateOrderFromCartDto = {
        userId: 42,
        shippingAddress: '789 Test Avenue',
      };
      const originalValues = { ...originalDto };

      mockOrderRepository.createFromCart.mockResolvedValue(mockOrder);

      await useCase.execute(originalDto);

      expect(originalDto).toEqual(originalValues);
    });
    it('should throw BadRequestException when cart is empty', async () => {
      const emptyCartError = new BadRequestException(
        'Cannot create order from empty cart',
      );

      mockOrderRepository.createFromCart.mockRejectedValue(emptyCartError);

      await expect(useCase.execute(validDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(useCase.execute(validDto)).rejects.toThrow(
        'Cannot create order from empty cart',
      );

      expect(mockOrderRepository.createFromCart).toHaveBeenCalledWith(validDto);
    });
  });
});
