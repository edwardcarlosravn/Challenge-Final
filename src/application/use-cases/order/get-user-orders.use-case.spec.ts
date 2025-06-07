import { Test, TestingModule } from '@nestjs/testing';
import { GetUserOrdersUseCase } from './get-user-orders.use-case';
import {
  OrderRepository,
  PaginatedResponse,
} from 'src/application/contracts/persistence/order-repository.interface';
import { Order } from 'src/domain/order';
import { GetUserOrdersDto } from 'src/application/dto/orders/get-user-orders.dto';
import { OrderStatus } from 'src/domain/enums/order-status.enum';

describe('GetUserOrdersUseCase', () => {
  let useCase: GetUserOrdersUseCase;
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
        GetUserOrdersUseCase,
        {
          provide: 'OrderRepository',
          useValue: mockOrderRepository as OrderRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetUserOrdersUseCase>(GetUserOrdersUseCase);
  });

  describe('execute', () => {
    const mockPaginatedResponse: PaginatedResponse<Order> = {
      data: [],
      totalItems: 0,
      totalPages: 0,
      currentPage: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    };

    it('should apply default values and return orders', async () => {
      const dto: GetUserOrdersDto = { userId: 1 };
      const expectedDto = {
        userId: 1,
        page: 1,
        pageSize: 10,
        sortOrder: 'desc',
      };

      mockOrderRepository.findOrders.mockResolvedValue(mockPaginatedResponse);

      const result = await useCase.execute(dto);

      expect(result).toEqual(mockPaginatedResponse);
      expect(mockOrderRepository.findOrders).toHaveBeenCalledWith(expectedDto);
    });

    it('should use provided pagination and filter values', async () => {
      const dto: GetUserOrdersDto = {
        userId: 1,
        page: 2,
        pageSize: 5,
        sortOrder: 'asc',
        status: OrderStatus.PENDING,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-31'),
      };

      mockOrderRepository.findOrders.mockResolvedValue(mockPaginatedResponse);

      await useCase.execute(dto);

      expect(mockOrderRepository.findOrders).toHaveBeenCalledWith(dto);
    });

    it('should throw error when page is invalid', async () => {
      const invalidCases = [
        { userId: 1, page: 0 },
        { userId: 1, page: -1 },
      ];

      for (const dto of invalidCases) {
        await expect(useCase.execute(dto)).rejects.toThrow(
          'Page must be greater than 0',
        );
        expect(mockOrderRepository.findOrders).not.toHaveBeenCalled();
        jest.clearAllMocks();
      }
    });

    it('should throw error when pageSize is invalid', async () => {
      const invalidCases = [
        { userId: 1, pageSize: 0 },
        { userId: 1, pageSize: 101 },
      ];

      for (const dto of invalidCases) {
        await expect(useCase.execute(dto)).rejects.toThrow(
          'Page size must be between 1 and 100',
        );
        expect(mockOrderRepository.findOrders).not.toHaveBeenCalled();
        jest.clearAllMocks();
      }
    });

    it('should throw error when startDate is after endDate', async () => {
      const dto: GetUserOrdersDto = {
        userId: 1,
        startDate: new Date('2025-01-31'),
        endDate: new Date('2025-01-01'),
      };

      await expect(useCase.execute(dto)).rejects.toThrow(
        'Start date cannot be after end date',
      );
      expect(mockOrderRepository.findOrders).not.toHaveBeenCalled();
    });

    it('should propagate repository errors', async () => {
      const dto: GetUserOrdersDto = { userId: 1 };
      const repositoryError = new Error('Database connection failed');

      mockOrderRepository.findOrders.mockRejectedValue(repositoryError);

      await expect(useCase.execute(dto)).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should handle different sort orders', async () => {
      const sortOrders = ['asc', 'desc'] as const;

      for (const sortOrder of sortOrders) {
        const dto: GetUserOrdersDto = { userId: 1, sortOrder };
        const expectedDto = { userId: 1, page: 1, pageSize: 10, sortOrder };

        mockOrderRepository.findOrders.mockResolvedValue(mockPaginatedResponse);

        await useCase.execute(dto);

        expect(mockOrderRepository.findOrders).toHaveBeenCalledWith(
          expectedDto,
        );
        jest.clearAllMocks();
      }
    });
    it('should not modify input parameters', async () => {
      const originalDto: GetUserOrdersDto = {
        userId: 42,
        page: 2,
        pageSize: 5,
        status: OrderStatus.PENDING,
      };
      const originalValues = { ...originalDto };

      mockOrderRepository.findOrders.mockResolvedValue(mockPaginatedResponse);

      await useCase.execute(originalDto);

      expect(originalDto).toEqual(originalValues);
    });
  });
});
