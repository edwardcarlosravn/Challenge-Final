import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ProcessPaymentUseCase } from './process-payment.use-case';
import { PaymentRepository } from 'src/application/contracts/persistence/payment.interface';
import { OrderRepository } from 'src/application/contracts/persistence/order-repository.interface';
import { StripeService } from 'src/infrastructure/http/services/stripe.service';
import { RedisStockAlert } from 'src/redis/redis-stock-alert.service';
import { Payment } from 'src/domain/payment';
import { Order } from 'src/domain/order';
import Stripe from 'stripe';

describe('ProcessPaymentUseCase', () => {
  let useCase: ProcessPaymentUseCase;
  let mockPaymentRepository: jest.Mocked<PaymentRepository>;
  let mockOrderRepository: jest.Mocked<OrderRepository>;
  let mockStripeService: {
    createPaymentIntent: jest.MockedFunction<
      StripeService['createPaymentIntent']
    >;
    webhookConstructEvent: jest.MockedFunction<
      StripeService['webhookConstructEvent']
    >;
  };
  let mockRedisStockAlert: {
    checkStockAndNotify: jest.MockedFunction<
      RedisStockAlert['checkStockAndNotify']
    >;
  };

  beforeEach(async () => {
    mockPaymentRepository = {
      createPayment: jest.fn(),
      getPayment: jest.fn(),
      updatePayment: jest.fn(),
      handleDBError: jest.fn(),
    };

    mockOrderRepository = {
      createFromCart: jest.fn(),
      findOrders: jest.fn(),
      getOrder: jest.fn(),
      updateStatus: jest.fn(),
      getOrderOrThrow: jest.fn(),
    };

    mockStripeService = {
      createPaymentIntent: jest.fn(),
      webhookConstructEvent: jest.fn(),
    };

    mockRedisStockAlert = {
      checkStockAndNotify: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProcessPaymentUseCase,
        {
          provide: 'PaymentRepository',
          useValue: mockPaymentRepository,
        },
        {
          provide: 'OrderRepository',
          useValue: mockOrderRepository,
        },
        {
          provide: StripeService,
          useValue: mockStripeService,
        },
        {
          provide: RedisStockAlert,
          useValue: mockRedisStockAlert,
        },
      ],
    }).compile();

    useCase = module.get<ProcessPaymentUseCase>(ProcessPaymentUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const validInput = {
      paymentId: '123e4567-e89b-12d3-a456-426614174000',
      rawBody: Buffer.from('test-body'),
      signature: 'test-signature',
      paymentAt: 1640995200,
    };

    const mockPayment = new Payment(
      '123e4567-e89b-12d3-a456-426614174000',
      'order-123',
      'stripe-123',
      99.99,
      'USD',
      'PENDING',
    );

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

    it('should process successful payment', async () => {
      // Arrange
      const mockStripeEvent: Stripe.Event = {
        id: 'evt_test',
        object: 'event',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test',
          } as Stripe.PaymentIntent,
        },
      } as Stripe.Event;

      const updatedPayment = new Payment(
        '123e4567-e89b-12d3-a456-426614174000',
        'order-123',
        'pi_test',
        99.99,
        'USD',
        'PAID',
        new Date(1640995200 * 1000),
      );

      mockPaymentRepository.getPayment.mockResolvedValue(mockPayment);
      mockOrderRepository.getOrder.mockResolvedValue(mockOrder);
      mockStripeService.webhookConstructEvent.mockReturnValue(mockStripeEvent);
      mockPaymentRepository.updatePayment.mockResolvedValue(updatedPayment);
      mockRedisStockAlert.checkStockAndNotify.mockResolvedValue();

      // Act
      const result = await useCase.execute(validInput);

      // Assert
      expect(mockPaymentRepository.getPayment).toHaveBeenCalledWith(
        '123e4567-e89b-12d3-a456-426614174000',
      );
      expect(mockOrderRepository.getOrder).toHaveBeenCalledWith('order-123');
      expect(mockStripeService.webhookConstructEvent).toHaveBeenCalledWith(
        validInput.rawBody,
        validInput.signature,
        process.env.STRIPE_WEBHOOK_SECRET,
      );
      expect(mockPaymentRepository.updatePayment).toHaveBeenCalledWith(
        '123e4567-e89b-12d3-a456-426614174000',
        expect.objectContaining({
          status: 'PAID',
          stripePaymentId: 'pi_test',
          paymentAt: new Date(1640995200 * 1000),
        }),
      );
      expect(result).toEqual(updatedPayment);
    });

    it('should throw BadRequestException when payment not found', async () => {
      // Arrange
      mockPaymentRepository.getPayment.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(validInput)).rejects.toThrow(
        BadRequestException,
      );
      await expect(useCase.execute(validInput)).rejects.toThrow(
        'Payment not found',
      );
      expect(mockOrderRepository.getOrder).not.toHaveBeenCalled();
      expect(mockStripeService.webhookConstructEvent).not.toHaveBeenCalled();
      expect(mockPaymentRepository.updatePayment).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when order already paid', async () => {
      // Arrange
      const paidOrder = new Order(
        'order-123',
        1,
        '123 Main St, City, State 12345',
        'APPROVED',
        new Date('2025-01-01'),
        99.99,
        [],
        new Date('2025-01-01'),
        new Date('2025-01-01'),
      );

      mockPaymentRepository.getPayment.mockResolvedValue(mockPayment);
      mockOrderRepository.getOrder.mockResolvedValue(paidOrder);

      // Act & Assert
      await expect(useCase.execute(validInput)).rejects.toThrow(
        BadRequestException,
      );
      await expect(useCase.execute(validInput)).rejects.toThrow(
        'This order has already been paid',
      );
      expect(mockStripeService.webhookConstructEvent).not.toHaveBeenCalled();
      expect(mockPaymentRepository.updatePayment).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when webhook signature verification fails', async () => {
      // Arrange
      mockPaymentRepository.getPayment.mockResolvedValue(mockPayment);
      mockOrderRepository.getOrder.mockResolvedValue(mockOrder);
      mockStripeService.webhookConstructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      // Act & Assert
      await expect(useCase.execute(validInput)).rejects.toThrow(
        BadRequestException,
      );
      await expect(useCase.execute(validInput)).rejects.toThrow(
        'Webhook Error Error: Invalid signature',
      );
      expect(mockPaymentRepository.updatePayment).not.toHaveBeenCalled();
    });
  });
});
