import { describe, it, expect, vi, beforeEach } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { LicenseApi, RedeemEarlyAdopterResult } from './license-api';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(() => Promise.resolve(vi.fn())),
}));

describe('LicenseApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('redeemEarlyAdopterCode', () => {
    const validCode = 'SPLICE-EA01-2026-BETA';
    const validEmail = 'early.adopter@example.com';

    it('should return success result when code is valid', async () => {
      const mockResult: RedeemEarlyAdopterResult = {
        success: true,
        data: {
          licenseKey: validCode,
          plan: 'pro',
          expiresAt: null,
        },
      };

      vi.mocked(invoke).mockResolvedValue(mockResult);

      const result = await LicenseApi.redeemEarlyAdopterCode(validCode, validEmail);

      expect(result).toEqual(mockResult);
      expect(invoke).toHaveBeenCalledWith('redeem_early_adopter_code', {
        code: validCode,
        email: validEmail,
      });
    });

    it('should return error result when code is invalid', async () => {
      const mockResult: RedeemEarlyAdopterResult = {
        success: false,
        error: {
          code: 'EARLY_ADOPTER_CODE_INVALID',
          message: 'Le code early adopter n\'existe pas',
        },
      };

      vi.mocked(invoke).mockResolvedValue(mockResult);

      const result = await LicenseApi.redeemEarlyAdopterCode('INVALID-CODE', validEmail);

      expect(result).toEqual(mockResult);
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('EARLY_ADOPTER_CODE_INVALID');
    });

    it('should return error result when code is already used', async () => {
      const mockResult: RedeemEarlyAdopterResult = {
        success: false,
        error: {
          code: 'EARLY_ADOPTER_CODE_ALREADY_USED',
          message: 'Ce code a déjà été utilisé',
        },
      };

      vi.mocked(invoke).mockResolvedValue(mockResult);

      const result = await LicenseApi.redeemEarlyAdopterCode(validCode, validEmail);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('EARLY_ADOPTER_CODE_ALREADY_USED');
    });

    it('should return error result when code is expired', async () => {
      const mockResult: RedeemEarlyAdopterResult = {
        success: false,
        error: {
          code: 'EARLY_ADOPTER_CODE_EXPIRED',
          message: 'Ce code n\'est plus valide',
        },
      };

      vi.mocked(invoke).mockResolvedValue(mockResult);

      const result = await LicenseApi.redeemEarlyAdopterCode(validCode, validEmail);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('EARLY_ADOPTER_CODE_EXPIRED');
    });

    it('should throw error when invoke fails', async () => {
      vi.mocked(invoke).mockRejectedValue(new Error('Network error'));

      await expect(
        LicenseApi.redeemEarlyAdopterCode(validCode, validEmail)
      ).rejects.toThrow('Échec de l\'activation du code');
    });

    it('should pass correct parameters to invoke', async () => {
      const mockResult: RedeemEarlyAdopterResult = {
        success: true,
        data: {
          licenseKey: 'SPLICE-TEST-1234-5678',
          plan: 'pro',
          expiresAt: null,
        },
      };

      vi.mocked(invoke).mockResolvedValue(mockResult);

      await LicenseApi.redeemEarlyAdopterCode('SPLICE-TEST-1234-5678', 'test@test.com');

      expect(invoke).toHaveBeenCalledWith('redeem_early_adopter_code', {
        code: 'SPLICE-TEST-1234-5678',
        email: 'test@test.com',
      });
    });
  });
});
