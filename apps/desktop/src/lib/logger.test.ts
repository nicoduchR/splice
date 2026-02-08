import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logError, logWarn, logInfo } from './logger';

// Mock Tauri invoke
const mockInvoke = vi.fn().mockResolvedValue(undefined);
vi.mock('@tauri-apps/api/core', () => ({
  invoke: (...args: unknown[]) => mockInvoke(...args),
}));

describe('logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('logError calls Tauri command with error level', () => {
    logError('TestContext', new Error('test error'));
    expect(mockInvoke).toHaveBeenCalledWith('log_frontend_error', {
      level: 'error',
      context: 'TestContext',
      message: expect.stringContaining('test error'),
    });
  });

  it('logError handles string errors', () => {
    logError('TestContext', 'simple string error');
    expect(mockInvoke).toHaveBeenCalledWith('log_frontend_error', {
      level: 'error',
      context: 'TestContext',
      message: 'simple string error',
    });
  });

  it('logError includes stack trace in message', () => {
    const err = new Error('with stack');
    logError('Ctx', err);
    expect(mockInvoke).toHaveBeenCalledWith('log_frontend_error', {
      level: 'error',
      context: 'Ctx',
      message: expect.stringContaining('with stack'),
    });
  });

  it('logWarn calls Tauri command with warn level', () => {
    logWarn('WarnCtx', 'warning message');
    expect(mockInvoke).toHaveBeenCalledWith('log_frontend_error', {
      level: 'warn',
      context: 'WarnCtx',
      message: 'warning message',
    });
  });

  it('logInfo calls Tauri command with info level', () => {
    logInfo('InfoCtx', 'info message');
    expect(mockInvoke).toHaveBeenCalledWith('log_frontend_error', {
      level: 'info',
      context: 'InfoCtx',
      message: 'info message',
    });
  });

  it('does not throw when Tauri is unavailable', () => {
    mockInvoke.mockRejectedValueOnce(new Error('Tauri not available'));
    expect(() => logError('Ctx', 'error')).not.toThrow();
  });
});
