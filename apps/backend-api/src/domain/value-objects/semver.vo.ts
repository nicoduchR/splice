/**
 * SemVer Value Object
 *
 * Represents a semantic version (e.g., "1.2.3")
 * Provides comparison methods for version checking.
 */
export class SemVer {
  private static readonly SEMVER_REGEX = /^(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9.-]+))?(?:\+([a-zA-Z0-9.-]+))?$/;

  private constructor(
    private readonly major: number,
    private readonly minor: number,
    private readonly patch: number,
    private readonly prerelease: string | null = null,
    private readonly buildMetadata: string | null = null,
  ) {}

  static parse(version: string): SemVer {
    const trimmed = version.trim();
    const match = trimmed.match(SemVer.SEMVER_REGEX);

    if (!match) {
      throw new Error(`Invalid semantic version: "${version}". Expected format: X.Y.Z[-prerelease][+build]`);
    }

    return new SemVer(
      parseInt(match[1], 10),
      parseInt(match[2], 10),
      parseInt(match[3], 10),
      match[4] ?? null,
      match[5] ?? null,
    );
  }

  static isValid(version: string): boolean {
    return SemVer.SEMVER_REGEX.test(version.trim());
  }

  getMajor(): number {
    return this.major;
  }

  getMinor(): number {
    return this.minor;
  }

  getPatch(): number {
    return this.patch;
  }

  getPrerelease(): string | null {
    return this.prerelease;
  }

  getBuildMetadata(): string | null {
    return this.buildMetadata;
  }

  toString(): string {
    let version = `${this.major}.${this.minor}.${this.patch}`;
    if (this.prerelease) {
      version += `-${this.prerelease}`;
    }
    if (this.buildMetadata) {
      version += `+${this.buildMetadata}`;
    }
    return version;
  }

  /**
   * Compare this version with another.
   * Returns:
   *  -1 if this < other
   *   0 if this == other
   *   1 if this > other
   */
  compare(other: SemVer): -1 | 0 | 1 {
    // Compare major
    if (this.major !== other.major) {
      return this.major > other.major ? 1 : -1;
    }

    // Compare minor
    if (this.minor !== other.minor) {
      return this.minor > other.minor ? 1 : -1;
    }

    // Compare patch
    if (this.patch !== other.patch) {
      return this.patch > other.patch ? 1 : -1;
    }

    // Handle prerelease comparison
    // A version without prerelease has higher precedence than one with prerelease
    if (this.prerelease === null && other.prerelease !== null) {
      return 1;
    }
    if (this.prerelease !== null && other.prerelease === null) {
      return -1;
    }
    if (this.prerelease !== null && other.prerelease !== null) {
      return this.comparePrerelease(other.prerelease);
    }

    return 0;
  }

  private comparePrerelease(otherPrerelease: string): -1 | 0 | 1 {
    const thisParts = this.prerelease!.split('.');
    const otherParts = otherPrerelease.split('.');

    const minLength = Math.min(thisParts.length, otherParts.length);

    for (let i = 0; i < minLength; i++) {
      const thisPart = thisParts[i];
      const otherPart = otherParts[i];

      const thisIsNumeric = /^\d+$/.test(thisPart);
      const otherIsNumeric = /^\d+$/.test(otherPart);

      if (thisIsNumeric && otherIsNumeric) {
        const thisNum = parseInt(thisPart, 10);
        const otherNum = parseInt(otherPart, 10);
        if (thisNum !== otherNum) {
          return thisNum > otherNum ? 1 : -1;
        }
      } else if (thisIsNumeric) {
        // Numeric has lower precedence than alphanumeric
        return -1;
      } else if (otherIsNumeric) {
        return 1;
      } else {
        // Both alphanumeric - compare lexically
        if (thisPart !== otherPart) {
          return thisPart > otherPart ? 1 : -1;
        }
      }
    }

    // If all parts are equal, the one with more parts has higher precedence
    if (thisParts.length !== otherParts.length) {
      return thisParts.length > otherParts.length ? 1 : -1;
    }

    return 0;
  }

  isGreaterThan(other: SemVer): boolean {
    return this.compare(other) === 1;
  }

  isLessThan(other: SemVer): boolean {
    return this.compare(other) === -1;
  }

  isEqualTo(other: SemVer): boolean {
    return this.compare(other) === 0;
  }

  isGreaterThanOrEqualTo(other: SemVer): boolean {
    return this.compare(other) >= 0;
  }

  isLessThanOrEqualTo(other: SemVer): boolean {
    return this.compare(other) <= 0;
  }

  equals(other: SemVer): boolean {
    return this.isEqualTo(other);
  }
}
