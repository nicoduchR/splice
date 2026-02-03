import { Injectable, Inject } from '@nestjs/common';
import { LICENSE_REPOSITORY, ILicenseRepository } from '@domain/ports/license.repository.port';
import { USER_REPOSITORY, IUserRepository } from '@domain/ports/user.repository.port';
import { LicenseResponseDto, LicenseResponseData } from '../dto/license-response.dto';
import { ErrorCodes, createError, DomainError } from '@shared/errors/error-codes';
import { Email } from '@domain/value-objects/email.vo';
import { User } from '@domain/entities/user.entity';
import { v4 as uuidv4 } from 'uuid';

export interface ActivateLicenseResult {
  success: boolean;
  license: LicenseResponseData | null;
  error?: { code: string; message: string };
}

@Injectable()
export class ActivateLicenseUseCase {
  constructor(
    @Inject(LICENSE_REPOSITORY)
    private readonly licenseRepository: ILicenseRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(licenseKey: string, email: string): Promise<ActivateLicenseResult> {
    // Find the license
    const license = await this.licenseRepository.findByKey(licenseKey);

    if (!license) {
      const error = createError(ErrorCodes.LICENSE_NOT_FOUND);
      return {
        success: false,
        license: null,
        error: { code: error.code, message: error.message },
      };
    }

    // Check if already activated
    if (license.isActivated()) {
      const error = createError(ErrorCodes.LICENSE_ALREADY_ACTIVATED);
      return {
        success: false,
        license: LicenseResponseDto.fromEntity(license),
        error: { code: error.code, message: error.message },
      };
    }

    // Check if license is valid for activation
    if (!license.isValid()) {
      const error = createError(ErrorCodes.LICENSE_INVALID);
      return {
        success: false,
        license: LicenseResponseDto.fromEntity(license),
        error: { code: error.code, message: error.message },
      };
    }

    // Validate email and find or create user
    const emailVO = Email.create(email);
    let user = await this.userRepository.findByEmail(emailVO.getValue());

    if (!user) {
      // Create new user
      user = User.createNew({
        id: uuidv4(),
        email: emailVO,
      });
      await this.userRepository.save(user);
    }

    // Activate the license
    const activatedLicense = license.activate();
    const updatedLicense = await this.licenseRepository.update(activatedLicense);

    return {
      success: true,
      license: LicenseResponseDto.fromEntity(updatedLicense),
    };
  }
}

export { DomainError };
