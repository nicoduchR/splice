import { LicenseKey } from '../value-objects/license-key.vo';
import { Plan } from '../value-objects/plan.vo';

export type LicenseStatus = 'active' | 'expired' | 'revoked';

export interface LicenseProps {
  id: string;
  userId: string;
  licenseKey: LicenseKey;
  plan: Plan;
  status: LicenseStatus;
  activatedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
}

/**
 * License Entity - Domain object representing a software license
 *
 * Invariants:
 * - A license must have a valid license key format
 * - A license must be associated with a user
 * - An active license cannot be activated again
 * - An expired/revoked license cannot be used
 */
export class License {
  private constructor(private readonly props: LicenseProps) {}

  static create(props: LicenseProps): License {
    return new License(props);
  }

  static createNew(params: {
    id: string;
    userId: string;
    licenseKey: LicenseKey;
    plan: Plan;
    expiresAt?: Date | null;
  }): License {
    return new License({
      id: params.id,
      userId: params.userId,
      licenseKey: params.licenseKey,
      plan: params.plan,
      status: 'active',
      activatedAt: null,
      expiresAt: params.expiresAt ?? null,
      createdAt: new Date(),
    });
  }

  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get licenseKey(): LicenseKey {
    return this.props.licenseKey;
  }

  get plan(): Plan {
    return this.props.plan;
  }

  get status(): LicenseStatus {
    return this.props.status;
  }

  get activatedAt(): Date | null {
    return this.props.activatedAt;
  }

  get expiresAt(): Date | null {
    return this.props.expiresAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  isValid(): boolean {
    if (this.props.status !== 'active') {
      return false;
    }

    if (this.props.expiresAt && this.props.expiresAt < new Date()) {
      return false;
    }

    return true;
  }

  isExpired(): boolean {
    if (this.props.status === 'expired') {
      return true;
    }

    if (this.props.expiresAt && this.props.expiresAt < new Date()) {
      return true;
    }

    return false;
  }

  isActivated(): boolean {
    return this.props.activatedAt !== null;
  }

  activate(): License {
    if (this.isActivated()) {
      throw new Error('License is already activated');
    }

    if (!this.isValid()) {
      throw new Error('Cannot activate an invalid license');
    }

    return new License({
      ...this.props,
      activatedAt: new Date(),
    });
  }

  expire(): License {
    return new License({
      ...this.props,
      status: 'expired',
    });
  }

  revoke(): License {
    return new License({
      ...this.props,
      status: 'revoked',
    });
  }

  updatePlan(plan: Plan): License {
    return new License({
      ...this.props,
      plan,
    });
  }

  extendExpiry(newExpiresAt: Date): License {
    return new License({
      ...this.props,
      expiresAt: newExpiresAt,
      status: 'active', // Reactivate if was expired
    });
  }

  /**
   * Link license to a user (used when redeeming early adopter codes)
   * Updates the userId from placeholder to actual user
   */
  linkToUser(userId: string): License {
    return new License({
      ...this.props,
      userId,
    });
  }

  toPlainObject(): LicenseProps {
    return { ...this.props };
  }
}
