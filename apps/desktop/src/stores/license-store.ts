import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  LicenseApi,
  LICENSE_PLAN,
  type LicensePlan,
  type LicenseStatus,
  type GracePeriodStatus,
} from '../services/license-api';

interface LicenseStore {
  // State
  licenseKey: string | null;
  plan: LicensePlan;
  isVerified: boolean;
  lastVerifiedAt: number | null;
  gracePeriodEndsAt: number | null;
  expiresAt: number | null;
  error: string | null;
  isVerifying: boolean;
  isInGracePeriod: boolean;
  daysUntilGraceExpires: number;
  isBlocked: boolean;
  isLicenseExpired: boolean;

  // Actions
  verifyOnStartup: () => Promise<void>;
  verifyLicense: (licenseKey: string) => Promise<boolean>;
  storeLicenseKey: (key: string) => Promise<void>;
  checkGracePeriod: () => Promise<GracePeriodStatus>;
  getLicenseStatus: () => Promise<LicenseStatus>;
  clearLicense: () => Promise<void>;
  setError: (error: string | null) => void;
}

export const useLicenseStore = create<LicenseStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      licenseKey: null,
      plan: LICENSE_PLAN.FREE,
      isVerified: false,
      lastVerifiedAt: null,
      gracePeriodEndsAt: null,
      expiresAt: null,
      error: null,
      isVerifying: false,
      isInGracePeriod: false,
      daysUntilGraceExpires: 0,
      isBlocked: false,
      isLicenseExpired: false,

      /**
       * Verify license on app startup
       * - Retrieves stored license key from secure storage
       * - Verifies with backend API
       * - Falls back to grace period if offline
       */
      verifyOnStartup: async () => {
        set({ isVerifying: true, error: null });

        try {
          // First, get the stored license key from secure storage
          const storedKey = await LicenseApi.getLicenseKey();

          if (!storedKey) {
            // No license key stored - check current status
            const status = await LicenseApi.getLicenseStatus();
            set({
              plan: status.plan,
              isVerified: status.isVerified,
              lastVerifiedAt: status.lastVerifiedAt > 0 ? status.lastVerifiedAt : null,
              gracePeriodEndsAt: status.gracePeriodEndsAt > 0 ? status.gracePeriodEndsAt : null,
              expiresAt: status.expiresAt,
              isInGracePeriod: status.isGracePeriodValid,
              daysUntilGraceExpires: status.daysUntilGraceExpires,
              isBlocked: status.isBlocked,
              isLicenseExpired: status.isLicenseExpired,
              isVerifying: false,
            });
            return;
          }

          // Try to verify online
          set({ licenseKey: storedKey });

          const result = await LicenseApi.verifyLicense(storedKey);

          if (result.isValid) {
            // Successful online verification
            const status = await LicenseApi.getLicenseStatus();
            set({
              plan: result.plan,
              isVerified: true,
              expiresAt: result.expiresAt,
              lastVerifiedAt: status.lastVerifiedAt,
              gracePeriodEndsAt: status.gracePeriodEndsAt,
              isInGracePeriod: true,
              daysUntilGraceExpires: status.daysUntilGraceExpires,
              isBlocked: false,
              isLicenseExpired: false,
              error: null,
              isVerifying: false,
            });
          } else {
            // Verification failed - check grace period
            const graceStatus = await LicenseApi.checkGracePeriod();

            if (graceStatus.isValid) {
              // Grace period valid - continue with cached license
              const status = await LicenseApi.getLicenseStatus();
              set({
                plan: status.plan,
                isVerified: graceStatus.hasBeenVerified,
                lastVerifiedAt: status.lastVerifiedAt > 0 ? status.lastVerifiedAt : null,
                gracePeriodEndsAt: graceStatus.gracePeriodEndsAt,
                isInGracePeriod: true,
                daysUntilGraceExpires: graceStatus.daysRemaining,
                isBlocked: false,
                error: result.error || 'Vérification hors ligne - période de grâce active',
                isVerifying: false,
              });
            } else {
              // Grace period expired - block app
              set({
                plan: LICENSE_PLAN.FREE,
                isVerified: false,
                isInGracePeriod: false,
                daysUntilGraceExpires: 0,
                isBlocked: graceStatus.hasBeenVerified, // Only block if previously verified
                error: result.error || 'La période de grâce a expiré',
                isVerifying: false,
              });
            }
          }
        } catch (e) {
          // Network error or other failure - check grace period
          try {
            const graceStatus = await LicenseApi.checkGracePeriod();

            if (graceStatus.isValid) {
              const status = await LicenseApi.getLicenseStatus();
              set({
                plan: status.plan,
                isVerified: graceStatus.hasBeenVerified,
                lastVerifiedAt: status.lastVerifiedAt > 0 ? status.lastVerifiedAt : null,
                gracePeriodEndsAt: graceStatus.gracePeriodEndsAt,
                isInGracePeriod: true,
                daysUntilGraceExpires: graceStatus.daysRemaining,
                isBlocked: false,
                error: 'Hors ligne - période de grâce active',
                isVerifying: false,
              });
            } else {
              set({
                isBlocked: graceStatus.hasBeenVerified,
                error: String(e),
                isVerifying: false,
              });
            }
          } catch {
            set({
              error: String(e),
              isVerifying: false,
            });
          }
        }
      },

      /**
       * Verify a license key and store it if valid
       */
      verifyLicense: async (licenseKey) => {
        set({ isVerifying: true, error: null });

        try {
          const result = await LicenseApi.verifyLicense(licenseKey);

          if (result.isValid) {
            // Store the license key securely
            await LicenseApi.storeLicenseKey(licenseKey);

            const status = await LicenseApi.getLicenseStatus();
            set({
              licenseKey,
              plan: result.plan,
              isVerified: true,
              expiresAt: result.expiresAt,
              lastVerifiedAt: status.lastVerifiedAt,
              gracePeriodEndsAt: status.gracePeriodEndsAt,
              isInGracePeriod: true,
              daysUntilGraceExpires: status.daysUntilGraceExpires,
              isBlocked: false,
              error: null,
              isVerifying: false,
            });
            return true;
          } else {
            set({
              error: result.error || 'License verification failed',
              isVerifying: false,
            });
            return false;
          }
        } catch (e) {
          set({
            error: String(e),
            isVerifying: false,
          });
          return false;
        }
      },

      /**
       * Store a license key in secure storage
       */
      storeLicenseKey: async (key) => {
        await LicenseApi.storeLicenseKey(key);
        set({ licenseKey: key });
      },

      /**
       * Check grace period status
       */
      checkGracePeriod: async () => {
        const status = await LicenseApi.checkGracePeriod();
        set({
          isInGracePeriod: status.isValid,
          daysUntilGraceExpires: status.daysRemaining,
          gracePeriodEndsAt: status.gracePeriodEndsAt,
        });
        return status;
      },

      /**
       * Get complete license status
       */
      getLicenseStatus: async () => {
        const status = await LicenseApi.getLicenseStatus();
        set({
          plan: status.plan,
          isVerified: status.isVerified,
          lastVerifiedAt: status.lastVerifiedAt > 0 ? status.lastVerifiedAt : null,
          gracePeriodEndsAt: status.gracePeriodEndsAt > 0 ? status.gracePeriodEndsAt : null,
          expiresAt: status.expiresAt,
          isInGracePeriod: status.isGracePeriodValid,
          daysUntilGraceExpires: status.daysUntilGraceExpires,
          isBlocked: status.isBlocked,
          isLicenseExpired: status.isLicenseExpired,
        });
        return status;
      },

      /**
       * Clear the license and reset to free plan
       */
      clearLicense: async () => {
        await LicenseApi.clearLicense();
        set({
          licenseKey: null,
          plan: LICENSE_PLAN.FREE,
          isVerified: false,
          lastVerifiedAt: null,
          gracePeriodEndsAt: null,
          expiresAt: null,
          isInGracePeriod: false,
          daysUntilGraceExpires: 0,
          isBlocked: false,
          isLicenseExpired: false,
          error: null,
        });
      },

      /**
       * Set error message
       */
      setError: (error) => {
        set({ error });
      },
    }),
    { name: 'LicenseStore' }
  )
);
