import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useModelDownload } from './use-model-download';
import { ModelService } from '@/services/model-service';

// Mock ModelService
vi.mock('@/services/model-service', () => ({
  ModelService: {
    checkModelStatus: vi.fn(),
    downloadParakeetModel: vi.fn(),
    cancelDownload: vi.fn(),
  },
}));

describe('useModelDownload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should start checking model status on mount', () => {
    renderHook(() => useModelDownload());
    expect(ModelService.checkModelStatus).toHaveBeenCalledTimes(1);
  });

  it('should set isReady to true when model is ready', async () => {
    vi.mocked(ModelService.checkModelStatus).mockResolvedValue({
      name: 'parakeet-tdt-0.6b-v3',
      version: 'v3',
      status: 'ready',
      total_size_bytes: 670_000_000,
      downloaded_at: Date.now(),
    });

    const { result } = renderHook(() => useModelDownload());

    await waitFor(() => {
      expect(result.current.isReady).toBe(true);
      expect(result.current.showDialog).toBe(false);
      expect(result.current.isChecking).toBe(false);
    });
  });

  it('should show dialog when model is missing', async () => {
    vi.mocked(ModelService.checkModelStatus).mockResolvedValue({
      name: 'parakeet-tdt-0.6b-v3',
      version: 'v3',
      status: 'missing',
      total_size_bytes: 670_000_000,
    });

    vi.mocked(ModelService.downloadParakeetModel).mockResolvedValue({
      name: 'parakeet-tdt-0.6b-v3',
      version: 'v3',
      status: 'downloading',
      total_size_bytes: 670_000_000,
    });

    const { result } = renderHook(() => useModelDownload());

    await waitFor(() => {
      expect(result.current.showDialog).toBe(true);
      expect(result.current.isReady).toBe(false);
      expect(ModelService.downloadParakeetModel).toHaveBeenCalled();
    });
  });

  it('should handle download errors', async () => {
    vi.mocked(ModelService.checkModelStatus).mockResolvedValue({
      name: 'parakeet-tdt-0.6b-v3',
      version: 'v3',
      status: 'missing',
      total_size_bytes: 670_000_000,
    });

    const errorMessage = 'Network error';
    vi.mocked(ModelService.downloadParakeetModel).mockRejectedValue(
      new Error(errorMessage)
    );

    const { result } = renderHook(() => useModelDownload());

    await waitFor(() => {
      expect(result.current.error).toBe(errorMessage);
      expect(result.current.isReady).toBe(false);
    });
  });

  it('should cancel download when cancelDownload is called', async () => {
    vi.mocked(ModelService.checkModelStatus).mockResolvedValue({
      name: 'parakeet-tdt-0.6b-v3',
      version: 'v3',
      status: 'downloading',
      total_size_bytes: 670_000_000,
    });

    const { result } = renderHook(() => useModelDownload());

    await waitFor(() => {
      expect(result.current.showDialog).toBe(true);
    });

    await result.current.cancelDownload();

    expect(ModelService.cancelDownload).toHaveBeenCalled();
    expect(result.current.showDialog).toBe(false);
  });

  it('should retry download when retryDownload is called', async () => {
    vi.mocked(ModelService.checkModelStatus).mockResolvedValue({
      name: 'parakeet-tdt-0.6b-v3',
      version: 'v3',
      status: 'missing',
      total_size_bytes: 670_000_000,
    });

    vi.mocked(ModelService.downloadParakeetModel).mockRejectedValueOnce(
      new Error('Network error')
    );

    const { result } = renderHook(() => useModelDownload());

    // Wait for initial error
    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    // Mock successful retry
    vi.mocked(ModelService.downloadParakeetModel).mockResolvedValueOnce({
      name: 'parakeet-tdt-0.6b-v3',
      version: 'v3',
      status: 'ready',
      total_size_bytes: 670_000_000,
      downloaded_at: Date.now(),
    });

    await result.current.retryDownload();

    await waitFor(() => {
      expect(result.current.error).toBeNull();
      expect(result.current.isReady).toBe(true);
    });
  });
});
