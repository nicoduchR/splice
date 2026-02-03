import { Injectable, Inject } from '@nestjs/common';
import {
  LICENSE_REPOSITORY,
  ILicenseRepository,
} from '@domain/ports/license.repository.port';
import {
  USER_REPOSITORY,
  IUserRepository,
} from '@domain/ports/user.repository.port';
import { RedeemEarlyAdopterCodeResult } from '../dto/redeem-early-adopter-code.dto';
import { ErrorCodes, createError } from '@shared/errors/error-codes';
import { Email } from '@domain/value-objects/email.vo';
import { User } from '@domain/entities/user.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RedeemEarlyAdopterCodeUseCase {
  constructor(
    @Inject(LICENSE_REPOSITORY)
    private readonly licenseRepository: ILicenseRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(
    code: string,
    email: string,
  ): Promise<RedeemEarlyAdopterCodeResult> {
    // 1. Find license by code (licenseKey)
    const license = await this.licenseRepository.findByKey(code);

    if (!license) {
      const error = createError(ErrorCodes.EARLY_ADOPTER_CODE_INVALID);
      return {
        success: false,
        error: { code: error.code, message: error.message },
      };
    }

    // 2. Check not already activated (activatedAt === null)
    if (license.isActivated()) {
      const error = createError(ErrorCodes.EARLY_ADOPTER_CODE_ALREADY_USED);
      return {
        success: false,
        error: { code: error.code, message: error.message },
      };
    }

    // 3. Check status is active
    if (!license.isValid()) {
      const error = createError(ErrorCodes.EARLY_ADOPTER_CODE_EXPIRED);
      return {
        success: false,
        error: { code: error.code, message: error.message },
      };
    }

    // 4. Find or create user by email
    const emailVO = Email.create(email);
    let user = await this.userRepository.findByEmail(emailVO.getValue());

    if (!user) {
      user = User.createNew({
        id: uuidv4(),
        email: emailVO,
      });
      await this.userRepository.save(user);
    }

    // 5. Link license to user and activate (sets activatedAt to now)
    const linkedLicense = license.linkToUser(user.id);
    const activatedLicense = linkedLicense.activate();
    await this.licenseRepository.update(activatedLicense);

    // 6. Return success with license data
    return {
      success: true,
      data: {
        licenseKey: activatedLicense.licenseKey.getValue(),
        plan: 'pro',
        expiresAt: null, // Lifetime access
      },
    };
  }
}
