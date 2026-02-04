import { AppRelease, Platform } from '../entities/app-release.entity';

export const RELEASE_REPOSITORY = Symbol('RELEASE_REPOSITORY');

/**
 * Release Repository Port - Interface for release persistence
 *
 * This port defines the contract for release data access.
 * The actual implementation is provided by the infrastructure layer (Prisma).
 */
export interface IReleaseRepository {
  /**
   * Find a release by its ID
   */
  findById(id: string): Promise<AppRelease | null>;

  /**
   * Find a release by its version string
   */
  findByVersion(version: string): Promise<AppRelease | null>;

  /**
   * Find the latest release that supports a specific platform
   */
  findLatestForPlatform(platform: Platform): Promise<AppRelease | null>;

  /**
   * Get all releases ordered by version (newest first)
   */
  findAll(): Promise<AppRelease[]>;

  /**
   * Save a new release
   */
  save(release: AppRelease): Promise<AppRelease>;

  /**
   * Update an existing release
   */
  update(release: AppRelease): Promise<AppRelease>;

  /**
   * Delete a release by ID
   */
  delete(id: string): Promise<void>;
}
