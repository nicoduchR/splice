import { User } from '../entities/user.entity';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

/**
 * User Repository Port - Interface for user persistence
 *
 * This port defines the contract for user data access.
 * The actual implementation is provided by the infrastructure layer (Prisma).
 */
export interface IUserRepository {
  /**
   * Find a user by their unique ID
   */
  findById(id: string): Promise<User | null>;

  /**
   * Find a user by their email address
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Find a user by their Stripe customer ID
   */
  findByStripeCustomerId(stripeCustomerId: string): Promise<User | null>;

  /**
   * Save a new user
   */
  save(user: User): Promise<User>;

  /**
   * Update an existing user
   */
  update(user: User): Promise<User>;

  /**
   * Delete a user by ID
   */
  delete(id: string): Promise<void>;
}
