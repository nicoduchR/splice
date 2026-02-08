import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { UpdateController } from './update.controller';
import { GetLatestReleaseUseCase, GetLatestReleaseResult } from '@application/use-cases/get-latest-release.use-case';
import { ThrottlerModule } from '@nestjs/throttler';
import { ErrorCodes } from '@shared/errors/error-codes';
import { CrashReportDto } from '@application/dto/crash-report.dto';

describe('UpdateController', () => {
  let controller: UpdateController;
  let mockGetLatestReleaseUseCase: jest.Mocked<GetLatestReleaseUseCase>;

  // Create a mock Express response
  function createMockResponse() {
    const res: Record<string, jest.Mock> = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    return res;
  }

  beforeEach(async () => {
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});

    mockGetLatestReleaseUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetLatestReleaseUseCase>;

    const module: TestingModule = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }])],
      controllers: [UpdateController],
      providers: [
        { provide: GetLatestReleaseUseCase, useValue: mockGetLatestReleaseUseCase },
      ],
    }).compile();

    controller = module.get<UpdateController>(UpdateController);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /updates/latest', () => {
    const validDto = { platform: 'darwin-aarch64' as const, version: '1.0.0' };

    it('should return 200 with update manifest when update available', async () => {
      const res = createMockResponse();
      const result: GetLatestReleaseResult = {
        hasUpdate: true,
        update: {
          version: '1.1.0',
          notes: 'Bug fixes',
          pub_date: '2026-01-15T00:00:00.000Z',
          url: 'https://updates.splice.app/v1.1.0/Splice.tar.gz',
          signature: 'sig-123',
          isMandatory: false,
        },
      };
      mockGetLatestReleaseUseCase.execute.mockResolvedValue(result);

      await controller.checkForUpdate(validDto, res as any);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        version: '1.1.0',
        notes: 'Bug fixes',
        pub_date: '2026-01-15T00:00:00.000Z',
        url: 'https://updates.splice.app/v1.1.0/Splice.tar.gz',
        signature: 'sig-123',
      });
    });

    it('should return 204 No Content when no update available', async () => {
      const res = createMockResponse();
      const result: GetLatestReleaseResult = {
        hasUpdate: false,
        update: null,
      };
      mockGetLatestReleaseUseCase.execute.mockResolvedValue(result);

      await controller.checkForUpdate(validDto, res as any);

      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    it('should return 400 for invalid version', async () => {
      const res = createMockResponse();
      const result: GetLatestReleaseResult = {
        hasUpdate: false,
        update: null,
        error: { code: ErrorCodes.UPDATE_VERSION_INVALID, message: 'Invalid version format' },
      };
      mockGetLatestReleaseUseCase.execute.mockResolvedValue(result);

      await controller.checkForUpdate({ platform: 'darwin-aarch64', version: 'bad' }, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: { code: ErrorCodes.UPDATE_VERSION_INVALID, message: 'Invalid version format' },
      });
    });

    it('should call use case with correct parameters', async () => {
      const res = createMockResponse();
      mockGetLatestReleaseUseCase.execute.mockResolvedValue({ hasUpdate: false, update: null });

      await controller.checkForUpdate({ platform: 'windows-x86_64', version: '2.0.0' }, res as any);

      expect(mockGetLatestReleaseUseCase.execute).toHaveBeenCalledWith('windows-x86_64', '2.0.0');
    });

    it('should not include isMandatory in tauri manifest response', async () => {
      const res = createMockResponse();
      mockGetLatestReleaseUseCase.execute.mockResolvedValue({
        hasUpdate: true,
        update: {
          version: '1.1.0',
          notes: 'Update',
          pub_date: '2026-01-15T00:00:00.000Z',
          url: 'https://example.com/update',
          signature: 'sig',
          isMandatory: true,
        },
      });

      await controller.checkForUpdate(validDto, res as any);

      // The manifest should only have tauri-compatible fields (no isMandatory)
      const jsonCall = res.json.mock.calls[0][0];
      expect(jsonCall).not.toHaveProperty('isMandatory');
      expect(jsonCall).toHaveProperty('version', '1.1.0');
      expect(jsonCall).toHaveProperty('signature', 'sig');
    });

    it('should handle platform-specific queries', async () => {
      const res = createMockResponse();
      mockGetLatestReleaseUseCase.execute.mockResolvedValue({
        hasUpdate: false,
        update: null,
        error: { code: ErrorCodes.UPDATE_PLATFORM_NOT_SUPPORTED, message: 'Platform not supported' },
      });

      await controller.checkForUpdate({ platform: 'linux-x86_64' as any, version: '1.0.0' }, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('POST /updates/crashes/report', () => {
    const validCrashReport: CrashReportDto = {
      version: '1.1.0',
      platform: 'darwin-aarch64',
      crash_count: 3,
      previous_version: '1.0.0',
    };

    it('should return success for valid crash report', async () => {
      const result = await controller.submitCrashReport(validCrashReport);

      expect(result).toEqual({ success: true });
    });

    it('should accept crash report with error log', async () => {
      const reportWithLog: CrashReportDto = {
        ...validCrashReport,
        error_log: 'Line 1: Error at startup\nLine 2: Panic in thread main',
      };

      const result = await controller.submitCrashReport(reportWithLog);

      expect(result).toEqual({ success: true });
    });

    it('should accept crash report without error log', async () => {
      const reportNoLog: CrashReportDto = {
        version: '2.0.0',
        platform: 'windows-x86_64',
        crash_count: 5,
        previous_version: '1.9.0',
      };

      const result = await controller.submitCrashReport(reportNoLog);

      expect(result).toEqual({ success: true });
    });

    it('should log crash report details', async () => {
      const logSpy = jest.spyOn(Logger.prototype, 'log');

      await controller.submitCrashReport(validCrashReport);

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('v1.1.0'),
      );
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('darwin-aarch64'),
      );
    });
  });
});
