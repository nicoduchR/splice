import { useEffect, useCallback, useState } from 'react';
import { useLicenseStore } from '@/stores/license-store';
import { LicenseApi } from '@/services/license-api';
import type { UnlistenFn } from '@tauri-apps/api/event';

/**
 * Hook for license verification on app startup
 * - Verifies license automatically on mount
 * - Listens for license events (verified, expired, grace warning)
 * - Returns state for UI rendering
 */
export function useLicenseVerification() {
  const {
    isBlocked,
    isVerifying,
    isInGracePeriod,
    daysUntilGraceExpires,
    plan,
    error,
    verifyOnStartup,
    getLicenseStatus,
  } = useLicenseStore();

  const [showGraceWarning, setShowGraceWarning] = useState(false);

  // Verify license on mount
  useEffect(() => {
    verifyOnStartup();
  }, [verifyOnStartup]);

  // Show grace warning when blocked
  useEffect(() => {
    if (isBlocked) {
      setShowGraceWarning(true);
    }
  }, [isBlocked]);

  // Listen for Tauri events
  useEffect(() => {
    const unlisteners: UnlistenFn[] = [];

    const setupListeners = async () => {
      // License verified event
      const unlistenVerified = await LicenseApi.onLicenseVerified((event) => {
        console.log('License verified:', event);
        setShowGraceWarning(false);
        getLicenseStatus();
      });
      unlisteners.push(unlistenVerified);

      // License expired event
      const unlistenExpired = await LicenseApi.onLicenseExpired((event) => {
        console.log('License expired:', event);
        setShowGraceWarning(true);
        getLicenseStatus();
      });
      unlisteners.push(unlistenExpired);

      // Grace warning event
      const unlistenGraceWarning = await LicenseApi.onGraceWarning((event) => {
        console.log('Grace period warning:', event);
        // Could show a toast notification here
      });
      unlisteners.push(unlistenGraceWarning);
    };

    setupListeners();

    return () => {
      unlisteners.forEach((unlisten) => unlisten());
    };
  }, [getLicenseStatus]);

  const dismissGraceWarning = useCallback(() => {
    // Only dismiss if not actually blocked
    if (!isBlocked) {
      setShowGraceWarning(false);
    }
  }, [isBlocked]);

  const retryVerification = useCallback(async () => {
    await verifyOnStartup();
    // The modal will close automatically if verification succeeds
    // (isBlocked becomes false)
  }, [verifyOnStartup]);

  return {
    // State
    isBlocked,
    isVerifying,
    isInGracePeriod,
    daysUntilGraceExpires,
    plan,
    error,
    showGraceWarning,

    // Actions
    dismissGraceWarning,
    retryVerification,
  };
}
