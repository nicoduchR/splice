import { Module } from '@nestjs/common';

/**
 * Domain Module - Core business logic layer
 *
 * Contains:
 * - Entities: Business objects with identity (License, User)
 * - Value Objects: Immutable objects without identity (LicenseKey, Email, Plan)
 * - Ports: Interface definitions for external dependencies (repositories, gateways)
 *
 * Rules:
 * - NO external dependencies (no imports from @nestjs/*, prisma, stripe, etc.)
 * - Pure TypeScript business logic
 * - Dependency direction: Domain depends on NOTHING
 */
@Module({
  providers: [],
  exports: [],
})
export class DomainModule {}
