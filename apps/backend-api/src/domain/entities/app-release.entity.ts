import { SemVer } from '../value-objects/semver.vo';

export type Platform = 'darwin-aarch64' | 'darwin-x86_64' | 'windows-x86_64' | 'linux-x86_64';

export interface PlatformReleaseProps {
  id: string;
  releaseId: string;
  platform: Platform;
  downloadUrl: string;
  signature: string;
  createdAt: Date;
}

/**
 * Platform Release Entity
 *
 * Represents a release artifact for a specific platform.
 * Contains the download URL and signature for verification.
 */
export class PlatformRelease {
  private constructor(private readonly props: PlatformReleaseProps) {}

  static create(props: PlatformReleaseProps): PlatformRelease {
    return new PlatformRelease(props);
  }

  get id(): string {
    return this.props.id;
  }

  get releaseId(): string {
    return this.props.releaseId;
  }

  get platform(): Platform {
    return this.props.platform;
  }

  get downloadUrl(): string {
    return this.props.downloadUrl;
  }

  get signature(): string {
    return this.props.signature;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  toPlainObject(): PlatformReleaseProps {
    return { ...this.props };
  }
}

export interface AppReleaseProps {
  id: string;
  version: SemVer;
  releaseDate: Date;
  releaseNotes: string | null;
  isMandatory: boolean;
  platformReleases: PlatformRelease[];
  createdAt: Date;
}

/**
 * App Release Entity - Domain object representing a software release
 *
 * Invariants:
 * - A release must have a valid semantic version
 * - A release must have at least one platform release
 * - Version must be unique across all releases
 */
export class AppRelease {
  private constructor(private readonly props: AppReleaseProps) {}

  static create(props: AppReleaseProps): AppRelease {
    return new AppRelease(props);
  }

  static createNew(params: {
    id: string;
    version: SemVer;
    releaseNotes?: string | null;
    isMandatory?: boolean;
    platformReleases?: PlatformRelease[];
  }): AppRelease {
    return new AppRelease({
      id: params.id,
      version: params.version,
      releaseDate: new Date(),
      releaseNotes: params.releaseNotes ?? null,
      isMandatory: params.isMandatory ?? false,
      platformReleases: params.platformReleases ?? [],
      createdAt: new Date(),
    });
  }

  get id(): string {
    return this.props.id;
  }

  get version(): SemVer {
    return this.props.version;
  }

  get releaseDate(): Date {
    return this.props.releaseDate;
  }

  get releaseNotes(): string | null {
    return this.props.releaseNotes;
  }

  get isMandatory(): boolean {
    return this.props.isMandatory;
  }

  get platformReleases(): PlatformRelease[] {
    return [...this.props.platformReleases];
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  /**
   * Check if this release is newer than the given version
   */
  isNewerThan(version: SemVer): boolean {
    return this.props.version.isGreaterThan(version);
  }

  /**
   * Get the platform release for a specific platform
   */
  getPlatformRelease(platform: Platform): PlatformRelease | null {
    return this.props.platformReleases.find((pr) => pr.platform === platform) ?? null;
  }

  /**
   * Check if this release supports a specific platform
   */
  supportsPlatform(platform: Platform): boolean {
    return this.getPlatformRelease(platform) !== null;
  }

  /**
   * Add a platform release
   */
  addPlatformRelease(platformRelease: PlatformRelease): AppRelease {
    if (this.getPlatformRelease(platformRelease.platform)) {
      throw new Error(`Platform release for ${platformRelease.platform} already exists`);
    }

    return new AppRelease({
      ...this.props,
      platformReleases: [...this.props.platformReleases, platformRelease],
    });
  }

  toPlainObject(): Omit<AppReleaseProps, 'version'> & { version: string } {
    return {
      id: this.props.id,
      version: this.props.version.toString(),
      releaseDate: this.props.releaseDate,
      releaseNotes: this.props.releaseNotes,
      isMandatory: this.props.isMandatory,
      platformReleases: this.props.platformReleases,
      createdAt: this.props.createdAt,
    };
  }
}
