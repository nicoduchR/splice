import { Module, forwardRef } from '@nestjs/common';
import { InfrastructureModule } from '@infrastructure/infrastructure.module';
import { VerifyLicenseUseCase } from './use-cases/verify-license.use-case';
import { ActivateLicenseUseCase } from './use-cases/activate-license.use-case';
import { HandleStripeWebhookUseCase } from './use-cases/handle-stripe-webhook.use-case';
import { LicenseKeyGeneratorService } from './services/license-key-generator.service';

/**
 * Application Module - Use case orchestration layer
 *
 * Contains:
 * - Use Cases: Application-specific business rules
 * - DTOs: Data Transfer Objects for input/output
 * - Application Services: Cross-cutting application concerns
 *
 * Rules:
 * - Depends on Domain layer (entities, value objects, ports)
 * - Orchestrates domain logic
 * - No direct infrastructure dependencies (uses ports)
 */
@Module({
  imports: [forwardRef(() => InfrastructureModule)],
  providers: [
    VerifyLicenseUseCase,
    ActivateLicenseUseCase,
    HandleStripeWebhookUseCase,
    LicenseKeyGeneratorService,
  ],
  exports: [
    VerifyLicenseUseCase,
    ActivateLicenseUseCase,
    HandleStripeWebhookUseCase,
    LicenseKeyGeneratorService,
  ],
})
export class ApplicationModule {}
