import { Injectable, Inject, Logger } from '@nestjs/common';
import { LICENSE_REPOSITORY, ILicenseRepository } from '@domain/ports/license.repository.port';
import { USER_REPOSITORY, IUserRepository } from '@domain/ports/user.repository.port';
import {
  PAYMENT_GATEWAY,
  IPaymentGateway,
  WebhookEvent,
} from '@domain/ports/payment.gateway.port';
import { License } from '@domain/entities/license.entity';
import { User } from '@domain/entities/user.entity';
import { LicenseKey } from '@domain/value-objects/license-key.vo';
import { Email } from '@domain/value-objects/email.vo';
import { Plan } from '@domain/value-objects/plan.vo';
import { v4 as uuidv4 } from 'uuid';

export interface WebhookResult {
  handled: boolean;
  eventType: string;
  message: string;
}

interface SubscriptionObject {
  id: string;
  customer: string;
  status: string;
  current_period_end: number;
  cancel_at_period_end: boolean;
}

interface CheckoutSessionObject {
  id: string;
  customer: string;
  customer_email: string;
  subscription: string | null;
}

@Injectable()
export class HandleStripeWebhookUseCase {
  private readonly logger = new Logger(HandleStripeWebhookUseCase.name);

  constructor(
    @Inject(LICENSE_REPOSITORY)
    private readonly licenseRepository: ILicenseRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(PAYMENT_GATEWAY)
    private readonly paymentGateway: IPaymentGateway,
  ) {}

  async execute(payload: Buffer, signature: string): Promise<WebhookResult> {
    // Verify and construct webhook event
    const event = this.paymentGateway.constructWebhookEvent(payload, signature);

    this.logger.log(`Processing webhook event: ${event.type}`);

    switch (event.type) {
      case 'customer.subscription.created':
        return this.handleSubscriptionCreated(event);

      case 'customer.subscription.updated':
        return this.handleSubscriptionUpdated(event);

      case 'customer.subscription.deleted':
        return this.handleSubscriptionDeleted(event);

      case 'checkout.session.completed':
        return this.handleCheckoutSessionCompleted(event);

      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
        return {
          handled: false,
          eventType: event.type,
          message: `Event type ${event.type} is not handled`,
        };
    }
  }

  private async handleSubscriptionCreated(event: WebhookEvent): Promise<WebhookResult> {
    const subscription = event.data.object as SubscriptionObject;
    const customerId = subscription.customer;

    // Find user by Stripe customer ID
    const user = await this.userRepository.findByStripeCustomerId(customerId);
    if (!user) {
      this.logger.warn(`User not found for Stripe customer: ${customerId}`);
      return {
        handled: false,
        eventType: event.type,
        message: `User not found for customer ${customerId}`,
      };
    }

    // Create new license for subscription
    const license = License.createNew({
      id: uuidv4(),
      userId: user.id,
      licenseKey: LicenseKey.generate(),
      plan: Plan.pro(),
      expiresAt: new Date(subscription.current_period_end * 1000),
    });

    await this.licenseRepository.save(license);

    this.logger.log(`Created license for user ${user.id}: ${license.licenseKey.getValue()}`);

    return {
      handled: true,
      eventType: event.type,
      message: `License created for subscription ${subscription.id}`,
    };
  }

  private async handleSubscriptionUpdated(event: WebhookEvent): Promise<WebhookResult> {
    const subscription = event.data.object as SubscriptionObject;
    const customerId = subscription.customer;

    const user = await this.userRepository.findByStripeCustomerId(customerId);
    if (!user) {
      return {
        handled: false,
        eventType: event.type,
        message: `User not found for customer ${customerId}`,
      };
    }

    // Find user's license
    const licenses = await this.licenseRepository.findByUserId(user.id);
    const activeLicense = licenses.find((l) => l.plan.isPro() && l.isValid());

    if (!activeLicense) {
      return {
        handled: false,
        eventType: event.type,
        message: 'No active pro license found',
      };
    }

    // Update expiry date
    const updatedLicense = activeLicense.extendExpiry(
      new Date(subscription.current_period_end * 1000),
    );
    await this.licenseRepository.update(updatedLicense);

    return {
      handled: true,
      eventType: event.type,
      message: `License updated for subscription ${subscription.id}`,
    };
  }

  private async handleSubscriptionDeleted(event: WebhookEvent): Promise<WebhookResult> {
    const subscription = event.data.object as SubscriptionObject;
    const customerId = subscription.customer;

    const user = await this.userRepository.findByStripeCustomerId(customerId);
    if (!user) {
      return {
        handled: false,
        eventType: event.type,
        message: `User not found for customer ${customerId}`,
      };
    }

    // Find and expire user's license
    const licenses = await this.licenseRepository.findByUserId(user.id);
    const activeLicense = licenses.find((l) => l.plan.isPro() && l.isValid());

    if (!activeLicense) {
      return {
        handled: false,
        eventType: event.type,
        message: 'No active pro license found to expire',
      };
    }

    const expiredLicense = activeLicense.expire();
    await this.licenseRepository.update(expiredLicense);

    this.logger.log(`License expired for user ${user.id}`);

    return {
      handled: true,
      eventType: event.type,
      message: `License expired for subscription ${subscription.id}`,
    };
  }

  private async handleCheckoutSessionCompleted(event: WebhookEvent): Promise<WebhookResult> {
    const session = event.data.object as CheckoutSessionObject;

    // Find or create user
    let user = await this.userRepository.findByEmail(session.customer_email);

    if (!user) {
      // Create new user
      user = User.createNew({
        id: uuidv4(),
        email: Email.create(session.customer_email),
        stripeCustomerId: session.customer,
      });
      await this.userRepository.save(user);
      this.logger.log(`Created new user for checkout: ${session.customer_email}`);
    } else if (!user.hasStripeCustomer()) {
      // Link Stripe customer to existing user
      user = user.linkStripeCustomer(session.customer);
      await this.userRepository.update(user);
      this.logger.log(`Linked Stripe customer to user: ${user.id}`);
    }

    return {
      handled: true,
      eventType: event.type,
      message: `Checkout session completed for ${session.customer_email}`,
    };
  }
}
