import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useLicenseStore } from './license-store';
import { LicenseApi, LICENSE_PLAN } from '../services/license-api';

// Mock the LicenseApi
vi.mock('../services/license-api', () => ({
  LicenseApi: {
    getLicenseKey: vi.fn(),
    getLicenseStatus: vi.fn(),
    verifyLicense: vi.fn(),
    checkGracePeriod: vi.fn(),
    storeLicenseKey: vi.fn(),
    clearLicense: vi.fn(),
    onLicenseVerified: vi.fn(),
    onLicenseExpired: vi.fn(),
    onGraceWarning: vi.fn(),
  },
  LICENSE_PLAN: {
    FREE: 'free',
    PRO: 'pro',
  },
}));

describe('useLicenseStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useLicenseStore.setState({
      licenseKey: null,
      plan: 'free',
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
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct default values', () => {
      const state = useLicenseStore.getState();
      expect(state.plan).toBe('free');
      expect(state.isVerified).toBe(false);
      expect(state.isBlocked).toBe(false);
      expect(state.licenseKey).toBeNull();
    });
  });

  describe('verifyOnStartup', () => {
    it('should set isVerifying to true during verification', async () => {
      vi.mocked(LicenseApi.getLicenseKey).mockResolvedValue(null);
      vi.mocked(LicenseApi.getLicenseStatus).mockResolvedValue({
        plan: 'free',
        isVerified: false,
        lastVerifiedAt: 0,
        gracePeriodEndsAt: 0,
        expiresAt: null,
        isGracePeriodValid: false,
        daysUntilGraceExpires: 0,
        isLicenseExpired: false,
        isBlocked: false,
      });

      const promise = useLicenseStore.getState().verifyOnStartup();

      // Check that isVerifying is true during verification
      expect(useLicenseStore.getState().isVerifying).toBe(true);

      await promise;

      // Check that isVerifying is false after verification
      expect(useLicenseStore.getState().isVerifying).toBe(false);
    });

    it('should handle no stored license key', async () => {
      vi.mocked(LicenseApi.getLicenseKey).mockResolvedValue(null);
      vi.mocked(LicenseApi.getLicenseStatus).mockResolvedValue({
        plan: 'free',
        isVerified: false,
        lastVerifiedAt: 0,
        gracePeriodEndsAt: 0,
        expiresAt: null,
        isGracePeriodValid: false,
        daysUntilGraceExpires: 0,
        isLicenseExpired: false,
        isBlocked: false,
      });

      await useLicenseStore.getState().verifyOnStartup();

      const state = useLicenseStore.getState();
      expect(state.plan).toBe('free');
      expect(state.isBlocked).toBe(false);
    });

    it('should verify online and update state on success', async () => {
      vi.mocked(LicenseApi.getLicenseKey).mockResolvedValue('SPLICE-TEST-1234');
      vi.mocked(LicenseApi.verifyLicense).mockResolvedValue({
        isValid: true,
        plan: 'pro',
        expiresAt: 1738497600,
        error: null,
      });
      vi.mocked(LicenseApi.getLicenseStatus).mockResolvedValue({
        plan: 'pro',
        isVerified: true,
        lastVerifiedAt: 1706961600,
        gracePeriodEndsAt: 1707566400,
        expiresAt: 1738497600,
        isGracePeriodValid: true,
        daysUntilGraceExpires: 7,
        isLicenseExpired: false,
        isBlocked: false,
      });

      await useLicenseStore.getState().verifyOnStartup();

      const state = useLicenseStore.getState();
      expect(state.plan).toBe('pro');
      expect(state.isVerified).toBe(true);
      expect(state.isBlocked).toBe(false);
      expect(state.licenseKey).toBe('SPLICE-TEST-1234');
    });

    it('should use grace period when verification fails', async () => {
      vi.mocked(LicenseApi.getLicenseKey).mockResolvedValue('SPLICE-TEST-1234');
      vi.mocked(LicenseApi.verifyLicense).mockResolvedValue({
        isValid: false,
        plan: 'free',
        expiresAt: null,
        error: 'Network error',
      });
      vi.mocked(LicenseApi.checkGracePeriod).mockResolvedValue({
        isValid: true,
        daysRemaining: 5,
        hasBeenVerified: true,
        gracePeriodEndsAt: 1707566400,
      });
      vi.mocked(LicenseApi.getLicenseStatus).mockResolvedValue({
        plan: 'pro',
        isVerified: true,
        lastVerifiedAt: 1706961600,
        gracePeriodEndsAt: 1707566400,
        expiresAt: null,
        isGracePeriodValid: true,
        daysUntilGraceExpires: 5,
        isLicenseExpired: false,
        isBlocked: false,
      });

      await useLicenseStore.getState().verifyOnStartup();

      const state = useLicenseStore.getState();
      expect(state.isInGracePeriod).toBe(true);
      expect(state.daysUntilGraceExpires).toBe(5);
      expect(state.isBlocked).toBe(false);
    });

    it('should block app when grace period is expired', async () => {
      vi.mocked(LicenseApi.getLicenseKey).mockResolvedValue('SPLICE-TEST-1234');
      vi.mocked(LicenseApi.verifyLicense).mockResolvedValue({
        isValid: false,
        plan: 'free',
        expiresAt: null,
        error: 'Network error',
      });
      vi.mocked(LicenseApi.checkGracePeriod).mockResolvedValue({
        isValid: false,
        daysRemaining: 0,
        hasBeenVerified: true,
        gracePeriodEndsAt: 1706961600,
      });

      await useLicenseStore.getState().verifyOnStartup();

      const state = useLicenseStore.getState();
      expect(state.isBlocked).toBe(true);
      expect(state.isInGracePeriod).toBe(false);
    });
  });

  describe('verifyLicense', () => {
    it('should store license key on successful verification', async () => {
      vi.mocked(LicenseApi.verifyLicense).mockResolvedValue({
        isValid: true,
        plan: 'pro',
        expiresAt: 1738497600,
        error: null,
      });
      vi.mocked(LicenseApi.storeLicenseKey).mockResolvedValue(undefined);
      vi.mocked(LicenseApi.getLicenseStatus).mockResolvedValue({
        plan: 'pro',
        isVerified: true,
        lastVerifiedAt: 1706961600,
        gracePeriodEndsAt: 1707566400,
        expiresAt: 1738497600,
        isGracePeriodValid: true,
        daysUntilGraceExpires: 7,
        isLicenseExpired: false,
        isBlocked: false,
      });

      const result = await useLicenseStore.getState().verifyLicense('SPLICE-NEW-KEY');

      expect(result).toBe(true);
      expect(LicenseApi.storeLicenseKey).toHaveBeenCalledWith('SPLICE-NEW-KEY');
      expect(useLicenseStore.getState().licenseKey).toBe('SPLICE-NEW-KEY');
      expect(useLicenseStore.getState().plan).toBe('pro');
    });

    it('should not store license key on failed verification', async () => {
      vi.mocked(LicenseApi.verifyLicense).mockResolvedValue({
        isValid: false,
        plan: 'free',
        expiresAt: null,
        error: 'License not found',
      });

      const result = await useLicenseStore.getState().verifyLicense('INVALID-KEY');

      expect(result).toBe(false);
      expect(LicenseApi.storeLicenseKey).not.toHaveBeenCalled();
      expect(useLicenseStore.getState().error).toBe('License not found');
    });
  });

  describe('clearLicense', () => {
    it('should reset state to free plan', async () => {
      // Set up some state first
      useLicenseStore.setState({
        licenseKey: 'SPLICE-TEST',
        plan: 'pro',
        isVerified: true,
      });

      vi.mocked(LicenseApi.clearLicense).mockResolvedValue(undefined);

      await useLicenseStore.getState().clearLicense();

      const state = useLicenseStore.getState();
      expect(state.licenseKey).toBeNull();
      expect(state.plan).toBe('free');
      expect(state.isVerified).toBe(false);
      expect(LicenseApi.clearLicense).toHaveBeenCalled();
    });
  });

  describe('setError', () => {
    it('should update error state', () => {
      useLicenseStore.getState().setError('Test error');
      expect(useLicenseStore.getState().error).toBe('Test error');

      useLicenseStore.getState().setError(null);
      expect(useLicenseStore.getState().error).toBeNull();
    });
  });
});
