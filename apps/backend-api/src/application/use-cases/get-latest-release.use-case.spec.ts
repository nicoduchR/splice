import { GetLatestReleaseUseCase } from './get-latest-release.use-case';
import { IReleaseRepository } from '@domain/ports/release.repository.port';
import { AppRelease, PlatformRelease, Platform } from '@domain/entities/app-release.entity';
import { SemVer } from '@domain/value-objects/semver.vo';
import { ErrorCodes } from '@shared/errors/error-codes';

describe('GetLatestReleaseUseCase', () => {
  let useCase: GetLatestReleaseUseCase;
  let mockReleaseRepository: jest.Mocked<IReleaseRepository>;

  beforeEach(() => {
    mockReleaseRepository = {
      findById: jest.fn(),
      findByVersion: jest.fn(),
      findLatestForPlatform: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    useCase = new GetLatestReleaseUseCase(mockReleaseRepository);
  });

  function createRelease(version: string, platform: Platform = 'darwin-aarch64'): AppRelease {
    const releaseId = `release-${version}`;
    return AppRelease.create({
      id: releaseId,
      version: SemVer.parse(version),
      releaseDate: new Date('2026-01-15T00:00:00Z'),
      releaseNotes: `Release notes for ${version}`,
      isMandatory: false,
      platformReleases: [
        PlatformRelease.create({
          id: `pr-${version}-${platform}`,
          releaseId,
          platform,
          downloadUrl: `https://updates.splice.app/v${version}/Splice.tar.gz`,
          signature: `sig-${version}`,
          createdAt: new Date(),
        }),
      ],
      createdAt: new Date(),
    });
  }

  it('should return update when newer version is available', async () => {
    const release = createRelease('1.1.0');
    mockReleaseRepository.findLatestForPlatform.mockResolvedValue(release);

    const result = await useCase.execute('darwin-aarch64', '1.0.0');

    expect(result.hasUpdate).toBe(true);
    expect(result.update).not.toBeNull();
    expect(result.update!.version).toBe('1.1.0');
    expect(result.update!.url).toContain('v1.1.0');
    expect(result.update!.signature).toBe('sig-1.1.0');
    expect(result.error).toBeUndefined();
  });

  it('should return no update when on latest version', async () => {
    const release = createRelease('1.0.0');
    mockReleaseRepository.findLatestForPlatform.mockResolvedValue(release);

    const result = await useCase.execute('darwin-aarch64', '1.0.0');

    expect(result.hasUpdate).toBe(false);
    expect(result.update).toBeNull();
    expect(result.error).toBeUndefined();
  });

  it('should return no update when current is newer than latest', async () => {
    const release = createRelease('1.0.0');
    mockReleaseRepository.findLatestForPlatform.mockResolvedValue(release);

    const result = await useCase.execute('darwin-aarch64', '2.0.0');

    expect(result.hasUpdate).toBe(false);
    expect(result.update).toBeNull();
  });

  it('should return no update when no release exists for platform', async () => {
    mockReleaseRepository.findLatestForPlatform.mockResolvedValue(null);

    const result = await useCase.execute('darwin-aarch64', '1.0.0');

    expect(result.hasUpdate).toBe(false);
    expect(result.update).toBeNull();
    expect(result.error).toBeUndefined();
  });

  it('should return error for invalid version format', async () => {
    const result = await useCase.execute('darwin-aarch64', 'invalid-version');

    expect(result.hasUpdate).toBe(false);
    expect(result.update).toBeNull();
    expect(result.error).toBeDefined();
    expect(result.error!.code).toBe(ErrorCodes.UPDATE_VERSION_INVALID);
  });

  it('should call repository with correct platform', async () => {
    mockReleaseRepository.findLatestForPlatform.mockResolvedValue(null);

    await useCase.execute('windows-x86_64', '1.0.0');

    expect(mockReleaseRepository.findLatestForPlatform).toHaveBeenCalledWith('windows-x86_64');
  });

  it('should handle major version updates', async () => {
    const release = createRelease('2.0.0');
    mockReleaseRepository.findLatestForPlatform.mockResolvedValue(release);

    const result = await useCase.execute('darwin-aarch64', '1.9.9');

    expect(result.hasUpdate).toBe(true);
    expect(result.update!.version).toBe('2.0.0');
  });

  it('should handle prerelease versions correctly', async () => {
    const release = createRelease('1.1.0');
    mockReleaseRepository.findLatestForPlatform.mockResolvedValue(release);

    // Current is prerelease, latest is stable
    const result = await useCase.execute('darwin-aarch64', '1.1.0-beta.1');

    expect(result.hasUpdate).toBe(true);
    expect(result.update!.version).toBe('1.1.0');
  });

  it('should include release notes in update manifest', async () => {
    const release = createRelease('1.1.0');
    mockReleaseRepository.findLatestForPlatform.mockResolvedValue(release);

    const result = await useCase.execute('darwin-aarch64', '1.0.0');

    expect(result.update!.notes).toBe('Release notes for 1.1.0');
  });
});
