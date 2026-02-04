import { IsString, Matches, IsOptional } from 'class-validator';
import { Platform } from '@domain/entities/app-release.entity';

/**
 * DTO for checking updates
 *
 * Query parameters for the GET /api/v1/updates/latest endpoint
 */
export class CheckUpdateDto {
  @IsString()
  @Matches(/^(darwin-aarch64|darwin-x86_64|windows-x86_64|linux-x86_64)$/, {
    message: 'Platform must be one of: darwin-aarch64, darwin-x86_64, windows-x86_64, linux-x86_64',
  })
  platform!: Platform;

  @IsString()
  @Matches(/^(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9.-]+))?(?:\+([a-zA-Z0-9.-]+))?$/, {
    message: 'Version must be a valid semantic version (e.g., 1.0.0, 1.0.0-beta.1)',
  })
  version!: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z]{2}$/, {
    message: 'Locale must be a valid 2-letter language code (e.g., en, fr)',
  })
  locale?: string;
}
