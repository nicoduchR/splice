import { License } from '@domain/entities/license.entity';
import { PlanType } from '@domain/value-objects/plan.vo';
import { LicenseStatus } from '@domain/entities/license.entity';

export interface LicenseResponseData {
  licenseKey: string;
  plan: PlanType;
  status: LicenseStatus;
  isValid: boolean;
  activatedAt: string | null;
  expiresAt: string | null;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export class LicenseResponseDto {
  static fromEntity(license: License): LicenseResponseData {
    return {
      licenseKey: license.licenseKey.getValue(),
      plan: license.plan.getValue(),
      status: license.status,
      isValid: license.isValid(),
      activatedAt: license.activatedAt?.toISOString() ?? null,
      expiresAt: license.expiresAt?.toISOString() ?? null,
    };
  }

  static success<T>(data: T): ApiSuccessResponse<T> {
    return {
      success: true,
      data,
    };
  }

  static error(code: string, message: string): ApiErrorResponse {
    return {
      success: false,
      error: {
        code,
        message,
      },
    };
  }
}
