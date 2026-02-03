import { VerifyLicenseUseCase } from './verify-license.use-case';
import { ILicenseRepository } from '@domain/ports/license.repository.port';
import { License } from '@domain/entities/license.entity';
import { LicenseKey } from '@domain/value-objects/license-key.vo';
import { Plan } from '@domain/value-objects/plan.vo';
import { ErrorCodes } from '@shared/errors/error-codes';

describe('VerifyLicenseUseCase', () => {
  let useCase: VerifyLicenseUseCase;
  let mockLicenseRepository: jest.Mocked<ILicenseRepository>;

  const validLicenseKey = 'SPLICE-ABCD-EFGH-IJKL';

  beforeEach(() => {
    mockLicenseRepository = {
      findByKey: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    useCase = new VerifyLicenseUseCase(mockLicenseRepository);
  });

  it('should return valid result for an active license', async () => {
    const license = License.create({
      id: '123',
      userId: 'user-1',
      licenseKey: LicenseKey.create(validLicenseKey),
      plan: Plan.pro(),
      status: 'active',
      activatedAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
    });

    mockLicenseRepository.findByKey.mockResolvedValue(license);

    const result = await useCase.execute(validLicenseKey);

    expect(result.isValid).toBe(true);
    expect(result.license).not.toBeNull();
    expect(result.license?.licenseKey).toBe(validLicenseKey);
    expect(result.license?.plan).toBe('pro');
    expect(result.error).toBeUndefined();
  });

  it('should return error when license is not found', async () => {
    mockLicenseRepository.findByKey.mockResolvedValue(null);

    const result = await useCase.execute(validLicenseKey);

    expect(result.isValid).toBe(false);
    expect(result.license).toBeNull();
    expect(result.error?.code).toBe(ErrorCodes.LICENSE_NOT_FOUND);
  });

  it('should return error when license is expired', async () => {
    const license = License.create({
      id: '123',
      userId: 'user-1',
      licenseKey: LicenseKey.create(validLicenseKey),
      plan: Plan.pro(),
      status: 'expired',
      activatedAt: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000),
      expiresAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000),
    });

    mockLicenseRepository.findByKey.mockResolvedValue(license);

    const result = await useCase.execute(validLicenseKey);

    expect(result.isValid).toBe(false);
    expect(result.error?.code).toBe(ErrorCodes.LICENSE_EXPIRED);
  });

  it('should return error when license is revoked', async () => {
    const license = License.create({
      id: '123',
      userId: 'user-1',
      licenseKey: LicenseKey.create(validLicenseKey),
      plan: Plan.pro(),
      status: 'revoked',
      activatedAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
    });

    mockLicenseRepository.findByKey.mockResolvedValue(license);

    const result = await useCase.execute(validLicenseKey);

    expect(result.isValid).toBe(false);
    expect(result.error?.code).toBe(ErrorCodes.LICENSE_INVALID);
  });

  it('should return valid result for free plan license', async () => {
    const license = License.create({
      id: '123',
      userId: 'user-1',
      licenseKey: LicenseKey.create(validLicenseKey),
      plan: Plan.free(),
      status: 'active',
      activatedAt: new Date(),
      expiresAt: null,
      createdAt: new Date(),
    });

    mockLicenseRepository.findByKey.mockResolvedValue(license);

    const result = await useCase.execute(validLicenseKey);

    expect(result.isValid).toBe(true);
    expect(result.license?.plan).toBe('free');
  });
});
