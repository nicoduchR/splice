import { Email } from '../value-objects/email.vo';

export interface UserProps {
  id: string;
  email: Email;
  stripeCustomerId: string | null;
  createdAt: Date;
}

/**
 * User Entity - Domain object representing a user in the license system
 *
 * Invariants:
 * - A user must have a valid email address
 * - A user can have at most one Stripe customer ID
 */
export class User {
  private constructor(private readonly props: UserProps) {}

  static create(props: UserProps): User {
    return new User(props);
  }

  static createNew(params: { id: string; email: Email; stripeCustomerId?: string | null }): User {
    return new User({
      id: params.id,
      email: params.email,
      stripeCustomerId: params.stripeCustomerId ?? null,
      createdAt: new Date(),
    });
  }

  get id(): string {
    return this.props.id;
  }

  get email(): Email {
    return this.props.email;
  }

  get stripeCustomerId(): string | null {
    return this.props.stripeCustomerId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  hasStripeCustomer(): boolean {
    return this.props.stripeCustomerId !== null;
  }

  linkStripeCustomer(stripeCustomerId: string): User {
    if (this.hasStripeCustomer()) {
      throw new Error('User already has a Stripe customer linked');
    }

    return new User({
      ...this.props,
      stripeCustomerId,
    });
  }

  toPlainObject(): UserProps {
    return { ...this.props };
  }
}
