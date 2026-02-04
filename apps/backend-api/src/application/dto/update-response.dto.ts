import { AppRelease, Platform, PlatformRelease } from '@domain/entities/app-release.entity';

/**
 * Update manifest response format compatible with tauri-plugin-updater
 *
 * @see https://v2.tauri.app/plugin/updater/
 */
export interface TauriUpdateManifest {
  version: string;
  notes: string;
  pub_date: string;
  url: string;
  signature: string;
}

/**
 * Extended update response with additional metadata
 */
export interface UpdateResponseData extends TauriUpdateManifest {
  isMandatory: boolean;
}

/**
 * DTO for transforming AppRelease to tauri-plugin-updater format
 */
export class UpdateResponseDto {
  /**
   * Create a tauri-plugin-updater compatible manifest from an AppRelease
   */
  static fromEntity(release: AppRelease, platform: Platform): UpdateResponseData | null {
    const platformRelease = release.getPlatformRelease(platform);

    if (!platformRelease) {
      return null;
    }

    return UpdateResponseDto.createManifest(release, platformRelease);
  }

  private static createManifest(release: AppRelease, platformRelease: PlatformRelease): UpdateResponseData {
    return {
      version: release.version.toString(),
      notes: release.releaseNotes ?? '',
      pub_date: release.releaseDate.toISOString(),
      url: platformRelease.downloadUrl,
      signature: platformRelease.signature,
      isMandatory: release.isMandatory,
    };
  }

  /**
   * Create a success response wrapper
   */
  static success(data: UpdateResponseData): { success: true; data: UpdateResponseData } {
    return {
      success: true,
      data,
    };
  }

  /**
   * Create an error response wrapper
   */
  static error(code: string, message: string): { success: false; error: { code: string; message: string } } {
    return {
      success: false,
      error: {
        code,
        message,
      },
    };
  }
}
