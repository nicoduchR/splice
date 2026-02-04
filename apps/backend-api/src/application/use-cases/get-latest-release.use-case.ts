import { Injectable, Inject } from '@nestjs/common';
import { RELEASE_REPOSITORY, IReleaseRepository } from '@domain/ports/release.repository.port';
import { Platform } from '@domain/entities/app-release.entity';
import { SemVer } from '@domain/value-objects/semver.vo';
import { UpdateResponseDto, UpdateResponseData } from '../dto/update-response.dto';
import { ErrorCodes, createError } from '@shared/errors/error-codes';

export interface GetLatestReleaseResult {
  hasUpdate: boolean;
  update: UpdateResponseData | null;
  error?: { code: string; message: string };
}

@Injectable()
export class GetLatestReleaseUseCase {
  constructor(
    @Inject(RELEASE_REPOSITORY)
    private readonly releaseRepository: IReleaseRepository,
  ) {}

  async execute(platform: Platform, currentVersion: string): Promise<GetLatestReleaseResult> {
    // Parse and validate the current version
    let parsedVersion: SemVer;
    try {
      parsedVersion = SemVer.parse(currentVersion);
    } catch {
      const error = createError(ErrorCodes.UPDATE_VERSION_INVALID);
      return {
        hasUpdate: false,
        update: null,
        error: { code: error.code, message: error.message },
      };
    }

    // Find the latest release for this platform
    const latestRelease = await this.releaseRepository.findLatestForPlatform(platform);

    if (!latestRelease) {
      // No release available for this platform
      return {
        hasUpdate: false,
        update: null,
      };
    }

    // Check if the latest release is newer than the current version
    if (!latestRelease.isNewerThan(parsedVersion)) {
      // Already on the latest version
      return {
        hasUpdate: false,
        update: null,
      };
    }

    // Build the update manifest
    const updateManifest = UpdateResponseDto.fromEntity(latestRelease, platform);

    if (!updateManifest) {
      // This shouldn't happen since we found the release for this platform,
      // but handle it gracefully
      const error = createError(ErrorCodes.UPDATE_PLATFORM_NOT_SUPPORTED);
      return {
        hasUpdate: false,
        update: null,
        error: { code: error.code, message: error.message },
      };
    }

    return {
      hasUpdate: true,
      update: updateManifest,
    };
  }
}
