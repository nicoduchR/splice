import { Injectable, Inject } from '@nestjs/common';
import { LICENSE_REPOSITORY, ILicenseRepository } from '@domain/ports/license.repository.port';
import { LicenseResponseDto, LicenseResponseData } from '../dto/license-response.dto';
import { ErrorCodes, createError, DomainError } from '@shared/errors/error-codes';

export interface VerifyLicenseResult {
  isValid: boolean;
  license: LicenseResponseData | null;
  error?: { code: string; message: string };
}

@Injectable()
export class VerifyLicenseUseCase {
  constructor(
    @Inject(LICENSE_REPOSITORY)
    private readonly licenseRepository: ILicenseRepository,
  ) {}

  async execute(licenseKey: string): Promise<VerifyLicenseResult> {
    // Find the license
    const license = await this.licenseRepository.findByKey(licenseKey);

    if (!license) {
      const error = createError(ErrorCodes.LICENSE_NOT_FOUND);
      return {
        isValid: false,
        license: null,
        error: { code: error.code, message: error.message },
      };
    }

    // Check if license is expired
    if (license.isExpired()) {
      const error = createError(ErrorCodes.LICENSE_EXPIRED);
      return {
        isValid: false,
        license: LicenseResponseDto.fromEntity(license),
        error: { code: error.code, message: error.message },
      };
    }

    // Check if license is valid (active and not expired)
    if (!license.isValid()) {
      const error = createError(ErrorCodes.LICENSE_INVALID);
      return {
        isValid: false,
        license: LicenseResponseDto.fromEntity(license),
        error: { code: error.code, message: error.message },
      };
    }

    return {
      isValid: true,
      license: LicenseResponseDto.fromEntity(license),
    };
  }
}

export { DomainError };
