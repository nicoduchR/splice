/**
 * Email Value Object
 *
 * Immutable value object that validates email format on creation.
 * Uses a pragmatic regex that handles most common email formats.
 */
export class Email {
  // RFC 5322 compliant (simplified)
  private static readonly EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  private constructor(private readonly value: string) {}

  static create(value: string): Email {
    const normalized = value.toLowerCase().trim();

    if (!Email.isValid(normalized)) {
      throw new Error(`Invalid email format: "${value}"`);
    }

    return new Email(normalized);
  }

  static isValid(value: string): boolean {
    if (!value || value.length > 254) {
      return false;
    }
    return Email.EMAIL_REGEX.test(value);
  }

  getValue(): string {
    return this.value;
  }

  toString(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }

  getDomain(): string {
    return this.value.split('@')[1];
  }
}
