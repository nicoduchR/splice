import {
  Controller,
  Post,
  Headers,
  Req,
  HttpCode,
  HttpStatus,
  Logger,
  RawBodyRequest,
} from '@nestjs/common';
import { Request } from 'express';
import { HandleStripeWebhookUseCase, WebhookResult } from '@application/use-cases/handle-stripe-webhook.use-case';
import { LicenseResponseDto, ApiResponse } from '@application/dto/license-response.dto';
import { DomainError, ErrorCodes } from '@shared/errors/error-codes';

@Controller('stripe')
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);

  constructor(private readonly handleStripeWebhookUseCase: HandleStripeWebhookUseCase) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() request: RawBodyRequest<Request>,
  ): Promise<ApiResponse<WebhookResult>> {
    this.logger.log('Received Stripe webhook');

    if (!signature) {
      this.logger.warn('Missing stripe-signature header');
      return LicenseResponseDto.error(
        ErrorCodes.STRIPE_WEBHOOK_INVALID,
        'Missing stripe-signature header',
      );
    }

    const rawBody = request.rawBody;
    if (!rawBody) {
      this.logger.warn('Missing raw body');
      return LicenseResponseDto.error(
        ErrorCodes.STRIPE_WEBHOOK_INVALID,
        'Missing request body',
      );
    }

    try {
      const result = await this.handleStripeWebhookUseCase.execute(rawBody, signature);

      this.logger.log(`Webhook processed: ${result.eventType} - handled: ${result.handled}`);

      return LicenseResponseDto.success(result);
    } catch (error) {
      if (error instanceof DomainError) {
        this.logger.warn(`Webhook error: ${error.code}`);
        return LicenseResponseDto.error(error.code, error.message);
      }

      this.logger.error('Unexpected webhook error', error);
      return LicenseResponseDto.error(
        ErrorCodes.INTERNAL_ERROR,
        'Failed to process webhook',
      );
    }
  }
}
