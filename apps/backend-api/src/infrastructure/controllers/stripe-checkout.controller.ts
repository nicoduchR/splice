import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Logger } from '@nestjs/common';
import { CreateCheckoutSessionUseCase } from '@application/use-cases/create-checkout-session.use-case';
import {
  CreateCheckoutSessionDto,
  CreateCheckoutSessionResult,
} from '@application/dto/create-checkout-session.dto';
import { LicenseResponseDto, ApiResponse } from '@application/dto/license-response.dto';
import { ApiKeyGuard } from '@infrastructure/guards/api-key.guard';
import { DomainError, ErrorCodes } from '@shared/errors/error-codes';

@Controller('api/v1/stripe')
@UseGuards(ApiKeyGuard)
export class StripeCheckoutController {
  private readonly logger = new Logger(StripeCheckoutController.name);

  constructor(
    private readonly createCheckoutSessionUseCase: CreateCheckoutSessionUseCase,
  ) {}

  @Post('checkout')
  @HttpCode(HttpStatus.OK)
  async createCheckout(
    @Body() dto: CreateCheckoutSessionDto,
  ): Promise<ApiResponse<CreateCheckoutSessionResult>> {
    this.logger.log(`Creating checkout session for email: ${dto.email}`);

    try {
      const result = await this.createCheckoutSessionUseCase.execute(dto);
      return LicenseResponseDto.success(result);
    } catch (error) {
      this.logger.error('Failed to create checkout session', error);

      if (error instanceof DomainError) {
        return LicenseResponseDto.error(error.code, error.message);
      }

      return LicenseResponseDto.error(
        ErrorCodes.INTERNAL_ERROR,
        'Failed to create checkout session',
      );
    }
  }
}
