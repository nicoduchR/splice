import { RedeemEarlyAdopterCodeUseCase } from './redeem-early-adopter-code.use-case';
import { ILicenseRepository } from '@domain/ports/license.repository.port';
import { IUserRepository } from '@domain/ports/user.repository.port';
import { License } from '@domain/entities/license.entity';
import { User } from '@domain/entities/user.entity';
import { LicenseKey } from '@domain/value-objects/license-key.vo';
import { Email } from '@domain/value-objects/email.vo';
import { Plan } from '@domain/value-objects/plan.vo';
import { ErrorCodes } from '@shared/errors/error-codes';

describe('RedeemEarlyAdopterCodeUseCase', () => {
  let useCase: RedeemEarlyAdopterCodeUseCase;
  let mockLicenseRepository: jest.Mocked<ILicenseRepository>;
  let mockUserRepository: jest.Mocked<IUserRepository>;

  const validCode = 'SPLICE-EA01-2026-BETA';
  const validEmail = 'early.adopter@example.com';

  beforeEach(() => {
    mockLicenseRepository = {
      findByKey: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    mockUserRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByStripeCustomerId: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    useCase = new RedeemEarlyAdopterCodeUseCase(
      mockLicenseRepository,
      mockUserRepository,
    );
  });

  const createEarlyAdopterLicense = (overrides?: Partial<{
    activatedAt: Date | null;
    status: 'active' | 'expired' | 'revoked';
    expiresAt: Date | null;
  }>) => {
    return License.create({
      id: 'license-ea-1',
      userId: 'placeholder-user',
      licenseKey: LicenseKey.create(validCode),
      plan: Plan.pro(),
      status: overrides?.status ?? 'active',
      activatedAt: overrides?.activatedAt ?? null,
      expiresAt: overrides?.expiresAt ?? null, // null = lifetime
      createdAt: new Date(),
    });
  };

  const createUser = (email: string = validEmail) => {
    return User.create({
      id: 'user-1',
      email: Email.create(email),
      stripeCustomerId: null,
      createdAt: new Date(),
    });
  };

  describe('successful redemption', () => {
    it('should redeem code for existing user', async () => {
      const license = createEarlyAdopterLicense();
      const user = createUser();

      mockLicenseRepository.findByKey.mockResolvedValue(license);
      mockUserRepository.findByEmail.mockResolvedValue(user);
      mockLicenseRepository.update.mockImplementation(async (l) => l);

      const result = await useCase.execute(validCode, validEmail);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        licenseKey: validCode,
        plan: 'pro',
        expiresAt: null,
      });
      expect(mockLicenseRepository.update).toHaveBeenCalled();
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('should create new user when email not found', async () => {
      const license = createEarlyAdopterLicense();

      mockLicenseRepository.findByKey.mockResolvedValue(license);
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.save.mockImplementation(async (u) => u);
      mockLicenseRepository.update.mockImplementation(async (l) => l);

      const result = await useCase.execute(validCode, validEmail);

      expect(result.success).toBe(true);
      expect(mockUserRepository.save).toHaveBeenCalled();
      const savedUser = mockUserRepository.save.mock.calls[0][0];
      expect(savedUser.email.getValue()).toBe(validEmail);
    });

    it('should update license activatedAt on successful redemption', async () => {
      const license = createEarlyAdopterLicense();
      const user = createUser();

      mockLicenseRepository.findByKey.mockResolvedValue(license);
      mockUserRepository.findByEmail.mockResolvedValue(user);
      mockLicenseRepository.update.mockImplementation(async (l) => l);

      await useCase.execute(validCode, validEmail);

      const updatedLicense = mockLicenseRepository.update.mock.calls[0][0];
      expect(updatedLicense.isActivated()).toBe(true);
      expect(updatedLicense.activatedAt).toBeInstanceOf(Date);
    });

    it('should link license to existing user', async () => {
      const license = createEarlyAdopterLicense();
      const user = createUser();

      mockLicenseRepository.findByKey.mockResolvedValue(license);
      mockUserRepository.findByEmail.mockResolvedValue(user);
      mockLicenseRepository.update.mockImplementation(async (l) => l);

      await useCase.execute(validCode, validEmail);

      const updatedLicense = mockLicenseRepository.update.mock.calls[0][0];
      expect(updatedLicense.userId).toBe(user.id);
    });

    it('should link license to newly created user', async () => {
      const license = createEarlyAdopterLicense();

      mockLicenseRepository.findByKey.mockResolvedValue(license);
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.save.mockImplementation(async (u) => u);
      mockLicenseRepository.update.mockImplementation(async (l) => l);

      await useCase.execute(validCode, validEmail);

      const savedUser = mockUserRepository.save.mock.calls[0][0];
      const updatedLicense = mockLicenseRepository.update.mock.calls[0][0];
      expect(updatedLicense.userId).toBe(savedUser.id);
    });
  });

  describe('code validation errors', () => {
    it('should return EARLY_ADOPTER_CODE_INVALID when code not found', async () => {
      mockLicenseRepository.findByKey.mockResolvedValue(null);

      const result = await useCase.execute(validCode, validEmail);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(ErrorCodes.EARLY_ADOPTER_CODE_INVALID);
    });

    it('should return EARLY_ADOPTER_CODE_ALREADY_USED when code already redeemed', async () => {
      const license = createEarlyAdopterLicense({ activatedAt: new Date() });

      mockLicenseRepository.findByKey.mockResolvedValue(license);

      const result = await useCase.execute(validCode, validEmail);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(ErrorCodes.EARLY_ADOPTER_CODE_ALREADY_USED);
    });

    it('should return EARLY_ADOPTER_CODE_EXPIRED when code status is revoked', async () => {
      const license = createEarlyAdopterLicense({ status: 'revoked' });

      mockLicenseRepository.findByKey.mockResolvedValue(license);

      const result = await useCase.execute(validCode, validEmail);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(ErrorCodes.EARLY_ADOPTER_CODE_EXPIRED);
    });

    it('should return EARLY_ADOPTER_CODE_EXPIRED when code status is expired', async () => {
      const license = createEarlyAdopterLicense({ status: 'expired' });

      mockLicenseRepository.findByKey.mockResolvedValue(license);

      const result = await useCase.execute(validCode, validEmail);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(ErrorCodes.EARLY_ADOPTER_CODE_EXPIRED);
    });
  });

  describe('lifetime access characteristics', () => {
    it('should return expiresAt as null for lifetime access', async () => {
      const license = createEarlyAdopterLicense({ expiresAt: null });
      const user = createUser();

      mockLicenseRepository.findByKey.mockResolvedValue(license);
      mockUserRepository.findByEmail.mockResolvedValue(user);
      mockLicenseRepository.update.mockImplementation(async (l) => l);

      const result = await useCase.execute(validCode, validEmail);

      expect(result.success).toBe(true);
      expect(result.data?.expiresAt).toBeNull();
    });

    it('should always return plan as pro', async () => {
      const license = createEarlyAdopterLicense();
      const user = createUser();

      mockLicenseRepository.findByKey.mockResolvedValue(license);
      mockUserRepository.findByEmail.mockResolvedValue(user);
      mockLicenseRepository.update.mockImplementation(async (l) => l);

      const result = await useCase.execute(validCode, validEmail);

      expect(result.success).toBe(true);
      expect(result.data?.plan).toBe('pro');
    });
  });
});
