import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { LicenseController } from './license.controller';
import { VerifyLicenseUseCase } from '@application/use-cases/verify-license.use-case';
import { ActivateLicenseUseCase } from '@application/use-cases/activate-license.use-case';
import { RedeemEarlyAdopterCodeUseCase } from '@application/use-cases/redeem-early-adopter-code.use-case';
import { ErrorCodes } from '@shared/errors/error-codes';
import { ApiKeyGuard } from '@infrastructure/guards/api-key.guard';

describe('LicenseController', () => {
  let controller: LicenseController;
  let mockVerifyLicenseUseCase: jest.Mocked<VerifyLicenseUseCase>;
  let mockActivateLicenseUseCase: jest.Mocked<ActivateLicenseUseCase>;
  let mockRedeemEarlyAdopterCodeUseCase: jest.Mocked<RedeemEarlyAdopterCodeUseCase>;

  beforeEach(async () => {
    // Silence logger
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});

    mockVerifyLicenseUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<VerifyLicenseUseCase>;

    mockActivateLicenseUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<ActivateLicenseUseCase>;

    mockRedeemEarlyAdopterCodeUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<RedeemEarlyAdopterCodeUseCase>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LicenseController],
      providers: [
        { provide: VerifyLicenseUseCase, useValue: mockVerifyLicenseUseCase },
        { provide: ActivateLicenseUseCase, useValue: mockActivateLicenseUseCase },
        { provide: RedeemEarlyAdopterCodeUseCase, useValue: mockRedeemEarlyAdopterCodeUseCase },
      ],
    })
      .overrideGuard(ApiKeyGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<LicenseController>(LicenseController);
  });

  describe('redeem', () => {
    const validDto = {
      code: 'SPLICE-EA01-2026-BETA',
      email: 'early.adopter@example.com',
    };

    it('should return success response with license data on valid redemption', async () => {
      mockRedeemEarlyAdopterCodeUseCase.execute.mockResolvedValue({
        success: true,
        data: {
          licenseKey: 'SPLICE-EA01-2026-BETA',
          plan: 'pro',
          expiresAt: null,
        },
      });

      const result = await controller.redeem(validDto);

      expect(result).toEqual({
        success: true,
        data: {
          licenseKey: 'SPLICE-EA01-2026-BETA',
          plan: 'pro',
          expiresAt: null,
        },
      });
    });

    it('should call use case with correct parameters', async () => {
      mockRedeemEarlyAdopterCodeUseCase.execute.mockResolvedValue({
        success: true,
        data: {
          licenseKey: 'SPLICE-EA01-2026-BETA',
          plan: 'pro',
          expiresAt: null,
        },
      });

      await controller.redeem(validDto);

      expect(mockRedeemEarlyAdopterCodeUseCase.execute).toHaveBeenCalledWith(
        validDto.code,
        validDto.email,
      );
    });

    it('should return error response when code not found', async () => {
      mockRedeemEarlyAdopterCodeUseCase.execute.mockResolvedValue({
        success: false,
        error: {
          code: ErrorCodes.EARLY_ADOPTER_CODE_INVALID,
          message: 'Le code early adopter n\'existe pas',
        },
      });

      const result = await controller.redeem(validDto);

      expect(result).toEqual({
        success: false,
        error: {
          code: ErrorCodes.EARLY_ADOPTER_CODE_INVALID,
          message: 'Le code early adopter n\'existe pas',
        },
      });
    });

    it('should return error response when code already used', async () => {
      mockRedeemEarlyAdopterCodeUseCase.execute.mockResolvedValue({
        success: false,
        error: {
          code: ErrorCodes.EARLY_ADOPTER_CODE_ALREADY_USED,
          message: 'Ce code a déjà été utilisé',
        },
      });

      const result = await controller.redeem(validDto);

      expect(result).toEqual({
        success: false,
        error: {
          code: ErrorCodes.EARLY_ADOPTER_CODE_ALREADY_USED,
          message: 'Ce code a déjà été utilisé',
        },
      });
    });

    it('should return error response when code expired', async () => {
      mockRedeemEarlyAdopterCodeUseCase.execute.mockResolvedValue({
        success: false,
        error: {
          code: ErrorCodes.EARLY_ADOPTER_CODE_EXPIRED,
          message: 'Ce code n\'est plus valide',
        },
      });

      const result = await controller.redeem(validDto);

      expect(result).toEqual({
        success: false,
        error: {
          code: ErrorCodes.EARLY_ADOPTER_CODE_EXPIRED,
          message: 'Ce code n\'est plus valide',
        },
      });
    });
  });
});
