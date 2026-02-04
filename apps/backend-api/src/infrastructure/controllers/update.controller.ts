import { Controller, Get, Query, HttpCode, HttpStatus, Logger, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { GetLatestReleaseUseCase } from '@application/use-cases/get-latest-release.use-case';
import { CheckUpdateDto } from '@application/dto/check-update.dto';
import { UpdateResponseDto, TauriUpdateManifest } from '@application/dto/update-response.dto';

@Controller('updates')
export class UpdateController {
  private readonly logger = new Logger(UpdateController.name);

  constructor(private readonly getLatestReleaseUseCase: GetLatestReleaseUseCase) {}

  /**
   * Check for updates endpoint
   *
   * Compatible with tauri-plugin-updater format.
   * Returns:
   * - 200 with update manifest if update available
   * - 204 No Content if no update available
   * - 400 for validation errors
   *
   * Rate limited to 10 requests per minute per IP
   */
  @Get('latest')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async checkForUpdate(
    @Query() dto: CheckUpdateDto,
    @Res() res: Response,
  ): Promise<Response<TauriUpdateManifest | void>> {
    this.logger.debug(`Checking for updates: platform=${dto.platform}, version=${dto.version}`);

    const result = await this.getLatestReleaseUseCase.execute(dto.platform, dto.version);

    if (result.error) {
      this.logger.warn(`Update check error: ${result.error.code} - ${result.error.message}`);
      return res.status(HttpStatus.BAD_REQUEST).json(UpdateResponseDto.error(result.error.code, result.error.message));
    }

    if (!result.hasUpdate || !result.update) {
      this.logger.debug(`No update available for ${dto.platform} from version ${dto.version}`);
      return res.status(HttpStatus.NO_CONTENT).send();
    }

    this.logger.log(`Update available: ${dto.version} -> ${result.update.version} for ${dto.platform}`);

    // Return tauri-plugin-updater compatible format
    const manifest: TauriUpdateManifest = {
      version: result.update.version,
      notes: result.update.notes,
      pub_date: result.update.pub_date,
      url: result.update.url,
      signature: result.update.signature,
    };

    return res.status(HttpStatus.OK).json(manifest);
  }
}
