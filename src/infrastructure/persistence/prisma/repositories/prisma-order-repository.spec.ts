/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaOrderRepository } from './prisma-order-repository';
import { PrismaService } from '../prisma.service';
import { ErrorHandlerService } from 'src/infrastructure/common/error-handler.service';
import { StockValidatorService } from 'src/infrastructure/common/interceptors/stock-validator.service';
import { PriceInterceptorService } from 'src/infrastructure/common/interceptors/price-interceptor.service';
import { OrderMapper } from '../mappers/order-mapper';
import { CreateOrderFromCartDto } from 'src/application/dto/orders/create-order-from-cart.dto';
import { GetUserOrdersDto } from 'src/application/dto/orders/get-user-orders.dto';
import { Order } from 'src/domain/order';
import { OrderLine } from 'src/domain/order-line';
import { OrderStatus } from 'src/domain/enums/order-status.enum';

describe('PrismaOrderRepository', () => {
  let repository: PrismaOrderRepository;
  let prismaService: any;
  let errorHandler: any;
  let stockValidator: any;
  let priceInterceptor: any;

  // Shared mock data objects
  const mockCreateOrderFromCartDto: CreateOrderFromCartDto = {
    userId: 1,
    shippingAddress: '123 Test Street',
  };

  const mockGetOrdersDto: GetUserOrdersDto = {
    userId: 1,
    page: 1,
    pageSize: 10,
  };

  const mockGetOrdersWithStatusDto: GetUserOrdersDto = {
    userId: 1,
    page: 1,
    pageSize: 10,
    status: OrderStatus.APPROVED,
  };

  const mockCartItem = {
    id: 1,
    productItemId: 1,
    quantity: 2,
    productItem: {
      id: 1,
      sku: 'TEST-SKU',
      stock: 10,
      price: 25.99,
    },
  };

  const mockCart = {
    id: 1,
    userId: 1,
    items: [mockCartItem],
  };

  const mockEmptyCart = {
    id: 1,
    userId: 1,
    items: [],
  };

  const mockStockValidation = {
    isValid: true,
    insufficientStockItems: [],
  };

  const mockInsufficientStockValidation = {
    isValid: false,
    insufficientStockItems: [
      {
        sku: 'TEST-SKU',
        available: 1,
        requested: 2,
      },
    ],
  };

  const mockCartItemWithPrice = {
    ...mockCartItem,
    currentPrice: 25.99,
  };
  const mockPrismaOrder = {
    id: 'order-1',
    userId: 1,
    shippingAddress: '123 Test Street',
    orderStatus: 'PENDING',
    orderDate: new Date(),
    orderTotal: 51.98,
    orderLines: [
      {
        id: 1,
        orderId: 'order-1',
        productItemId: 1,
        quantity: 2,
        price: 25.99,
        createdAt: new Date(),
        updatedAt: new Date(),
        productItem: mockCartItem.productItem,
      },
    ],
  };

  const mockDomainOrderLine = new OrderLine(
    1,
    'order-1',
    1,
    2,
    25.99,
    new Date(),
    new Date(),
  );

  const mockDomainOrder = new Order(
    'order-1',
    1,
    '123 Test Street',
    'PENDING',
    new Date(),
    51.98,
    [mockDomainOrderLine],
    new Date(),
    new Date(),
  );

  const mockPaginatedResponse = {
    data: [mockDomainOrder],
    totalItems: 1,
    totalPages: 1,
    currentPage: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  };

  const mockTransactionClient = {
    shoppingCart: {
      findFirst: jest.fn(),
    },
    shopOrder: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
    },
    productItem: {
      update: jest.fn(),
    },
    shoppingCartItem: {
      deleteMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaOrderRepository,
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn(),
            shopOrder: {
              findMany: jest.fn(),
              count: jest.fn(),
              update: jest.fn(),
              findUnique: jest.fn(),
              findUniqueOrThrow: jest.fn(),
            },
          },
        },
        {
          provide: ErrorHandlerService,
          useValue: {
            handleDatabaseError: jest.fn(),
          },
        },
        {
          provide: StockValidatorService,
          useValue: {
            validateCartStock: jest.fn(),
          },
        },
        {
          provide: PriceInterceptorService,
          useValue: {
            getCartItemsWithCurrentPrices: jest.fn(),
            calculateOrderTotal: jest.fn(),
          },
        },
      ],
    }).compile();

    repository = module.get<PrismaOrderRepository>(PrismaOrderRepository);
    prismaService = module.get(PrismaService);
    errorHandler = module.get(ErrorHandlerService);
    stockValidator = module.get(StockValidatorService);
    priceInterceptor = module.get(PriceInterceptorService);

    (OrderMapper.toDomain as jest.Mock) = jest
      .fn()
      .mockReturnValue(mockDomainOrder);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createFromCart', () => {
    it('should create order from cart successfully', async () => {
      // Arrange
      prismaService.$transaction.mockImplementation((fn) =>
        fn(mockTransactionClient),
      );
      mockTransactionClient.shoppingCart.findFirst.mockResolvedValue(mockCart);
      stockValidator.validateCartStock.mockResolvedValue(mockStockValidation);
      priceInterceptor.getCartItemsWithCurrentPrices.mockResolvedValue([
        mockCartItemWithPrice,
      ]);
      priceInterceptor.calculateOrderTotal.mockResolvedValue(51.98);
      mockTransactionClient.shopOrder.create.mockResolvedValue(mockPrismaOrder);
      mockTransactionClient.productItem.update.mockResolvedValue({});
      mockTransactionClient.shoppingCartItem.deleteMany.mockResolvedValue({});

      // Act
      const result = await repository.createFromCart(
        mockCreateOrderFromCartDto,
      );

      // Assert
      expect(result).toEqual(mockDomainOrder);
      expect(mockTransactionClient.shoppingCart.findFirst).toHaveBeenCalledWith(
        {
          where: { userId: 1 },
          include: { items: { include: { productItem: true } } },
        },
      );
      expect(stockValidator.validateCartStock).toHaveBeenCalledWith(
        mockCart.items,
      );
      expect(
        priceInterceptor.getCartItemsWithCurrentPrices,
      ).toHaveBeenCalledWith(mockCart.items);
      expect(priceInterceptor.calculateOrderTotal).toHaveBeenCalledWith(
        mockCart.items,
      );
      expect(mockTransactionClient.shopOrder.create).toHaveBeenCalled();
      expect(mockTransactionClient.productItem.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { stock: { increment: -2 } },
      });
      expect(
        mockTransactionClient.shoppingCartItem.deleteMany,
      ).toHaveBeenCalledWith({
        where: { cartId: 1 },
      });
      expect(OrderMapper.toDomain).toHaveBeenCalledWith(mockPrismaOrder);
    });

    it('should throw error when cart is empty or not found', async () => {
      // Arrange
      prismaService.$transaction.mockImplementation((fn) =>
        fn(mockTransactionClient),
      );
      mockTransactionClient.shoppingCart.findFirst.mockResolvedValue(
        mockEmptyCart,
      );

      // Act & Assert
      await expect(
        repository.createFromCart(mockCreateOrderFromCartDto),
      ).rejects.toThrow('Cart is empty or not found');
      expect(mockTransactionClient.shoppingCart.findFirst).toHaveBeenCalledWith(
        {
          where: { userId: 1 },
          include: { items: { include: { productItem: true } } },
        },
      );
    });

    it('should throw error when insufficient stock', async () => {
      // Arrange
      prismaService.$transaction.mockImplementation((fn) =>
        fn(mockTransactionClient),
      );
      mockTransactionClient.shoppingCart.findFirst.mockResolvedValue(mockCart);
      stockValidator.validateCartStock.mockResolvedValue(
        mockInsufficientStockValidation,
      );

      // Act & Assert
      await expect(
        repository.createFromCart(mockCreateOrderFromCartDto),
      ).rejects.toThrow(
        'Insufficient stock: TEST-SKU: Available 1, Required 2',
      );
      expect(stockValidator.validateCartStock).toHaveBeenCalledWith(
        mockCart.items,
      );
    });

    it('should handle database transaction error', async () => {
      // Arrange
      const dbError = new Error('Database transaction error');
      prismaService.$transaction.mockRejectedValue(dbError);

      // Act & Assert
      await expect(
        repository.createFromCart(mockCreateOrderFromCartDto),
      ).rejects.toThrow('Database transaction error');
      expect(errorHandler.handleDatabaseError).toHaveBeenCalledWith(
        dbError,
        'orderTransaction',
      );
    });
  });

  describe('findOrders', () => {
    it('should return paginated orders', async () => {
      // Arrange
      prismaService.shopOrder.findMany.mockResolvedValue([mockPrismaOrder]);
      prismaService.shopOrder.count.mockResolvedValue(1);

      // Act
      const result = await repository.findOrders(mockGetOrdersDto);

      // Assert
      expect(result).toEqual(mockPaginatedResponse);
      expect(prismaService.shopOrder.findMany).toHaveBeenCalledWith({
        where: { userId: 1 },
        skip: 0,
        take: 10,
        include: { orderLines: { include: { productItem: true } } },
      });
      expect(prismaService.shopOrder.count).toHaveBeenCalledWith({
        where: { userId: 1 },
      });
      expect(OrderMapper.toDomain).toHaveBeenCalledWith(mockPrismaOrder);
    });

    it('should handle database error', async () => {
      // Arrange
      const dbError = new Error('Database error');
      prismaService.shopOrder.findMany.mockRejectedValue(dbError);

      // Act & Assert
      await expect(repository.findOrders(mockGetOrdersDto)).rejects.toThrow(
        'Database error',
      );
      expect(errorHandler.handleDatabaseError).toHaveBeenCalledWith(
        dbError,
        'findOrders',
      );
    });
  });

  describe('updateStatus', () => {
    it('should update order status successfully', async () => {
      // Arrange
      const updatedOrder = { ...mockPrismaOrder, orderStatus: 'APPROVED' };
      prismaService.shopOrder.update.mockResolvedValue(updatedOrder);

      // Act
      const result = await repository.updateStatus('order-1', 'APPROVED');

      // Assert
      expect(result).toEqual(mockDomainOrder);
      expect(prismaService.shopOrder.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: { orderStatus: 'APPROVED', updated_at: expect.any(Date) },
        include: { orderLines: true },
      });
      expect(OrderMapper.toDomain).toHaveBeenCalledWith(updatedOrder);
    });

    it('should throw error when order not found', async () => {
      // Arrange
      const notFoundError = new Error('Order not found');
      prismaService.shopOrder.update.mockRejectedValue(notFoundError);

      // Act & Assert
      await expect(
        repository.updateStatus('invalid-id', 'APPROVED'),
      ).rejects.toThrow('Order not found');
      expect(errorHandler.handleDatabaseError).toHaveBeenCalledWith(
        notFoundError,
        'updateStatus',
      );
    });

    it('should handle database error', async () => {
      // Arrange
      const dbError = new Error('Database error');
      prismaService.shopOrder.update.mockRejectedValue(dbError);

      // Act & Assert
      await expect(
        repository.updateStatus('order-1', 'APPROVED'),
      ).rejects.toThrow('Database error');
      expect(errorHandler.handleDatabaseError).toHaveBeenCalledWith(
        dbError,
        'updateStatus',
      );
    });
  });

  describe('getOrder', () => {
    it('should return order when found', async () => {
      // Arrange
      prismaService.shopOrder.findUnique.mockResolvedValue(mockPrismaOrder);

      // Act
      const result = await repository.getOrder('order-1');

      // Assert
      expect(result).toEqual(mockDomainOrder);
      expect(prismaService.shopOrder.findUnique).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        include: {
          orderLines: {
            include: {
              productItem: true,
            },
          },
        },
      });
      expect(OrderMapper.toDomain).toHaveBeenCalledWith(mockPrismaOrder);
    });

    it('should return null when order not found', async () => {
      // Arrange
      prismaService.shopOrder.findUnique.mockResolvedValue(null);

      // Act
      const result = await repository.getOrder('invalid-id');

      // Assert
      expect(result).toBeNull();
      expect(prismaService.shopOrder.findUnique).toHaveBeenCalledWith({
        where: { id: 'invalid-id' },
        include: {
          orderLines: {
            include: {
              productItem: true,
            },
          },
        },
      });
      expect(OrderMapper.toDomain).not.toHaveBeenCalled();
    });

    it('should handle database error', async () => {
      // Arrange
      const dbError = new Error('Database error');
      prismaService.shopOrder.findUnique.mockRejectedValue(dbError);

      // Act & Assert
      await expect(repository.getOrder('order-1')).rejects.toThrow(
        'Database error',
      );
      expect(errorHandler.handleDatabaseError).toHaveBeenCalledWith(
        dbError,
        'GET ORDER',
      );
    });
  });

  describe('getOrderOrThrow', () => {
    it('should return order when found', async () => {
      // Arrange
      prismaService.shopOrder.findUniqueOrThrow.mockResolvedValue(
        mockPrismaOrder,
      );

      // Act
      const result = await repository.getOrderOrThrow('order-1');

      // Assert
      expect(result).toEqual(mockDomainOrder);
      expect(prismaService.shopOrder.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        include: {
          orderLines: {
            include: {
              productItem: true,
            },
          },
        },
      });
      expect(OrderMapper.toDomain).toHaveBeenCalledWith(mockPrismaOrder);
    });

    it('should throw error when order not found', async () => {
      // Arrange
      const notFoundError = new Error('Order not found');
      prismaService.shopOrder.findUniqueOrThrow.mockRejectedValue(
        notFoundError,
      );

      // Act & Assert
      await expect(repository.getOrderOrThrow('invalid-id')).rejects.toThrow(
        'Order not found',
      );
      expect(errorHandler.handleDatabaseError).toHaveBeenCalledWith(
        notFoundError,
        'GET ORDER OR THROW',
      );
    });
  });
});
