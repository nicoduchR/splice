import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  PAYMENT_GATEWAY,
  IPaymentGateway,
  CreateCheckoutSessionOutput,
} from '@domain/ports/payment.gateway.port';
import { CreateCheckoutSessionDto } from '../dto/create-checkout-session.dto';
import { DomainError, ErrorCodes } from '@shared/errors/error-codes';

/**
 * Use case for creating a Stripe Checkout session
 *
 * This use case orchestrates the creation of a Stripe Checkout session
 * for subscription upgrades from the desktop app.
 */
@Injectable()
export class CreateCheckoutSessionUseCase {
  private readonly allowedPriceIds: Set<string>;

  constructor(
    @Inject(PAYMENT_GATEWAY)
    private readonly paymentGateway: IPaymentGateway,
    private readonly configService: ConfigService,
  ) {
    // Load allowed price IDs from environment variables
    const monthlyPriceId = this.configService.get<string>('STRIPE_PRICE_ID_MONTHLY');
    const yearlyPriceId = this.configService.get<string>('STRIPE_PRICE_ID_YEARLY');

    this.allowedPriceIds = new Set(
      [monthlyPriceId, yearlyPriceId].filter((id): id is string => !!id),
    );
  }

  async execute(dto: CreateCheckoutSessionDto): Promise<CreateCheckoutSessionOutput> {
    // Security: Validate priceId against whitelist
    if (this.allowedPriceIds.size > 0 && !this.allowedPriceIds.has(dto.priceId)) {
      throw DomainError.fromCode(ErrorCodes.VALIDATION_ERROR);
    }

    const successUrl = 'splice://payment-success?session_id={CHECKOUT_SESSION_ID}';
    const cancelUrl = 'splice://payment-cancelled';

    return this.paymentGateway.createCheckoutSession({
      email: dto.email,
      priceId: dto.priceId,
      successUrl,
      cancelUrl,
      metadata: { source: 'desktop-app' },
    });
  }
}
