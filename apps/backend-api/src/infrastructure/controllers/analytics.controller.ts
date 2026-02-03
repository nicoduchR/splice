import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Logger } from '@nestjs/common';
import { ApiKeyGuard } from '@infrastructure/guards/api-key.guard';

interface AnalyticsEventDto {
  event: string;
  properties?: Record<string, unknown>;
  timestamp?: string;
}

interface AnalyticsResponse {
  success: boolean;
  message: string;
}

/**
 * Analytics Controller - Stub for Phase 2
 *
 * This controller is a placeholder for future analytics functionality.
 * It accepts events but does not process them yet.
 */
@Controller('analytics')
@UseGuards(ApiKeyGuard)
export class AnalyticsController {
  private readonly logger = new Logger(AnalyticsController.name);

  @Post('event')
  @HttpCode(HttpStatus.ACCEPTED)
  trackEvent(@Body() dto: AnalyticsEventDto): AnalyticsResponse {
    this.logger.debug(`[STUB] Analytics event received: ${dto.event}`);

    // Phase 2: Implement actual analytics tracking
    return {
      success: true,
      message: 'Event received (Phase 2 - not yet processed)',
    };
  }

  @Post('batch')
  @HttpCode(HttpStatus.ACCEPTED)
  trackBatch(@Body() events: AnalyticsEventDto[]): AnalyticsResponse {
    this.logger.debug(`[STUB] Analytics batch received: ${events.length} events`);

    // Phase 2: Implement actual analytics tracking
    return {
      success: true,
      message: `${events.length} events received (Phase 2 - not yet processed)`,
    };
  }
}
