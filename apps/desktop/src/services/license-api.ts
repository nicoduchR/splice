import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';

export type LicensePlan = 'free' | 'pro';

/** License plan constants - use these instead of magic strings */
export const LICENSE_PLAN = {
  FREE: 'free' as const,
  PRO: 'pro' as const,
} satisfies Record<string, LicensePlan>;

export interface VerifyLicenseResult {
  isValid: boolean;
  plan: LicensePlan;
  expiresAt: number | null;
  error: string | null;
}

export interface GracePeriodStatus {
  isValid: boolean;
  daysRemaining: number;
  hasBeenVerified: boolean;
  gracePeriodEndsAt: number;
}

export interface LicenseStatus {
  plan: LicensePlan;
  isVerified: boolean;
  lastVerifiedAt: number;
  gracePeriodEndsAt: number;
  expiresAt: number | null;
  isGracePeriodValid: boolean;
  daysUntilGraceExpires: number;
  isLicenseExpired: boolean;
  isBlocked: boolean;
}

export interface LicenseVerifiedEvent {
  plan: string;
  expiresAt: number | null;
}

export interface LicenseExpiredEvent {
  message: string;
}

export interface LicenseGraceWarningEvent {
  daysRemaining: number;
  message: string;
}

export interface RedeemEarlyAdopterResult {
  success: boolean;
  data?: {
    licenseKey: string;
    plan: 'pro';
    expiresAt: null;
  };
  error?: {
    code: string;
    message: string;
  };
}

export class LicenseApi {
  /**
   * Store license key in secure credential storage (Keychain/Credential Manager)
   */
  static async storeLicenseKey(licenseKey: string): Promise<void> {
    try {
      await invoke('store_license_key', { licenseKey });
    } catch (error) {
      console.error('Failed to store license key:', error);
      throw new Error(`Échec du stockage de la clé de licence: ${error}`);
    }
  }

  /**
   * Get license key from secure credential storage
   */
  static async getLicenseKey(): Promise<string | null> {
    try {
      return await invoke<string | null>('get_license_key');
    } catch (error) {
      console.error('Failed to get license key:', error);
      return null;
    }
  }

  /**
   * Delete license key from secure credential storage
   */
  static async deleteLicenseKey(): Promise<void> {
    try {
      await invoke('delete_license_key');
    } catch (error) {
      console.error('Failed to delete license key:', error);
      throw new Error(`Échec de la suppression de la clé de licence: ${error}`);
    }
  }

  /**
   * Verify license online with backend API
   */
  static async verifyLicense(licenseKey: string): Promise<VerifyLicenseResult> {
    try {
      return await invoke<VerifyLicenseResult>('verify_license', { licenseKey });
    } catch (error) {
      console.error('Failed to verify license:', error);
      throw new Error(`Échec de la vérification de la licence: ${error}`);
    }
  }

  /**
   * Check grace period validity
   */
  static async checkGracePeriod(): Promise<GracePeriodStatus> {
    try {
      return await invoke<GracePeriodStatus>('check_grace_period');
    } catch (error) {
      console.error('Failed to check grace period:', error);
      throw new Error(`Échec de la vérification de la période de grâce: ${error}`);
    }
  }

  /**
   * Get complete license status
   */
  static async getLicenseStatus(): Promise<LicenseStatus> {
    try {
      return await invoke<LicenseStatus>('get_license_status');
    } catch (error) {
      console.error('Failed to get license status:', error);
      throw new Error(`Échec de la récupération du statut de licence: ${error}`);
    }
  }

  /**
   * Clear license (reset to free plan and delete stored key)
   */
  static async clearLicense(): Promise<void> {
    try {
      await invoke('clear_license');
    } catch (error) {
      console.error('Failed to clear license:', error);
      throw new Error(`Échec de la suppression de la licence: ${error}`);
    }
  }

  /**
   * Listen for license verified events
   */
  static async onLicenseVerified(
    callback: (event: LicenseVerifiedEvent) => void
  ): Promise<UnlistenFn> {
    return await listen<LicenseVerifiedEvent>('license:verified', (event) => {
      callback(event.payload);
    });
  }

  /**
   * Listen for license expired events
   */
  static async onLicenseExpired(
    callback: (event: LicenseExpiredEvent) => void
  ): Promise<UnlistenFn> {
    return await listen<LicenseExpiredEvent>('license:expired', (event) => {
      callback(event.payload);
    });
  }

  /**
   * Listen for grace period warning events
   */
  static async onGraceWarning(
    callback: (event: LicenseGraceWarningEvent) => void
  ): Promise<UnlistenFn> {
    return await listen<LicenseGraceWarningEvent>('license:grace_warning', (event) => {
      callback(event.payload);
    });
  }

  /**
   * Redeem an early adopter code for lifetime Pro access
   */
  static async redeemEarlyAdopterCode(
    code: string,
    email: string
  ): Promise<RedeemEarlyAdopterResult> {
    try {
      return await invoke<RedeemEarlyAdopterResult>('redeem_early_adopter_code', {
        code,
        email,
      });
    } catch (error) {
      console.error('Failed to redeem early adopter code:', error);
      throw new Error(`Échec de l'activation du code: ${error}`);
    }
  }
}
