import { ActivateLicenseUseCase } from './activate-license.use-case';
import { ILicenseRepository } from '@domain/ports/license.repository.port';
import { IUserRepository } from '@domain/ports/user.repository.port';
import { License } from '@domain/entities/license.entity';
import { User } from '@domain/entities/user.entity';
import { LicenseKey } from '@domain/value-objects/license-key.vo';
import { Email } from '@domain/value-objects/email.vo';
import { Plan } from '@domain/value-objects/plan.vo';
import { ErrorCodes } from '@shared/errors/error-codes';

describe('ActivateLicenseUseCase', () => {
  let useCase: ActivateLicenseUseCase;
  let mockLicenseRepository: jest.Mocked<ILicenseRepository>;
  let mockUserRepository: jest.Mocked<IUserRepository>;

  const validLicenseKey = 'SPLICE-ABCD-EFGH-IJKL';
  const validEmail = 'test@example.com';

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

    useCase = new ActivateLicenseUseCase(mockLicenseRepository, mockUserRepository);
  });

  it('should activate a license for existing user', async () => {
    const license = License.create({
      id: '123',
      userId: 'user-1',
      licenseKey: LicenseKey.create(validLicenseKey),
      plan: Plan.pro(),
      status: 'active',
      activatedAt: null,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
    });

    const user = User.create({
      id: 'user-1',
      email: Email.create(validEmail),
      stripeCustomerId: null,
      createdAt: new Date(),
    });

    mockLicenseRepository.findByKey.mockResolvedValue(license);
    mockUserRepository.findByEmail.mockResolvedValue(user);
    mockLicenseRepository.update.mockImplementation(async (l) => l);

    const result = await useCase.execute(validLicenseKey, validEmail);

    expect(result.success).toBe(true);
    expect(result.license).not.toBeNull();
    expect(result.license?.isValid).toBe(true);
    expect(mockLicenseRepository.update).toHaveBeenCalled();
  });

  it('should create new user when activating license for unknown email', async () => {
    const license = License.create({
      id: '123',
      userId: 'user-1',
      licenseKey: LicenseKey.create(validLicenseKey),
      plan: Plan.pro(),
      status: 'active',
      activatedAt: null,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
    });

    mockLicenseRepository.findByKey.mockResolvedValue(license);
    mockUserRepository.findByEmail.mockResolvedValue(null);
    mockUserRepository.save.mockImplementation(async (u) => u);
    mockLicenseRepository.update.mockImplementation(async (l) => l);

    const result = await useCase.execute(validLicenseKey, validEmail);

    expect(result.success).toBe(true);
    expect(mockUserRepository.save).toHaveBeenCalled();
  });

  it('should return error when license not found', async () => {
    mockLicenseRepository.findByKey.mockResolvedValue(null);

    const result = await useCase.execute(validLicenseKey, validEmail);

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe(ErrorCodes.LICENSE_NOT_FOUND);
  });

  it('should return error when license already activated', async () => {
    const license = License.create({
      id: '123',
      userId: 'user-1',
      licenseKey: LicenseKey.create(validLicenseKey),
      plan: Plan.pro(),
      status: 'active',
      activatedAt: new Date(), // Already activated
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
    });

    mockLicenseRepository.findByKey.mockResolvedValue(license);

    const result = await useCase.execute(validLicenseKey, validEmail);

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe(ErrorCodes.LICENSE_ALREADY_ACTIVATED);
  });

  it('should return error when license is expired', async () => {
    const license = License.create({
      id: '123',
      userId: 'user-1',
      licenseKey: LicenseKey.create(validLicenseKey),
      plan: Plan.pro(),
      status: 'expired',
      activatedAt: null,
      expiresAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
    });

    mockLicenseRepository.findByKey.mockResolvedValue(license);

    const result = await useCase.execute(validLicenseKey, validEmail);

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe(ErrorCodes.LICENSE_INVALID);
  });
});
