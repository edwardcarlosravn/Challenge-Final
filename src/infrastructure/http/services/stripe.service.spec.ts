/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import Stripe from 'stripe';
import { StripeService } from './stripe.service';

// Mock Stripe
jest.mock('stripe');

describe('StripeService', () => {
  let service: StripeService;
  let mockStripe: jest.Mocked<Stripe>;
  let mockPaymentIntents: jest.Mocked<Stripe.PaymentIntentsResource>;
  let mockWebhooks: any;

  const createMockPaymentIntent = (): Stripe.Response<Stripe.PaymentIntent> =>
    ({
      id: 'pi_test_payment_intent',
      object: 'payment_intent',
      amount: 2000,
      amount_capturable: 0,
      amount_received: 0,
      application: null,
      application_fee_amount: null,
      automatic_payment_methods: null,
      canceled_at: null,
      cancellation_reason: null,
      capture_method: 'automatic',
      charges: {
        object: 'list',
        data: [],
        has_more: false,
        total_count: 0,
        url: '/v1/charges?payment_intent=pi_test_payment_intent',
      },
      client_secret: 'pi_test_payment_intent_secret',
      confirmation_method: 'automatic',
      created: Math.floor(Date.now() / 1000),
      currency: 'usd',
      customer: null,
      description: null,
      invoice: null,
      last_payment_error: null,
      latest_charge: null,
      livemode: false,
      metadata: { paymentId: 'test-payment-id' },
      next_action: null,
      on_behalf_of: null,
      payment_method: null,
      payment_method_options: {},
      payment_method_types: ['card'],
      processing: null,
      receipt_email: null,
      review: null,
      setup_future_usage: null,
      shipping: null,
      statement_descriptor: null,
      statement_descriptor_suffix: null,
      status: 'requires_payment_method',
      transfer_data: null,
      transfer_group: null,
      lastResponse: {
        headers: {},
        requestId: 'req_test',
        statusCode: 200,
        apiVersion: '2023-10-16',
        idempotencyKey: undefined,
        stripeAccount: undefined,
      },
    }) as unknown as Stripe.Response<Stripe.PaymentIntent>;

  const createMockWebhookEvent = (): Stripe.Event => ({
    id: 'evt_test_webhook',
    object: 'event',
    api_version: '2023-10-16',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: 'pi_test_payment_intent',
        object: 'payment_intent',
      } as unknown as Stripe.PaymentIntent,
    },
    livemode: false,
    pending_webhooks: 1,
    request: {
      id: 'req_test',
      idempotency_key: null,
    },
    type: 'payment_intent.succeeded',
  });

  beforeEach(async () => {
    // Mock Stripe constructor and methods
    mockPaymentIntents = {
      create: jest.fn(),
    } as unknown as jest.Mocked<Stripe.PaymentIntentsResource>;

    mockWebhooks = {
      constructEvent: jest.fn(),
    };

    mockStripe = {
      paymentIntents: mockPaymentIntents,
      webhooks: mockWebhooks,
    } as unknown as jest.Mocked<Stripe>;

    (Stripe as jest.MockedClass<typeof Stripe>).mockImplementation(
      () => mockStripe,
    );

    // Set environment variable for testing
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake_key';

    const module: TestingModule = await Test.createTestingModule({
      providers: [StripeService],
    }).compile();

    service = module.get<StripeService>(StripeService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.STRIPE_SECRET_KEY;
  });

  describe('createPaymentIntent', () => {
    const mockProps = {
      amount: 20,
      currency: 'USD' as const,
      metadata: { paymentId: 'test-payment-id' },
    };

    it('should create payment intent successfully', async () => {
      // Arrange
      const mockPaymentIntent = createMockPaymentIntent();
      mockPaymentIntents.create.mockResolvedValue(mockPaymentIntent);

      // Act
      const result = await service.createPaymentIntent(mockProps);

      // Assert
      expect(mockPaymentIntents.create).toHaveBeenCalledWith({
        amount: 2000, // 20 * 100
        currency: 'USD',
        metadata: { paymentId: 'test-payment-id' },
      });
      expect(result).toEqual(mockPaymentIntent);
    });

    it('should pass metadata correctly to Stripe', async () => {
      // Arrange
      const mockPaymentIntent = createMockPaymentIntent();
      const customMetadata = { paymentId: 'custom-payment-123' };
      const propsWithCustomMetadata = {
        ...mockProps,
        metadata: customMetadata,
      };
      mockPaymentIntents.create.mockResolvedValue(mockPaymentIntent);

      // Act
      await service.createPaymentIntent(propsWithCustomMetadata);

      // Assert
      expect(mockPaymentIntents.create).toHaveBeenCalledWith({
        amount: 2000,
        currency: 'USD',
        metadata: customMetadata,
      });
    });

    it('should convert amount to cents correctly', async () => {
      // Arrange
      const mockPaymentIntent = createMockPaymentIntent();
      const propsWithDecimalAmount = {
        ...mockProps,
        amount: 25.99,
      };
      mockPaymentIntents.create.mockResolvedValue(mockPaymentIntent);

      // Act
      await service.createPaymentIntent(propsWithDecimalAmount);

      // Assert
      expect(mockPaymentIntents.create).toHaveBeenCalledWith({
        amount: 2599, // 25.99 * 100, rounded
        currency: 'USD',
        metadata: { paymentId: 'test-payment-id' },
      });
    });

    it('should handle network/connection errors', async () => {
      // Arrange
      const networkError = new Error('Network connection failed');
      mockPaymentIntents.create.mockRejectedValue(networkError);

      // Act & Assert
      await expect(service.createPaymentIntent(mockProps)).rejects.toThrow(
        'Network connection failed',
      );
      expect(mockPaymentIntents.create).toHaveBeenCalledWith({
        amount: 2000,
        currency: 'USD',
        metadata: { paymentId: 'test-payment-id' },
      });
    });

    it('should handle invalid amount values', async () => {
      // Arrange
      const mockPaymentIntent = createMockPaymentIntent();
      const propsWithZeroAmount = {
        ...mockProps,
        amount: 0,
      };
      mockPaymentIntents.create.mockResolvedValue(mockPaymentIntent);

      // Act
      await service.createPaymentIntent(propsWithZeroAmount);

      // Assert
      expect(mockPaymentIntents.create).toHaveBeenCalledWith({
        amount: 0, // Should still pass 0 to Stripe (Stripe will handle validation)
        currency: 'USD',
        metadata: { paymentId: 'test-payment-id' },
      });
    });
  });

  describe('webhookConstructEvent', () => {
    const mockBody = JSON.stringify({
      id: 'evt_test_webhook',
      object: 'event',
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_test_payment_intent',
          object: 'payment_intent',
        },
      },
    });
    const mockSignature = 'whsec_test_signature';
    const mockEndpointSecret = 'whsec_test_endpoint_secret';

    it('should construct webhook event successfully', () => {
      // Arrange
      const mockEvent = createMockWebhookEvent();
      mockWebhooks.constructEvent.mockReturnValue(mockEvent);

      // Act
      const result = service.webhookConstructEvent(
        mockBody,
        mockSignature,
        mockEndpointSecret,
      );

      // Assert
      expect(mockWebhooks.constructEvent).toHaveBeenCalledWith(
        mockBody,
        mockSignature,
        mockEndpointSecret,
      );
      expect(result).toEqual(mockEvent);
    });

    it('should handle valid webhook payload and signature', () => {
      // Arrange
      const mockEvent = createMockWebhookEvent();
      const validBody = Buffer.from(mockBody);
      const validSignature = 't=1234567890,v1=valid_signature_hash';
      mockWebhooks.constructEvent.mockReturnValue(mockEvent);

      // Act
      const result = service.webhookConstructEvent(
        validBody,
        validSignature,
        mockEndpointSecret,
      );

      // Assert
      expect(mockWebhooks.constructEvent).toHaveBeenCalledWith(
        validBody,
        validSignature,
        mockEndpointSecret,
      );
      expect(result).toEqual(mockEvent);
      expect(result.type).toBe('payment_intent.succeeded');
    });

    it('should handle invalid webhook signature', () => {
      // Arrange
      const signatureError = new Error('Invalid signature');
      mockWebhooks.constructEvent.mockImplementation(() => {
        throw signatureError;
      });

      // Act & Assert
      expect(() =>
        service.webhookConstructEvent(
          mockBody,
          'invalid_signature',
          mockEndpointSecret,
        ),
      ).toThrow('Invalid signature');
      expect(mockWebhooks.constructEvent).toHaveBeenCalledWith(
        mockBody,
        'invalid_signature',
        mockEndpointSecret,
      );
    });

    it('should handle missing webhook parameters', () => {
      // Arrange
      const missingParameterError = new Error('Missing required parameter');
      mockWebhooks.constructEvent.mockImplementation(() => {
        throw missingParameterError;
      });

      // Act & Assert
      expect(() => service.webhookConstructEvent(null, null, null)).toThrow(
        'Missing required parameter',
      );
      expect(mockWebhooks.constructEvent).toHaveBeenCalledWith(
        null,
        null,
        null,
      );
    });

    it('should handle malformed webhook body', () => {
      // Arrange
      const malformedBodyError = new Error('Unexpected end of JSON input');
      const malformedBody = '{"incomplete": json';
      mockWebhooks.constructEvent.mockImplementation(() => {
        throw malformedBodyError;
      });

      // Act & Assert
      expect(() =>
        service.webhookConstructEvent(
          malformedBody,
          mockSignature,
          mockEndpointSecret,
        ),
      ).toThrow('Unexpected end of JSON input');
      expect(mockWebhooks.constructEvent).toHaveBeenCalledWith(
        malformedBody,
        mockSignature,
        mockEndpointSecret,
      );
    });

    it('should handle different webhook event types', () => {
      // Arrange
      const paymentFailedEvent = {
        ...createMockWebhookEvent(),
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: 'pi_test_payment_intent_failed',
            object: 'payment_intent',
            status: 'failed',
          } as unknown as Stripe.PaymentIntent,
        },
      };
      mockWebhooks.constructEvent.mockReturnValue(paymentFailedEvent);

      // Act
      const result = service.webhookConstructEvent(
        mockBody,
        mockSignature,
        mockEndpointSecret,
      );

      // Assert
      expect(result.type).toBe('payment_intent.payment_failed');
      expect((result.data.object as any).id).toBe(
        'pi_test_payment_intent_failed',
      );
    });
  });

  describe('Service Initialization', () => {
    it('should initialize Stripe with the correct API key', () => {
      // Assert
      expect(Stripe).toHaveBeenCalledWith('sk_test_fake_key');
    });
  });
});
