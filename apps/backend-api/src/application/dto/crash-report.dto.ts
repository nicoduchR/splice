import { IsString, IsNumber, IsOptional, Min, MaxLength } from 'class-validator';

/**
 * DTO for crash report submissions
 *
 * Body for POST /api/v1/crashes/report
 */
export class CrashReportDto {
  @IsString()
  @MaxLength(20)
  version!: string;

  @IsString()
  @MaxLength(50)
  platform!: string;

  @IsNumber()
  @Min(0)
  crash_count!: number;

  @IsString()
  @MaxLength(20)
  previous_version!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50000)
  error_log?: string;
}

export class CrashReportResponseDto {
  success!: boolean;

  static ok(): CrashReportResponseDto {
    return { success: true };
  }
}
