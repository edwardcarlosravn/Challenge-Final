/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaPaymentRepository } from './prisma-payment.repository';
import { PrismaService } from '../prisma.service';
import { PrismaPaymentMapper } from '../mappers/payment-mapper';
import { Payment } from 'src/domain/payment';

jest.mock('../mappers/payment-mapper');

describe('PrismaPaymentRepository', () => {
  let repository: PrismaPaymentRepository;
  let prismaService: any;

  // Shared mock data objects
  const mockPaymentId = 'payment-123';
  const mockOrderId = 'order-456';

  const mockPaymentData = new Payment(
    mockPaymentId,
    mockOrderId,
    'ebdd2bc4-ed3d-4d61-b132-cf98d514abc4',
    100.0,
    'USD',
    'PENDING',
    new Date(),
    new Date(),
    new Date(),
  );

  const mockPaidPaymentData = new Payment(
    mockPaymentId,
    mockOrderId,
    'stripe_123',
    100.0,
    'USD',
    'PAID',
    undefined,
    undefined,
    undefined,
  );

  const mockNewPaymentData = new Payment(
    'payment-new',
    'order-789',
    'ebdd2bc4-ed3d-4d61-b132-cf98d514abc4',
    200.0,
    'USD',
    'PENDING',
    new Date(),
    new Date(),
    new Date(),
  );

  const mockPrismaPayment = {
    id: 1,
    paymentId: mockPaymentId,
    amount: 100.0,
    currency: 'USD',
    status: 'PENDING',
    orderId: mockOrderId,
    stripePaymentId: null,
    paymentAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaOrder = {
    id: mockOrderId,
    orderStatus: 'approved',
    userId: 1,
  };

  const mockTransactionClient = {
    payment: {
      update: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    shopOrder: {
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaPaymentRepository,
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn(),
            payment: {
              create: jest.fn(),
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    repository = module.get<PrismaPaymentRepository>(PrismaPaymentRepository);
    prismaService = module.get(PrismaService);

    (PrismaPaymentMapper.toDomain as jest.Mock) = jest
      .fn()
      .mockReturnValue(mockPaymentData);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('updatePayment', () => {
    it('should update payment successfully with valid data', async () => {
      // Arrange
      prismaService.$transaction.mockImplementation((fn) =>
        fn(mockTransactionClient),
      );
      mockTransactionClient.payment.update.mockResolvedValue(mockPrismaPayment);

      // Act
      const result = await repository.updatePayment(
        mockPaymentId,
        mockPaymentData,
      );

      // Assert
      expect(result).toEqual(mockPaymentData);
      expect(mockTransactionClient.payment.update).toHaveBeenCalledWith({
        where: { paymentId: mockPaymentId },
        data: {
          status: mockPaymentData.status,
          paymentAt: mockPaymentData.paymentAt,
          stripePaymentId: mockPaymentData.stripePaymentId,
          updatedAt: expect.any(Date),
        },
      });
      expect(PrismaPaymentMapper.toDomain).toHaveBeenCalledWith(
        mockPrismaPayment,
      );
    });

    it('should update payment and order status when payment status is PAID', async () => {
      // Arrange
      prismaService.$transaction.mockImplementation((fn) =>
        fn(mockTransactionClient),
      );
      mockTransactionClient.payment.update.mockResolvedValue(mockPrismaPayment);
      mockTransactionClient.shopOrder.update.mockResolvedValue(mockPrismaOrder);

      // Act
      const result = await repository.updatePayment(
        mockPaymentId,
        mockPaidPaymentData,
      );

      // Assert
      expect(result).toEqual(mockPaymentData);
      expect(mockTransactionClient.payment.update).toHaveBeenCalledWith({
        where: { paymentId: mockPaymentId },
        data: {
          status: 'PAID',
          paymentAt: mockPaidPaymentData.paymentAt,
          stripePaymentId: 'stripe_123',
          updatedAt: expect.any(Date),
        },
      });
      expect(mockTransactionClient.shopOrder.update).toHaveBeenCalledWith({
        where: { id: mockPrismaPayment.orderId },
        data: { orderStatus: 'approved' },
      });
      expect(PrismaPaymentMapper.toDomain).toHaveBeenCalledWith(
        mockPrismaPayment,
      );
    });

    it('should throw error when payment not found', async () => {
      // Arrange
      const notFoundError = new Error('Payment not found');
      prismaService.$transaction.mockImplementation((fn) =>
        fn(mockTransactionClient),
      );
      mockTransactionClient.payment.update.mockRejectedValue(notFoundError);

      // Act & Assert
      await expect(
        repository.updatePayment('invalid-id', mockPaymentData),
      ).rejects.toThrow('Payment not found');
      expect(mockTransactionClient.payment.update).toHaveBeenCalledWith({
        where: { paymentId: 'invalid-id' },
        data: {
          status: mockPaymentData.status,
          paymentAt: mockPaymentData.paymentAt,
          stripePaymentId: mockPaymentData.stripePaymentId,
          updatedAt: expect.any(Date),
        },
      });
    });

    it('should handle database error during transaction', async () => {
      // Arrange
      const dbError = new Error('Database transaction error');
      prismaService.$transaction.mockRejectedValue(dbError);

      // Act & Assert
      await expect(
        repository.updatePayment(mockPaymentId, mockPaymentData),
      ).rejects.toThrow('Database transaction error');
      expect(prismaService.$transaction).toHaveBeenCalled();
    });
  });

  describe('createPayment', () => {
    it('should create payment successfully with valid data', async () => {
      // Arrange
      const createdPayment = { ...mockPrismaPayment, paymentId: 'payment-new' };
      prismaService.payment.create.mockResolvedValue(createdPayment);

      // Act
      const result = await repository.createPayment(mockNewPaymentData);

      // Assert
      expect(result).toEqual(mockPaymentData);
      expect(prismaService.payment.create).toHaveBeenCalledWith({
        data: {
          paymentId: mockNewPaymentData.paymentId,
          amount: mockNewPaymentData.amount,
          currency: mockNewPaymentData.currency,
          status: mockNewPaymentData.status,
          stripePaymentId: mockNewPaymentData.stripePaymentId,
          createdAt: expect.any(Date),
          order: { connect: { id: mockNewPaymentData.orderId } },
        },
      });
      expect(PrismaPaymentMapper.toDomain).toHaveBeenCalledWith(createdPayment);
    });

    it('should throw error when order does not exist', async () => {
      // Arrange
      const foreignKeyError = new Error('Order does not exist');
      prismaService.payment.create.mockRejectedValue(foreignKeyError);

      // Act & Assert
      await expect(
        repository.createPayment(mockNewPaymentData),
      ).rejects.toThrow('Order does not exist');
      expect(prismaService.payment.create).toHaveBeenCalledWith({
        data: {
          paymentId: mockNewPaymentData.paymentId,
          amount: mockNewPaymentData.amount,
          currency: mockNewPaymentData.currency,
          status: mockNewPaymentData.status,
          stripePaymentId: mockNewPaymentData.stripePaymentId,
          createdAt: expect.any(Date),
          order: { connect: { id: mockNewPaymentData.orderId } },
        },
      });
    });

    it('should throw error when paymentId already exists', async () => {
      // Arrange
      const uniqueConstraintError = new Error('PaymentId already exists');
      prismaService.payment.create.mockRejectedValue(uniqueConstraintError);

      // Act & Assert
      await expect(repository.createPayment(mockPaymentData)).rejects.toThrow(
        'PaymentId already exists',
      );
      expect(prismaService.payment.create).toHaveBeenCalled();
    });

    it('should handle database error during payment creation', async () => {
      // Arrange
      const dbError = new Error('Database creation error');
      prismaService.payment.create.mockRejectedValue(dbError);

      // Act & Assert
      await expect(
        repository.createPayment(mockNewPaymentData),
      ).rejects.toThrow('Database creation error');
      expect(prismaService.payment.create).toHaveBeenCalled();
    });
  });

  describe('getPayment', () => {
    it('should return payment when found', async () => {
      // Arrange
      prismaService.payment.findUnique.mockResolvedValue(mockPrismaPayment);

      // Act
      const result = await repository.getPayment(mockPaymentId);

      // Assert
      expect(result).toEqual(mockPaymentData);
      expect(prismaService.payment.findUnique).toHaveBeenCalledWith({
        where: { paymentId: mockPaymentId },
      });
      expect(PrismaPaymentMapper.toDomain).toHaveBeenCalledWith(
        mockPrismaPayment,
      );
    });

    it('should return null when payment not found', async () => {
      // Arrange
      prismaService.payment.findUnique.mockResolvedValue(null);

      // Act
      const result = await repository.getPayment('invalid-id');

      // Assert
      expect(result).toBeNull();
      expect(prismaService.payment.findUnique).toHaveBeenCalledWith({
        where: { paymentId: 'invalid-id' },
      });
      expect(PrismaPaymentMapper.toDomain).not.toHaveBeenCalled();
    });

    it('should handle database error during payment retrieval', async () => {
      // Arrange
      const dbError = new Error('Database retrieval error');
      prismaService.payment.findUnique.mockRejectedValue(dbError);

      // Act & Assert
      await expect(repository.getPayment(mockPaymentId)).rejects.toThrow(
        'Database retrieval error',
      );
      expect(prismaService.payment.findUnique).toHaveBeenCalledWith({
        where: { paymentId: mockPaymentId },
      });
    });
  });
});
