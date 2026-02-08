import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useModelDownload } from './use-model-download';
import { ModelService } from '@/services/model-service';
import { listen } from '@tauri-apps/api/event';

// Mock ModelService
vi.mock('@/services/model-service', () => ({
  ModelService: {
    checkModelStatus: vi.fn(),
    downloadParakeetModel: vi.fn(),
    cancelDownload: vi.fn(),
  },
}));

// Mock Tauri event API
vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(() => Promise.resolve(() => {})),
}));

describe('useModelDownload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock Tauri context so hook detects it's running in Tauri
    (window as any).__TAURI_INTERNALS__ = {};
  });

  afterEach(() => {
    delete (window as any).__TAURI_INTERNALS__;
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

  it('should handle download errors with sanitized French message (AC #5)', async () => {
    vi.mocked(ModelService.checkModelStatus).mockResolvedValue({
      name: 'parakeet-tdt-0.6b-v3',
      version: 'v3',
      status: 'missing',
      total_size_bytes: 670_000_000,
    });

    vi.mocked(ModelService.downloadParakeetModel).mockRejectedValue(
      new Error('Network error: ECONNREFUSED')
    );

    const { result } = renderHook(() => useModelDownload());

    await waitFor(() => {
      // getNetworkErrorMessage sanitizes to French, no stack traces (NFR29, NFR30)
      expect(result.current.error).toBe('Erreur de connexion. Vérifiez votre connexion internet.');
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

    await act(async () => {
      await result.current.cancelDownload();
    });

    expect(ModelService.cancelDownload).toHaveBeenCalled();
    await waitFor(() => {
      expect(result.current.showDialog).toBe(false);
    });
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

  it('should handle model:download-failed event and show dialog', async () => {
    // Capture the event callback registered by the hook
    let modelDownloadFailedCallback: ((event: { payload: { message: string } }) => void) | null = null;

    vi.mocked(listen).mockImplementation(async (eventName: string, callback: any) => {
      if (eventName === 'model:download-failed') {
        modelDownloadFailedCallback = callback;
      }
      return () => {};
    });

    vi.mocked(ModelService.checkModelStatus).mockResolvedValue({
      name: 'parakeet-coreml',
      version: 'v1',
      status: 'ready',
      total_size_bytes: 0,
      downloaded_at: 0,
    });

    const { result } = renderHook(() => useModelDownload());

    // Wait for initial check to complete
    await waitFor(() => {
      expect(result.current.isChecking).toBe(false);
      expect(result.current.isReady).toBe(true);
    });

    // Simulate model:download-failed event from backend
    expect(modelDownloadFailedCallback).not.toBeNull();

    act(() => {
      modelDownloadFailedCallback!({
        payload: { message: 'Échec du téléchargement. Vérifiez votre connexion.' },
      });
    });

    // Verify dialog is shown with error
    expect(result.current.error).toBe('Échec du téléchargement. Vérifiez votre connexion.');
    expect(result.current.showDialog).toBe(true);
    expect(result.current.isReady).toBe(false);
  });

  it('should register listener for model:download-failed event', async () => {
    vi.mocked(ModelService.checkModelStatus).mockResolvedValue({
      name: 'parakeet-coreml',
      version: 'v1',
      status: 'ready',
      total_size_bytes: 0,
      downloaded_at: 0,
    });

    renderHook(() => useModelDownload());

    await waitFor(() => {
      expect(listen).toHaveBeenCalledWith('model:download-failed', expect.any(Function));
    });
  });
});
