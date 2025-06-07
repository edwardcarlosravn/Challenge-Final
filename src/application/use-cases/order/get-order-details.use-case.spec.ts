import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GetOrderDetailsUseCase } from './get-order-details.use-case';
import { OrderRepository } from 'src/application/contracts/persistence/order-repository.interface';
import { Order } from 'src/domain/order';
import { GetOrderByIdDto } from 'src/application/dto/orders/get-orderbyId.dto';
import { OrderLine } from 'src/domain/order-line';

describe('GetOrderDetailsUseCase', () => {
  let useCase: GetOrderDetailsUseCase;
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
        GetOrderDetailsUseCase,
        {
          provide: 'OrderRepository',
          useValue: mockOrderRepository as OrderRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetOrderDetailsUseCase>(GetOrderDetailsUseCase);
  });

  describe('execute', () => {
    const validDto: GetOrderByIdDto = {
      orderId: 'order-123',
      userId: 1,
    };

    const mockOrderLines: OrderLine[] = [
      new OrderLine(1, 'order-123', 101, 2, 25.99, new Date(), new Date()),
      new OrderLine(2, 'order-123', 102, 1, 49.99, new Date(), new Date()),
    ];

    const mockOrder = new Order(
      'order-123',
      1,
      '123 Main St, City, State 12345',
      'pending',
      new Date('2025-01-01'),
      101.97,
      mockOrderLines,
      new Date('2025-01-01'),
      new Date('2025-01-01'),
    );

    it('should successfully return order details for authorized user', async () => {
      mockOrderRepository.getOrder.mockResolvedValue(mockOrder);

      const result = await useCase.execute(validDto);

      expect(result).toEqual(mockOrder);
      expect(mockOrderRepository.getOrder).toHaveBeenCalledWith('order-123');
      expect(mockOrderRepository.getOrder).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when order does not exist', async () => {
      mockOrderRepository.getOrder.mockResolvedValue(null);

      await expect(useCase.execute(validDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(useCase.execute(validDto)).rejects.toThrow(
        'Order with id order-123 not found',
      );
      expect(mockOrderRepository.getOrder).toHaveBeenCalledWith('order-123');
    });

    it('should throw authorization error when order belongs to different user', async () => {
      const orderForDifferentUser = new Order(
        'order-123',
        999, // Different user ID
        '123 Main St, City, State 12345',
        'pending',
        new Date('2025-01-01'),
        101.97,
        mockOrderLines,
        new Date('2025-01-01'),
        new Date('2025-01-01'),
      );

      mockOrderRepository.getOrder.mockResolvedValue(orderForDifferentUser);

      await expect(useCase.execute(validDto)).rejects.toThrow(
        'Unauthorized: Order does not belong to user',
      );
      expect(mockOrderRepository.getOrder).toHaveBeenCalledWith('order-123');
    });

    it('should propagate repository errors', async () => {
      const repositoryError = new Error('Database connection failed');
      mockOrderRepository.getOrder.mockRejectedValue(repositoryError);

      await expect(useCase.execute(validDto)).rejects.toThrow(
        'Database connection failed',
      );
      expect(mockOrderRepository.getOrder).toHaveBeenCalledWith('order-123');
    });

    it('should handle order with undefined order lines', async () => {
      const orderWithUndefinedLines = new Order(
        'order-789',
        1,
        '789 Third Street',
        'shipped',
        new Date('2025-01-03'),
        75.5,
        undefined,
        new Date('2025-01-03'),
        new Date('2025-01-03'),
      );

      mockOrderRepository.getOrder.mockResolvedValue(orderWithUndefinedLines);

      const dto: GetOrderByIdDto = {
        orderId: 'order-789',
        userId: 1,
      };

      const result = await useCase.execute(dto);

      expect(result).toEqual(orderWithUndefinedLines);
      expect(result.orderLines).toBeUndefined();
    });

    it('should not modify input parameters', async () => {
      const originalDto: GetOrderByIdDto = {
        orderId: 'order-test',
        userId: 42,
      };
      const originalValues = { ...originalDto };

      const orderForUser42 = new Order(
        'order-test',
        42,
        '123 Test St',
        'pending',
        new Date('2025-01-01'),
        99.99,
        [],
        new Date('2025-01-01'),
        new Date('2025-01-01'),
      );

      mockOrderRepository.getOrder.mockResolvedValue(orderForUser42);

      await useCase.execute(originalDto);

      expect(originalDto).toEqual(originalValues);
    });
  });
});
