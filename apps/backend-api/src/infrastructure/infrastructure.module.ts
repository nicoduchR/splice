import { Module, forwardRef } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ApplicationModule } from '@application/application.module';

// Prisma
import { PrismaService } from './adapters/prisma/prisma.service';
import { PrismaLicenseRepository } from './adapters/prisma/prisma-license.repository';
import { PrismaUserRepository } from './adapters/prisma/prisma-user.repository';

// Stripe
import { StripePaymentGateway } from './adapters/stripe/stripe-payment.gateway';

// Ports (DI Tokens)
import { LICENSE_REPOSITORY } from '@domain/ports/license.repository.port';
import { USER_REPOSITORY } from '@domain/ports/user.repository.port';
import { PAYMENT_GATEWAY } from '@domain/ports/payment.gateway.port';

// Controllers
import { LicenseController } from './controllers/license.controller';
import { StripeWebhookController } from './controllers/stripe-webhook.controller';
import { AnalyticsController } from './controllers/analytics.controller';
import { HealthController } from './controllers/health.controller';

// Guards
import { ApiKeyGuard } from './guards/api-key.guard';

/**
 * Infrastructure Module - External adapters and controllers
 *
 * Contains:
 * - Controllers: HTTP request handling
 * - Adapters: Implementations of domain ports (Prisma, Stripe)
 * - Guards: Authentication and authorization
 * - Filters: Exception handling
 * - Interceptors: Request/response transformation
 *
 * Rules:
 * - Depends on Application and Domain layers
 * - Implements domain ports with concrete adapters
 * - Wires dependency injection with Symbol tokens
 */
@Module({
  imports: [forwardRef(() => ApplicationModule)],
  providers: [
    // Prisma service
    PrismaService,

    // Repository implementations (ports -> adapters)
    {
      provide: LICENSE_REPOSITORY,
      useClass: PrismaLicenseRepository,
    },
    {
      provide: USER_REPOSITORY,
      useClass: PrismaUserRepository,
    },

    // Payment gateway implementation
    {
      provide: PAYMENT_GATEWAY,
      useClass: StripePaymentGateway,
    },

    // Global throttler guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },

    // API Key guard (applied via decorator)
    ApiKeyGuard,
  ],
  controllers: [LicenseController, StripeWebhookController, AnalyticsController, HealthController],
  exports: [LICENSE_REPOSITORY, USER_REPOSITORY, PAYMENT_GATEWAY, PrismaService],
})
export class InfrastructureModule {}
