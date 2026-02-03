/**
 * LicenseKey Value Object
 *
 * Format: SPLICE-XXXX-XXXX-XXXX where X = [A-Z0-9]
 * Example: SPLICE-A1B2-C3D4-E5F6
 *
 * Immutable value object that validates license key format on creation.
 */
export class LicenseKey {
  private static readonly FORMAT_REGEX = /^SPLICE-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

  private constructor(private readonly value: string) {}

  static create(value: string): LicenseKey {
    const normalized = value.toUpperCase().trim();

    if (!LicenseKey.isValid(normalized)) {
      throw new Error(
        `Invalid license key format: "${value}". Expected format: SPLICE-XXXX-XXXX-XXXX`,
      );
    }

    return new LicenseKey(normalized);
  }

  static isValid(value: string): boolean {
    return LicenseKey.FORMAT_REGEX.test(value);
  }

  static generate(): LicenseKey {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const segment = (): string =>
      Array.from({ length: 4 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join(
        '',
      );

    const key = `SPLICE-${segment()}-${segment()}-${segment()}`;
    return new LicenseKey(key);
  }

  getValue(): string {
    return this.value;
  }

  toString(): string {
    return this.value;
  }

  equals(other: LicenseKey): boolean {
    return this.value === other.value;
  }
}
