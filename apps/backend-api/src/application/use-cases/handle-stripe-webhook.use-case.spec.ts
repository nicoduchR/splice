import { HandleStripeWebhookUseCase } from './handle-stripe-webhook.use-case';
import { ILicenseRepository } from '@domain/ports/license.repository.port';
import { IUserRepository } from '@domain/ports/user.repository.port';
import { IPaymentGateway, WebhookEvent } from '@domain/ports/payment.gateway.port';
import { User } from '@domain/entities/user.entity';
import { License } from '@domain/entities/license.entity';
import { Email } from '@domain/value-objects/email.vo';
import { LicenseKey } from '@domain/value-objects/license-key.vo';
import { Plan } from '@domain/value-objects/plan.vo';

describe('HandleStripeWebhookUseCase', () => {
  let useCase: HandleStripeWebhookUseCase;
  let mockLicenseRepository: jest.Mocked<ILicenseRepository>;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockPaymentGateway: jest.Mocked<IPaymentGateway>;

  const mockPayload = Buffer.from('{}');
  const mockSignature = 'sig_test';

  beforeEach(() => {
    mockLicenseRepository = {
      findByKey: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    mockUserRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByStripeCustomerId: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    mockPaymentGateway = {
      constructWebhookEvent: jest.fn(),
      getSubscription: jest.fn(),
      getCustomer: jest.fn(),
      getCheckoutSession: jest.fn(),
      cancelSubscription: jest.fn(),
    };

    useCase = new HandleStripeWebhookUseCase(
      mockLicenseRepository,
      mockUserRepository,
      mockPaymentGateway,
    );
  });

  describe('customer.subscription.created', () => {
    it('should create license when subscription is created', async () => {
      const event: WebhookEvent = {
        id: 'evt_123',
        type: 'customer.subscription.created',
        data: {
          object: {
            id: 'sub_123',
            customer: 'cus_123',
            status: 'active',
            current_period_end: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
            cancel_at_period_end: false,
          },
        },
      };

      const user = User.create({
        id: 'user-1',
        email: Email.create('test@example.com'),
        stripeCustomerId: 'cus_123',
        createdAt: new Date(),
      });

      mockPaymentGateway.constructWebhookEvent.mockReturnValue(event);
      mockUserRepository.findByStripeCustomerId.mockResolvedValue(user);
      mockLicenseRepository.save.mockImplementation(async (l) => l);

      const result = await useCase.execute(mockPayload, mockSignature);

      expect(result.handled).toBe(true);
      expect(result.eventType).toBe('customer.subscription.created');
      expect(mockLicenseRepository.save).toHaveBeenCalled();
    });

    it('should return not handled when user not found', async () => {
      const event: WebhookEvent = {
        id: 'evt_123',
        type: 'customer.subscription.created',
        data: {
          object: {
            id: 'sub_123',
            customer: 'cus_unknown',
            status: 'active',
            current_period_end: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
            cancel_at_period_end: false,
          },
        },
      };

      mockPaymentGateway.constructWebhookEvent.mockReturnValue(event);
      mockUserRepository.findByStripeCustomerId.mockResolvedValue(null);

      const result = await useCase.execute(mockPayload, mockSignature);

      expect(result.handled).toBe(false);
    });
  });

  describe('customer.subscription.deleted', () => {
    it('should expire license when subscription is deleted', async () => {
      const event: WebhookEvent = {
        id: 'evt_123',
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'sub_123',
            customer: 'cus_123',
            status: 'canceled',
            current_period_end: Math.floor(Date.now() / 1000),
            cancel_at_period_end: true,
          },
        },
      };

      const user = User.create({
        id: 'user-1',
        email: Email.create('test@example.com'),
        stripeCustomerId: 'cus_123',
        createdAt: new Date(),
      });

      const license = License.create({
        id: 'lic_123',
        userId: 'user-1',
        licenseKey: LicenseKey.create('SPLICE-ABCD-EFGH-IJKL'),
        plan: Plan.pro(),
        status: 'active',
        activatedAt: new Date(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      });

      mockPaymentGateway.constructWebhookEvent.mockReturnValue(event);
      mockUserRepository.findByStripeCustomerId.mockResolvedValue(user);
      mockLicenseRepository.findByUserId.mockResolvedValue([license]);
      mockLicenseRepository.update.mockImplementation(async (l) => l);

      const result = await useCase.execute(mockPayload, mockSignature);

      expect(result.handled).toBe(true);
      expect(mockLicenseRepository.update).toHaveBeenCalled();
    });
  });

  describe('checkout.session.completed', () => {
    it('should create user when checkout completed for new customer', async () => {
      const event: WebhookEvent = {
        id: 'evt_123',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_123',
            customer: 'cus_new',
            customer_email: 'new@example.com',
            subscription: 'sub_123',
          },
        },
      };

      mockPaymentGateway.constructWebhookEvent.mockReturnValue(event);
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.save.mockImplementation(async (u) => u);

      const result = await useCase.execute(mockPayload, mockSignature);

      expect(result.handled).toBe(true);
      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('should link Stripe customer to existing user', async () => {
      const event: WebhookEvent = {
        id: 'evt_123',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_123',
            customer: 'cus_new',
            customer_email: 'existing@example.com',
            subscription: 'sub_123',
          },
        },
      };

      const existingUser = User.create({
        id: 'user-existing',
        email: Email.create('existing@example.com'),
        stripeCustomerId: null,
        createdAt: new Date(),
      });

      mockPaymentGateway.constructWebhookEvent.mockReturnValue(event);
      mockUserRepository.findByEmail.mockResolvedValue(existingUser);
      mockUserRepository.update.mockImplementation(async (u) => u);

      const result = await useCase.execute(mockPayload, mockSignature);

      expect(result.handled).toBe(true);
      expect(mockUserRepository.update).toHaveBeenCalled();
    });
  });

  describe('unhandled events', () => {
    it('should return not handled for unknown event types', async () => {
      const event: WebhookEvent = {
        id: 'evt_123',
        type: 'some.unknown.event',
        data: { object: {} },
      };

      mockPaymentGateway.constructWebhookEvent.mockReturnValue(event);

      const result = await useCase.execute(mockPayload, mockSignature);

      expect(result.handled).toBe(false);
      expect(result.eventType).toBe('some.unknown.event');
    });
  });
});
