import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { StripePaymentGateway } from './stripe-payment.gateway';
import { DomainError, ErrorCodes } from '@shared/errors/error-codes';

// Mock Stripe instance
const mockStripeCheckoutCreate = jest.fn();

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    checkout: {
      sessions: {
        create: mockStripeCheckoutCreate,
        retrieve: jest.fn(),
      },
    },
    subscriptions: {
      retrieve: jest.fn(),
      cancel: jest.fn(),
    },
    customers: {
      retrieve: jest.fn(),
    },
    webhooks: {
      constructEvent: jest.fn(),
    },
  }));
});

describe('StripePaymentGateway', () => {
  let gateway: StripePaymentGateway;

  beforeEach(async () => {
    jest.clearAllMocks();
    // Silence logger to avoid noisy test output
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StripePaymentGateway,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'STRIPE_SECRET_KEY') return 'sk_test_123';
              if (key === 'STRIPE_WEBHOOK_SECRET') return 'whsec_123';
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    gateway = module.get<StripePaymentGateway>(StripePaymentGateway);
  });

  describe('createCheckoutSession', () => {
    const validInput = {
      email: 'user@example.com',
      priceId: 'price_123',
      successUrl: 'splice://payment-success?session_id={CHECKOUT_SESSION_ID}',
      cancelUrl: 'splice://payment-cancelled',
      metadata: { source: 'desktop-app' },
    };

    it('should create a checkout session successfully', async () => {
      // Arrange
      mockStripeCheckoutCreate.mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/pay/cs_test_123',
      });

      // Act
      const result = await gateway.createCheckoutSession(validInput);

      // Assert
      expect(result).toEqual({
        checkoutUrl: 'https://checkout.stripe.com/pay/cs_test_123',
        sessionId: 'cs_test_123',
      });
    });

    it('should call Stripe with correct parameters', async () => {
      // Arrange
      mockStripeCheckoutCreate.mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/pay/cs_test_123',
      });

      // Act
      await gateway.createCheckoutSession(validInput);

      // Assert
      expect(mockStripeCheckoutCreate).toHaveBeenCalledWith({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: 'price_123',
            quantity: 1,
          },
        ],
        customer_email: 'user@example.com',
        success_url: 'splice://payment-success?session_id={CHECKOUT_SESSION_ID}',
        cancel_url: 'splice://payment-cancelled',
        metadata: { source: 'desktop-app' },
      });
    });

    it('should throw STRIPE_CHECKOUT_FAILED on Stripe API error', async () => {
      // Arrange
      mockStripeCheckoutCreate.mockRejectedValue(new Error('Stripe API error'));

      // Act & Assert
      await expect(gateway.createCheckoutSession(validInput)).rejects.toThrow(DomainError);
      await expect(gateway.createCheckoutSession(validInput)).rejects.toMatchObject({
        code: ErrorCodes.STRIPE_CHECKOUT_FAILED,
      });
    });

    it('should throw STRIPE_CHECKOUT_FAILED when session URL is null', async () => {
      // Arrange
      mockStripeCheckoutCreate.mockResolvedValue({
        id: 'cs_test_123',
        url: null, // URL can be null in some edge cases
      });

      // Act & Assert
      await expect(gateway.createCheckoutSession(validInput)).rejects.toThrow(DomainError);
      await expect(gateway.createCheckoutSession(validInput)).rejects.toMatchObject({
        code: ErrorCodes.STRIPE_CHECKOUT_FAILED,
      });
    });

    it('should handle missing metadata gracefully', async () => {
      // Arrange
      const inputWithoutMetadata = {
        email: 'user@example.com',
        priceId: 'price_123',
        successUrl: 'splice://success',
        cancelUrl: 'splice://cancel',
      };

      mockStripeCheckoutCreate.mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/pay/cs_test_123',
      });

      // Act
      const result = await gateway.createCheckoutSession(inputWithoutMetadata);

      // Assert
      expect(result.sessionId).toBe('cs_test_123');
      expect(mockStripeCheckoutCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: undefined,
        }),
      );
    });
  });
});
