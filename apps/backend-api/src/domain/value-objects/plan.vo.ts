/**
 * Plan Value Object
 *
 * Represents the subscription plan type.
 * - 'free': Basic plan with limitations
 * - 'pro': Full-featured paid plan
 */
export type PlanType = 'free' | 'pro';

export class Plan {
  private static readonly VALID_PLANS: readonly PlanType[] = ['free', 'pro'] as const;

  private constructor(private readonly value: PlanType) {}

  static create(value: string): Plan {
    const normalized = value.toLowerCase().trim() as PlanType;

    if (!Plan.isValid(normalized)) {
      throw new Error(`Invalid plan type: "${value}". Valid plans: ${Plan.VALID_PLANS.join(', ')}`);
    }

    return new Plan(normalized);
  }

  static free(): Plan {
    return new Plan('free');
  }

  static pro(): Plan {
    return new Plan('pro');
  }

  static isValid(value: string): value is PlanType {
    return Plan.VALID_PLANS.includes(value as PlanType);
  }

  getValue(): PlanType {
    return this.value;
  }

  toString(): string {
    return this.value;
  }

  equals(other: Plan): boolean {
    return this.value === other.value;
  }

  isFree(): boolean {
    return this.value === 'free';
  }

  isPro(): boolean {
    return this.value === 'pro';
  }
}
