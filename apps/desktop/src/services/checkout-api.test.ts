import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createCheckoutSession,
  CheckoutApiError,
} from './checkout-api';

describe('checkout-api', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('createCheckoutSession', () => {
    it('should return checkout URL and session ID on success', async () => {
      // Arrange
      globalThis.fetch = vi.fn().mockResolvedValue({
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              checkoutUrl: 'https://checkout.stripe.com/session123',
              sessionId: 'cs_123abc',
            },
          }),
      });

      // Act
      const result = await createCheckoutSession('user@example.com', 'price_123');

      // Assert
      expect(result).toEqual({
        checkoutUrl: 'https://checkout.stripe.com/session123',
        sessionId: 'cs_123abc',
      });
    });

    it('should call fetch with correct URL and headers', async () => {
      // Arrange
      const mockFetch = vi.fn().mockResolvedValue({
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              checkoutUrl: 'https://checkout.stripe.com/session123',
              sessionId: 'cs_123abc',
            },
          }),
      });
      globalThis.fetch = mockFetch;

      // Act
      await createCheckoutSession('user@example.com', 'price_123');

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/stripe/checkout'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({ email: 'user@example.com', priceId: 'price_123' }),
        })
      );
    });

    it('should throw CheckoutApiError on API error response', async () => {
      // Arrange
      globalThis.fetch = vi.fn().mockResolvedValue({
        json: () =>
          Promise.resolve({
            success: false,
            error: {
              code: 'STRIPE_CHECKOUT_FAILED',
              message: 'Failed to create Stripe checkout session',
            },
          }),
      });

      // Act & Assert
      await expect(createCheckoutSession('user@example.com', 'price_123')).rejects.toThrow(
        CheckoutApiError
      );
    });

    it('should include error code in CheckoutApiError', async () => {
      // Arrange
      globalThis.fetch = vi.fn().mockResolvedValue({
        json: () =>
          Promise.resolve({
            success: false,
            error: {
              code: 'STRIPE_CHECKOUT_FAILED',
              message: 'Failed to create checkout session',
            },
          }),
      });

      // Act & Assert
      try {
        await createCheckoutSession('user@example.com', 'price_123');
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(CheckoutApiError);
        expect((e as CheckoutApiError).code).toBe('STRIPE_CHECKOUT_FAILED');
      }
    });

    it('should include error message in CheckoutApiError', async () => {
      // Arrange
      globalThis.fetch = vi.fn().mockResolvedValue({
        json: () =>
          Promise.resolve({
            success: false,
            error: {
              code: 'INTERNAL_ERROR',
              message: 'Something went wrong',
            },
          }),
      });

      // Act & Assert
      try {
        await createCheckoutSession('user@example.com', 'price_123');
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(CheckoutApiError);
        expect((e as CheckoutApiError).message).toBe('Something went wrong');
      }
    });

    it('should work with yearly price ID', async () => {
      // Arrange
      globalThis.fetch = vi.fn().mockResolvedValue({
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              checkoutUrl: 'https://checkout.stripe.com/yearly456',
              sessionId: 'cs_yearly_456',
            },
          }),
      });

      // Act
      const result = await createCheckoutSession('user@example.fr', 'price_yearly_456');

      // Assert
      expect(result.sessionId).toBe('cs_yearly_456');
    });

    it('should throw CheckoutApiError with NETWORK_ERROR on fetch failure', async () => {
      // Arrange
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network failure'));

      // Act & Assert
      try {
        await createCheckoutSession('user@example.com', 'price_123');
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(CheckoutApiError);
        expect((e as CheckoutApiError).code).toBe('NETWORK_ERROR');
        expect((e as CheckoutApiError).message).toContain('connexion');
      }
    });

    it('should throw CheckoutApiError with INVALID_RESPONSE on non-JSON response', async () => {
      // Arrange
      globalThis.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      // Act & Assert
      try {
        await createCheckoutSession('user@example.com', 'price_123');
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(CheckoutApiError);
        expect((e as CheckoutApiError).code).toBe('INVALID_RESPONSE');
      }
    });
  });
});
