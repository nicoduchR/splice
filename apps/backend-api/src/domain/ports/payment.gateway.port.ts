export const PAYMENT_GATEWAY = Symbol('PAYMENT_GATEWAY');

export interface StripeSubscription {
  id: string;
  customerId: string;
  status: 'active' | 'canceled' | 'incomplete' | 'past_due' | 'trialing' | 'unpaid';
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}

export interface StripeCustomer {
  id: string;
  email: string;
}

export interface StripeCheckoutSession {
  id: string;
  customerId: string;
  customerEmail: string;
  subscriptionId: string | null;
}

export interface WebhookEvent {
  id: string;
  type: string;
  data: {
    object: unknown;
  };
}

/**
 * Payment Gateway Port - Interface for payment provider integration
 *
 * This port defines the contract for interacting with payment providers (Stripe).
 * The actual implementation is provided by the infrastructure layer.
 */
export interface IPaymentGateway {
  /**
   * Verify and construct a webhook event from raw payload and signature
   * @throws Error if signature is invalid
   */
  constructWebhookEvent(payload: Buffer, signature: string): WebhookEvent;

  /**
   * Retrieve a subscription by ID
   */
  getSubscription(subscriptionId: string): Promise<StripeSubscription>;

  /**
   * Retrieve a customer by ID
   */
  getCustomer(customerId: string): Promise<StripeCustomer>;

  /**
   * Retrieve a checkout session by ID
   */
  getCheckoutSession(sessionId: string): Promise<StripeCheckoutSession>;

  /**
   * Cancel a subscription
   */
  cancelSubscription(subscriptionId: string): Promise<void>;
}
