import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Logger } from '@nestjs/common';
import { VerifyLicenseUseCase } from '@application/use-cases/verify-license.use-case';
import { ActivateLicenseUseCase } from '@application/use-cases/activate-license.use-case';
import { VerifyLicenseDto } from '@application/dto/verify-license.dto';
import { ActivateLicenseDto } from '@application/dto/activate-license.dto';
import { LicenseResponseDto, ApiResponse, LicenseResponseData } from '@application/dto/license-response.dto';
import { ApiKeyGuard } from '@infrastructure/guards/api-key.guard';

@Controller('license')
@UseGuards(ApiKeyGuard)
export class LicenseController {
  private readonly logger = new Logger(LicenseController.name);

  constructor(
    private readonly verifyLicenseUseCase: VerifyLicenseUseCase,
    private readonly activateLicenseUseCase: ActivateLicenseUseCase,
  ) {}

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  async verify(@Body() dto: VerifyLicenseDto): Promise<ApiResponse<LicenseResponseData>> {
    this.logger.log(`Verifying license: ${dto.licenseKey.substring(0, 10)}...`);

    const result = await this.verifyLicenseUseCase.execute(dto.licenseKey);

    if (!result.isValid || result.error) {
      return LicenseResponseDto.error(
        result.error?.code ?? 'LICENSE_INVALID',
        result.error?.message ?? 'License verification failed',
      );
    }

    return LicenseResponseDto.success(result.license!);
  }

  @Post('activate')
  @HttpCode(HttpStatus.OK)
  async activate(@Body() dto: ActivateLicenseDto): Promise<ApiResponse<LicenseResponseData>> {
    this.logger.log(`Activating license: ${dto.licenseKey.substring(0, 10)}... for ${dto.email}`);

    const result = await this.activateLicenseUseCase.execute(dto.licenseKey, dto.email);

    if (!result.success || result.error) {
      return LicenseResponseDto.error(
        result.error?.code ?? 'ACTIVATION_FAILED',
        result.error?.message ?? 'License activation failed',
      );
    }

    return LicenseResponseDto.success(result.license!);
  }
}
