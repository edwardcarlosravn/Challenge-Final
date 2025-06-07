import { Test, TestingModule } from '@nestjs/testing';
import { CreatePaymentUseCase } from './create-payment.use-case';
import { OrderRepository } from 'src/application/contracts/persistence/order-repository.interface';
import { PaymentRepository } from 'src/application/contracts/persistence/payment.interface';
import { StripeService } from 'src/infrastructure/http/services/stripe.service';
import { Payment } from 'src/domain/payment';
import { Order } from 'src/domain/order';
import { randomUUID } from 'crypto';
import Stripe from 'stripe';

jest.mock('crypto', () => ({
  randomUUID: jest.fn(),
}));

const mockRandomUUID = randomUUID as jest.MockedFunction<typeof randomUUID>;

describe('CreatePaymentUseCase', () => {
  let useCase: CreatePaymentUseCase;
  let mockOrderRepository: jest.Mocked<OrderRepository>;
  let mockPaymentRepository: jest.Mocked<PaymentRepository>;
  let mockStripeService: {
    createPaymentIntent: jest.MockedFunction<
      StripeService['createPaymentIntent']
    >;
    webhookConstructEvent: jest.MockedFunction<
      StripeService['webhookConstructEvent']
    >;
  };

  beforeEach(async () => {
    mockOrderRepository = {
      createFromCart: jest.fn(),
      findOrders: jest.fn(),
      getOrder: jest.fn(),
      updateStatus: jest.fn(),
      getOrderOrThrow: jest.fn(),
    };

    mockPaymentRepository = {
      createPayment: jest.fn(),
      getPayment: jest.fn(),
      updatePayment: jest.fn(),
      handleDBError: jest.fn(),
    };

    mockStripeService = {
      createPaymentIntent: jest.fn(),
      webhookConstructEvent: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreatePaymentUseCase,
        {
          provide: 'OrderRepository',
          useValue: mockOrderRepository,
        },
        {
          provide: 'PaymentRepository',
          useValue: mockPaymentRepository,
        },
        {
          provide: StripeService,
          useValue: mockStripeService,
        },
      ],
    }).compile();

    useCase = module.get<CreatePaymentUseCase>(CreatePaymentUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const validInput = {
      orderId: 'order-123',
      userId: '1',
    };

    const mockOrder = new Order(
      'order-123',
      1,
      '123 Main St, City, State 12345',
      'PENDING',
      new Date('2025-01-01'),
      99.99,
      [],
      new Date('2025-01-01'),
      new Date('2025-01-01'),
    );

    it('should create payment successfully', async () => {
      // Arrange
      const mockPaymentId = '123e4567-e89b-12d3-a456-426614174000';
      const mockStripePaymentId = '123e4567-e89b-12d3-a456-426614174001';

      mockRandomUUID
        .mockReturnValueOnce(mockPaymentId)
        .mockReturnValueOnce(mockStripePaymentId);

      const expectedPayment = new Payment(
        mockPaymentId,
        'order-123',
        mockStripePaymentId,
        99.99,
        'USD',
        'PENDING',
      );

      mockOrderRepository.getOrderOrThrow.mockResolvedValue(mockOrder);
      mockPaymentRepository.createPayment.mockResolvedValue(expectedPayment);
      mockStripeService.createPaymentIntent.mockResolvedValue({
        id: 'pi_test',
      } as Stripe.Response<Stripe.PaymentIntent>);

      // Act
      const result = await useCase.execute(validInput);

      // Assert
      expect(mockOrderRepository.getOrderOrThrow).toHaveBeenCalledWith(
        'order-123',
      );
      expect(mockPaymentRepository.createPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentId: mockPaymentId,
          orderId: 'order-123',
          stripePaymentId: mockStripePaymentId,
          amount: 99.99,
          currency: 'USD',
          status: 'PENDING',
        }),
      );
      expect(mockStripeService.createPaymentIntent).toHaveBeenCalledWith({
        amount: 99.99,
        currency: 'USD',
        metadata: { paymentId: mockPaymentId },
      });
      expect(result).toEqual(expectedPayment);
    });

    it('should throw error when order not found', async () => {
      // Arrange
      const repositoryError = new Error('Order not found');
      mockOrderRepository.getOrderOrThrow.mockRejectedValue(repositoryError);

      // Act & Assert
      await expect(useCase.execute(validInput)).rejects.toThrow(
        'Order not found',
      );
      expect(mockPaymentRepository.createPayment).not.toHaveBeenCalled();
      expect(mockStripeService.createPaymentIntent).not.toHaveBeenCalled();
    });

    it('should handle payment repository errors', async () => {
      // Arrange
      const paymentError = new Error('Database connection failed');
      mockOrderRepository.getOrderOrThrow.mockResolvedValue(mockOrder);
      mockPaymentRepository.createPayment.mockRejectedValue(paymentError);

      // Act & Assert
      await expect(useCase.execute(validInput)).rejects.toThrow(
        'Database connection failed',
      );
      expect(mockStripeService.createPaymentIntent).not.toHaveBeenCalled();
    });

    it('should handle stripe service errors', async () => {
      // Arrange
      const stripeError = new Error('Stripe API error');
      const validPayment = new Payment(
        'payment-123',
        'order-123',
        'stripe-123',
        99.99,
        'USD',
        'PENDING',
      );

      mockOrderRepository.getOrderOrThrow.mockResolvedValue(mockOrder);
      mockPaymentRepository.createPayment.mockResolvedValue(validPayment);
      mockStripeService.createPaymentIntent.mockRejectedValue(stripeError);

      // Act & Assert
      await expect(useCase.execute(validInput)).rejects.toThrow(
        'Stripe API error',
      );
    });

    it('should create payment with correct initial status', async () => {
      // Arrange
      mockRandomUUID
        .mockReturnValueOnce('123e4567-e89b-12d3-a456-426614174002')
        .mockReturnValueOnce('123e4567-e89b-12d3-a456-426614174003');

      const expectedPayment = new Payment(
        '123e4567-e89b-12d3-a456-426614174002',
        'order-123',
        '123e4567-e89b-12d3-a456-426614174003',
        99.99,
        'USD',
        'PENDING',
      );

      mockOrderRepository.getOrderOrThrow.mockResolvedValue(mockOrder);
      mockPaymentRepository.createPayment.mockResolvedValue(expectedPayment);
      mockStripeService.createPaymentIntent.mockResolvedValue({
        id: 'pi_test',
      } as Stripe.Response<Stripe.PaymentIntent>);

      // Act
      const result = await useCase.execute(validInput);

      // Assert
      expect(mockPaymentRepository.createPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'PENDING',
        }),
      );
      expect(result.status).toBe('PENDING');
    });
  });
});
