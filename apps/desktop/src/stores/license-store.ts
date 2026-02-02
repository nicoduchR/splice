import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { invoke } from '@tauri-apps/api/core';

type LicensePlan = 'free' | 'pro';

interface LicenseStore {
  // State
  licenseKey: string | null;
  plan: LicensePlan;
  isVerified: boolean;
  lastVerifiedAt: number | null;
  gracePeriodEndsAt: number | null;
  error: string | null;

  // Actions
  verifyLicense: (licenseKey: string) => Promise<boolean>;
  checkGracePeriod: () => Promise<boolean>;
  clearLicense: () => void;
}

export const useLicenseStore = create<LicenseStore>()(
  devtools(
    persist(
      (set, get) => ({
        licenseKey: null,
        plan: 'free',
        isVerified: false,
        lastVerifiedAt: null,
        gracePeriodEndsAt: null,
        error: null,

        verifyLicense: async (licenseKey) => {
          try {
            const result = await invoke<boolean>('verify_license', { licenseKey });

            if (result) {
              set({
                licenseKey,
                isVerified: true,
                lastVerifiedAt: Date.now(),
                error: null,
              });
            } else {
              set({ error: 'License verification failed' });
            }

            return result;
          } catch (e) {
            set({ error: String(e) });
            return false;
          }
        },

        checkGracePeriod: async () => {
          try {
            const valid = await invoke<boolean>('check_grace_period');
            return valid;
          } catch (e) {
            return false;
          }
        },

        clearLicense: () => {
          set({
            licenseKey: null,
            plan: 'free',
            isVerified: false,
            lastVerifiedAt: null,
            gracePeriodEndsAt: null,
          });
        },
      }),
      {
        name: 'license-storage', // localStorage key
        partialize: (state) => ({
          licenseKey: state.licenseKey,
          plan: state.plan,
          lastVerifiedAt: state.lastVerifiedAt,
        }),
      }
    ),
    { name: 'LicenseStore' }
  )
);
