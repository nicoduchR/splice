import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { StripeCheckoutController } from './stripe-checkout.controller';
import { CreateCheckoutSessionUseCase } from '@application/use-cases/create-checkout-session.use-case';
import { DomainError, ErrorCodes } from '@shared/errors/error-codes';
import { ApiKeyGuard } from '@infrastructure/guards/api-key.guard';

describe('StripeCheckoutController', () => {
  let controller: StripeCheckoutController;
  let mockCreateCheckoutSessionUseCase: jest.Mocked<CreateCheckoutSessionUseCase>;

  beforeEach(async () => {
    // Silence logger to avoid noisy test output
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});

    mockCreateCheckoutSessionUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<CreateCheckoutSessionUseCase>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StripeCheckoutController],
      providers: [
        {
          provide: CreateCheckoutSessionUseCase,
          useValue: mockCreateCheckoutSessionUseCase,
        },
      ],
    })
      .overrideGuard(ApiKeyGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<StripeCheckoutController>(StripeCheckoutController);
  });

  describe('createCheckout', () => {
    const validDto = {
      email: 'user@example.com',
      priceId: 'price_123',
    };

    it('should return success response with checkout URL and session ID', async () => {
      // Arrange
      mockCreateCheckoutSessionUseCase.execute.mockResolvedValue({
        checkoutUrl: 'https://checkout.stripe.com/session123',
        sessionId: 'cs_123abc',
      });

      // Act
      const result = await controller.createCheckout(validDto);

      // Assert
      expect(result).toEqual({
        success: true,
        data: {
          checkoutUrl: 'https://checkout.stripe.com/session123',
          sessionId: 'cs_123abc',
        },
      });
    });

    it('should call use case with correct parameters', async () => {
      // Arrange
      mockCreateCheckoutSessionUseCase.execute.mockResolvedValue({
        checkoutUrl: 'https://checkout.stripe.com/session123',
        sessionId: 'cs_123abc',
      });

      // Act
      await controller.createCheckout(validDto);

      // Assert
      expect(mockCreateCheckoutSessionUseCase.execute).toHaveBeenCalledWith(validDto);
    });

    it('should return error response on DomainError', async () => {
      // Arrange
      mockCreateCheckoutSessionUseCase.execute.mockRejectedValue(
        DomainError.fromCode(ErrorCodes.STRIPE_CHECKOUT_FAILED),
      );

      // Act
      const result = await controller.createCheckout(validDto);

      // Assert
      expect(result).toEqual({
        success: false,
        error: {
          code: ErrorCodes.STRIPE_CHECKOUT_FAILED,
          message: 'Failed to create Stripe checkout session',
        },
      });
    });

    it('should return internal error response on unknown error', async () => {
      // Arrange
      mockCreateCheckoutSessionUseCase.execute.mockRejectedValue(
        new Error('Unknown error'),
      );

      // Act
      const result = await controller.createCheckout(validDto);

      // Assert
      expect(result).toEqual({
        success: false,
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: 'Failed to create checkout session',
        },
      });
    });

    it('should work with different email addresses', async () => {
      // Arrange
      const frenchDto = {
        email: 'utilisateur@example.fr',
        priceId: 'price_yearly_456',
      };

      mockCreateCheckoutSessionUseCase.execute.mockResolvedValue({
        checkoutUrl: 'https://checkout.stripe.com/session456',
        sessionId: 'cs_456def',
      });

      // Act
      const result = await controller.createCheckout(frenchDto);

      // Assert
      expect(result.success).toBe(true);
      expect(mockCreateCheckoutSessionUseCase.execute).toHaveBeenCalledWith(frenchDto);
    });
  });
});
