import { License } from '../entities/license.entity';

export const LICENSE_REPOSITORY = Symbol('LICENSE_REPOSITORY');

/**
 * License Repository Port - Interface for license persistence
 *
 * This port defines the contract for license data access.
 * The actual implementation is provided by the infrastructure layer (Prisma).
 */
export interface ILicenseRepository {
  /**
   * Find a license by its unique key
   */
  findByKey(licenseKey: string): Promise<License | null>;

  /**
   * Find a license by its ID
   */
  findById(id: string): Promise<License | null>;

  /**
   * Find all licenses for a user
   */
  findByUserId(userId: string): Promise<License[]>;

  /**
   * Save a new license
   */
  save(license: License): Promise<License>;

  /**
   * Update an existing license
   */
  update(license: License): Promise<License>;

  /**
   * Delete a license by ID
   */
  delete(id: string): Promise<void>;
}
