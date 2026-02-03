import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CreateCheckoutSessionUseCase } from './create-checkout-session.use-case';
import { PAYMENT_GATEWAY, IPaymentGateway } from '@domain/ports/payment.gateway.port';
import { CreateCheckoutSessionDto } from '../dto/create-checkout-session.dto';
import { DomainError, ErrorCodes } from '@shared/errors/error-codes';

describe('CreateCheckoutSessionUseCase', () => {
  let useCase: CreateCheckoutSessionUseCase;
  let mockPaymentGateway: jest.Mocked<IPaymentGateway>;
  let mockConfigService: jest.Mocked<ConfigService>;

  const createModule = async (priceIds: { monthly?: string; yearly?: string } = {}) => {
    mockPaymentGateway = {
      constructWebhookEvent: jest.fn(),
      getSubscription: jest.fn(),
      getCustomer: jest.fn(),
      getCheckoutSession: jest.fn(),
      cancelSubscription: jest.fn(),
      createCheckoutSession: jest.fn(),
    };

    mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'STRIPE_PRICE_ID_MONTHLY') return priceIds.monthly;
        if (key === 'STRIPE_PRICE_ID_YEARLY') return priceIds.yearly;
        return undefined;
      }),
    } as unknown as jest.Mocked<ConfigService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateCheckoutSessionUseCase,
        {
          provide: PAYMENT_GATEWAY,
          useValue: mockPaymentGateway,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    return module.get<CreateCheckoutSessionUseCase>(CreateCheckoutSessionUseCase);
  };

  beforeEach(async () => {
    // Default: no price ID validation (empty whitelist allows all)
    useCase = await createModule();
  });

  describe('execute', () => {
    const validDto: CreateCheckoutSessionDto = {
      email: 'user@example.com',
      priceId: 'price_123abc',
    };

    it('should create a checkout session with correct parameters', async () => {
      // Arrange
      mockPaymentGateway.createCheckoutSession.mockResolvedValue({
        checkoutUrl: 'https://checkout.stripe.com/session123',
        sessionId: 'cs_123abc',
      });

      // Act
      const result = await useCase.execute(validDto);

      // Assert
      expect(result).toEqual({
        checkoutUrl: 'https://checkout.stripe.com/session123',
        sessionId: 'cs_123abc',
      });
    });

    it('should pass correct success_url with session placeholder', async () => {
      // Arrange
      mockPaymentGateway.createCheckoutSession.mockResolvedValue({
        checkoutUrl: 'https://checkout.stripe.com/session123',
        sessionId: 'cs_123abc',
      });

      // Act
      await useCase.execute(validDto);

      // Assert
      expect(mockPaymentGateway.createCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({
          successUrl: 'splice://payment-success?session_id={CHECKOUT_SESSION_ID}',
        }),
      );
    });

    it('should pass correct cancel_url', async () => {
      // Arrange
      mockPaymentGateway.createCheckoutSession.mockResolvedValue({
        checkoutUrl: 'https://checkout.stripe.com/session123',
        sessionId: 'cs_123abc',
      });

      // Act
      await useCase.execute(validDto);

      // Assert
      expect(mockPaymentGateway.createCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({
          cancelUrl: 'splice://payment-cancelled',
        }),
      );
    });

    it('should pass email from DTO', async () => {
      // Arrange
      mockPaymentGateway.createCheckoutSession.mockResolvedValue({
        checkoutUrl: 'https://checkout.stripe.com/session123',
        sessionId: 'cs_123abc',
      });

      // Act
      await useCase.execute(validDto);

      // Assert
      expect(mockPaymentGateway.createCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'user@example.com',
        }),
      );
    });

    it('should pass priceId from DTO', async () => {
      // Arrange
      mockPaymentGateway.createCheckoutSession.mockResolvedValue({
        checkoutUrl: 'https://checkout.stripe.com/session123',
        sessionId: 'cs_123abc',
      });

      // Act
      await useCase.execute(validDto);

      // Assert
      expect(mockPaymentGateway.createCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({
          priceId: 'price_123abc',
        }),
      );
    });

    it('should include metadata.source as desktop-app', async () => {
      // Arrange
      mockPaymentGateway.createCheckoutSession.mockResolvedValue({
        checkoutUrl: 'https://checkout.stripe.com/session123',
        sessionId: 'cs_123abc',
      });

      // Act
      await useCase.execute(validDto);

      // Assert
      expect(mockPaymentGateway.createCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: { source: 'desktop-app' },
        }),
      );
    });

    it('should propagate DomainError from payment gateway', async () => {
      // Arrange
      mockPaymentGateway.createCheckoutSession.mockRejectedValue(
        DomainError.fromCode(ErrorCodes.STRIPE_CHECKOUT_FAILED),
      );

      // Act & Assert
      await expect(useCase.execute(validDto)).rejects.toThrow(DomainError);
    });

    it('should work with different email and priceId', async () => {
      // Arrange
      const differentDto: CreateCheckoutSessionDto = {
        email: 'autre@example.fr',
        priceId: 'price_yearly_456',
      };
      mockPaymentGateway.createCheckoutSession.mockResolvedValue({
        checkoutUrl: 'https://checkout.stripe.com/session456',
        sessionId: 'cs_456def',
      });

      // Act
      const result = await useCase.execute(differentDto);

      // Assert
      expect(result.sessionId).toBe('cs_456def');
      expect(mockPaymentGateway.createCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'autre@example.fr',
          priceId: 'price_yearly_456',
        }),
      );
    });
  });

  describe('priceId validation', () => {
    it('should accept monthly priceId when configured', async () => {
      // Arrange
      const useCaseWithValidation = await createModule({
        monthly: 'price_monthly_123',
        yearly: 'price_yearly_456',
      });

      mockPaymentGateway.createCheckoutSession.mockResolvedValue({
        checkoutUrl: 'https://checkout.stripe.com/session123',
        sessionId: 'cs_123',
      });

      // Act & Assert
      await expect(
        useCaseWithValidation.execute({
          email: 'test@example.com',
          priceId: 'price_monthly_123',
        }),
      ).resolves.toBeDefined();
    });

    it('should accept yearly priceId when configured', async () => {
      // Arrange
      const useCaseWithValidation = await createModule({
        monthly: 'price_monthly_123',
        yearly: 'price_yearly_456',
      });

      mockPaymentGateway.createCheckoutSession.mockResolvedValue({
        checkoutUrl: 'https://checkout.stripe.com/session123',
        sessionId: 'cs_123',
      });

      // Act & Assert
      await expect(
        useCaseWithValidation.execute({
          email: 'test@example.com',
          priceId: 'price_yearly_456',
        }),
      ).resolves.toBeDefined();
    });

    it('should reject unauthorized priceId when whitelist is configured', async () => {
      // Arrange
      const useCaseWithValidation = await createModule({
        monthly: 'price_monthly_123',
        yearly: 'price_yearly_456',
      });

      // Act & Assert
      await expect(
        useCaseWithValidation.execute({
          email: 'test@example.com',
          priceId: 'price_attacker_999',
        }),
      ).rejects.toThrow(DomainError);

      await expect(
        useCaseWithValidation.execute({
          email: 'test@example.com',
          priceId: 'price_attacker_999',
        }),
      ).rejects.toMatchObject({
        code: ErrorCodes.VALIDATION_ERROR,
      });
    });

    it('should allow any priceId when no whitelist configured', async () => {
      // Arrange - no priceIds configured (default)
      const useCaseNoValidation = await createModule({});

      mockPaymentGateway.createCheckoutSession.mockResolvedValue({
        checkoutUrl: 'https://checkout.stripe.com/session123',
        sessionId: 'cs_123',
      });

      // Act & Assert - should allow any priceId
      await expect(
        useCaseNoValidation.execute({
          email: 'test@example.com',
          priceId: 'any_price_id',
        }),
      ).resolves.toBeDefined();
    });
  });
});
