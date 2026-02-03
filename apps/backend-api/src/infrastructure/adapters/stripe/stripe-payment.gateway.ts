import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import {
  IPaymentGateway,
  WebhookEvent,
  StripeSubscription,
  StripeCustomer,
  StripeCheckoutSession,
  CreateCheckoutSessionInput,
  CreateCheckoutSessionOutput,
} from '@domain/ports/payment.gateway.port';
import { DomainError, ErrorCodes } from '@shared/errors/error-codes';

@Injectable()
export class StripePaymentGateway implements IPaymentGateway {
  private readonly stripe: Stripe;
  private readonly webhookSecret: string;
  private readonly logger = new Logger(StripePaymentGateway.name);

  constructor(private readonly configService: ConfigService) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }

    this.stripe = new Stripe(secretKey);

    this.webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET') ?? '';
  }

  constructWebhookEvent(payload: Buffer, signature: string): WebhookEvent {
    if (!this.webhookSecret) {
      throw DomainError.fromCode(ErrorCodes.STRIPE_WEBHOOK_INVALID);
    }

    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        this.webhookSecret,
      ) as unknown as WebhookEvent;

      return event;
    } catch (error) {
      this.logger.error('Webhook signature verification failed', error);
      throw DomainError.fromCode(ErrorCodes.STRIPE_WEBHOOK_INVALID);
    }
  }

  async getSubscription(subscriptionId: string): Promise<StripeSubscription> {
    try {
      const response = await this.stripe.subscriptions.retrieve(subscriptionId);
      const subscription = response as unknown as Stripe.Subscription;

      return {
        id: subscription.id,
        customerId:
          typeof subscription.customer === 'string'
            ? subscription.customer
            : subscription.customer.id,
        status: this.mapSubscriptionStatus(subscription.status),
        currentPeriodEnd: new Date((subscription as unknown as { current_period_end: number }).current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      };
    } catch (error) {
      this.logger.error(`Failed to retrieve subscription: ${subscriptionId}`, error);
      throw DomainError.fromCode(ErrorCodes.STRIPE_SUBSCRIPTION_NOT_FOUND);
    }
  }

  async getCustomer(customerId: string): Promise<StripeCustomer> {
    try {
      const customer = await this.stripe.customers.retrieve(customerId);

      if (customer.deleted) {
        throw DomainError.fromCode(ErrorCodes.STRIPE_CUSTOMER_NOT_FOUND);
      }

      return {
        id: customer.id,
        email: customer.email ?? '',
      };
    } catch (error) {
      this.logger.error(`Failed to retrieve customer: ${customerId}`, error);
      throw DomainError.fromCode(ErrorCodes.STRIPE_CUSTOMER_NOT_FOUND);
    }
  }

  async getCheckoutSession(sessionId: string): Promise<StripeCheckoutSession> {
    try {
      const session = await this.stripe.checkout.sessions.retrieve(sessionId);

      return {
        id: session.id,
        customerId:
          typeof session.customer === 'string' ? session.customer : (session.customer?.id ?? ''),
        customerEmail: session.customer_email ?? '',
        subscriptionId:
          typeof session.subscription === 'string'
            ? session.subscription
            : (session.subscription?.id ?? null),
      };
    } catch (error) {
      this.logger.error(`Failed to retrieve checkout session: ${sessionId}`, error);
      throw new Error('Checkout session not found');
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    try {
      await this.stripe.subscriptions.cancel(subscriptionId);
      this.logger.log(`Subscription cancelled: ${subscriptionId}`);
    } catch (error) {
      this.logger.error(`Failed to cancel subscription: ${subscriptionId}`, error);
      throw error;
    }
  }

  async createCheckoutSession(
    input: CreateCheckoutSessionInput,
  ): Promise<CreateCheckoutSessionOutput> {
    try {
      const session = await this.stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: input.priceId,
            quantity: 1,
          },
        ],
        customer_email: input.email,
        success_url: input.successUrl,
        cancel_url: input.cancelUrl,
        metadata: input.metadata,
      });

      if (!session.url) {
        throw new Error('Stripe session URL is null');
      }

      return {
        checkoutUrl: session.url,
        sessionId: session.id,
      };
    } catch (error) {
      this.logger.error('Failed to create checkout session', error);
      throw DomainError.fromCode(ErrorCodes.STRIPE_CHECKOUT_FAILED);
    }
  }

  private mapSubscriptionStatus(
    status: Stripe.Subscription.Status,
  ): StripeSubscription['status'] {
    const statusMap: Record<Stripe.Subscription.Status, StripeSubscription['status']> = {
      active: 'active',
      canceled: 'canceled',
      incomplete: 'incomplete',
      incomplete_expired: 'incomplete',
      past_due: 'past_due',
      trialing: 'trialing',
      unpaid: 'unpaid',
      paused: 'active', // Treat paused as active for now
    };

    return statusMap[status] ?? 'incomplete';
  }
}
