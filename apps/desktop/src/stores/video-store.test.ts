import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useVideoStore } from './video-store';

const mockInvoke = vi.fn();
vi.mock('@tauri-apps/api/core', () => ({
  invoke: (...args: unknown[]) => mockInvoke(...args),
}));

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn().mockResolvedValue(() => {}),
}));

vi.mock('../lib/logger', () => ({
  logWarn: vi.fn(),
  logError: vi.fn(),
}));

function resetStore() {
  useVideoStore.setState({
    currentProject: null,
    allProjects: [],
    isImporting: false,
    importProgress: 0,
    error: null,
    isDragOver: false,
    proxyPath: null,
    isGeneratingProxy: false,
    diskSpaceWarning: null,
  });
}

describe('video-store proxy state', () => {
  beforeEach(() => {
    resetStore();
  });

  it('proxyPath should be null by default', () => {
    const state = useVideoStore.getState();
    expect(state.proxyPath).toBeNull();
    expect(state.isGeneratingProxy).toBe(false);
  });

  it('setProxyPath should update proxyPath and clear isGeneratingProxy', () => {
    useVideoStore.setState({ isGeneratingProxy: true });
    useVideoStore.getState().setProxyPath('/path/to/proxy.mp4');

    const state = useVideoStore.getState();
    expect(state.proxyPath).toBe('/path/to/proxy.mp4');
    expect(state.isGeneratingProxy).toBe(false);
  });

  it('setProxyPath(null) should clear proxyPath', () => {
    useVideoStore.getState().setProxyPath('/path/to/proxy.mp4');
    useVideoStore.getState().setProxyPath(null);

    expect(useVideoStore.getState().proxyPath).toBeNull();
  });

  it('selectProject should load proxy_path from project', () => {
    const project = {
      id: 'test-id',
      file_path: '/video.mp4',
      file_name: 'video.mp4',
      duration_seconds: 120,
      created_at: 1000,
      updated_at: 1000,
      proxy_path: '/proxy/test-id_proxy.mp4',
    };

    useVideoStore.setState({ allProjects: [project] });
    useVideoStore.getState().selectProject('test-id');

    const state = useVideoStore.getState();
    expect(state.proxyPath).toBe('/proxy/test-id_proxy.mp4');
    expect(state.isGeneratingProxy).toBe(false);
  });

  it('selectProject without proxy_path should set proxyPath to null', () => {
    const project = {
      id: 'test-id',
      file_path: '/video.mp4',
      file_name: 'video.mp4',
      duration_seconds: 120,
      created_at: 1000,
      updated_at: 1000,
    };

    useVideoStore.setState({ allProjects: [project] });
    useVideoStore.getState().selectProject('test-id');

    expect(useVideoStore.getState().proxyPath).toBeNull();
  });

  it('clearProject should reset proxyPath and isGeneratingProxy', () => {
    useVideoStore.setState({
      proxyPath: '/proxy.mp4',
      isGeneratingProxy: true,
    });

    useVideoStore.getState().clearProject();

    const state = useVideoStore.getState();
    expect(state.currentProject).toBeNull();
    expect(state.proxyPath).toBeNull();
    expect(state.isGeneratingProxy).toBe(false);
  });
});

describe('video-store disk space check', () => {
  beforeEach(() => {
    resetStore();
    mockInvoke.mockReset();
  });

  it('diskSpaceWarning should be null by default', () => {
    expect(useVideoStore.getState().diskSpaceWarning).toBeNull();
  });

  it('importVideo should show disk space warning when space insufficient', async () => {
    mockInvoke.mockImplementation((cmd: string) => {
      if (cmd === 'check_disk_space_for_import') {
        return Promise.resolve({
          available_gb: 2.0,
          required_gb: 6.0,
          sufficient: false,
        });
      }
      return Promise.resolve(null);
    });

    await useVideoStore.getState().importVideo('/path/to/video.mp4');

    const state = useVideoStore.getState();
    expect(state.diskSpaceWarning).not.toBeNull();
    expect(state.diskSpaceWarning!.availableGb).toBe(2.0);
    expect(state.diskSpaceWarning!.requiredGb).toBe(6.0);
    expect(state.diskSpaceWarning!.filePath).toBe('/path/to/video.mp4');
    expect(state.isImporting).toBe(false);
  });

  it('importVideo should proceed when space sufficient', async () => {
    const mockProject = {
      id: 'p1',
      file_path: '/path/to/video.mp4',
      file_name: 'video.mp4',
      duration_seconds: 60,
      created_at: 1000,
      updated_at: 1000,
    };

    mockInvoke.mockImplementation((cmd: string) => {
      if (cmd === 'check_disk_space_for_import') {
        return Promise.resolve({
          available_gb: 20.0,
          required_gb: 6.0,
          sufficient: true,
        });
      }
      if (cmd === 'import_video') {
        return Promise.resolve(mockProject);
      }
      return Promise.resolve(null);
    });

    await useVideoStore.getState().importVideo('/path/to/video.mp4');

    const state = useVideoStore.getState();
    expect(state.diskSpaceWarning).toBeNull();
    expect(state.currentProject).toEqual(mockProject);
    expect(state.isImporting).toBe(false);
  });

  it('importVideo should proceed if disk check fails', async () => {
    const mockProject = {
      id: 'p1',
      file_path: '/path/to/video.mp4',
      file_name: 'video.mp4',
      duration_seconds: 60,
      created_at: 1000,
      updated_at: 1000,
    };

    mockInvoke.mockImplementation((cmd: string) => {
      if (cmd === 'check_disk_space_for_import') {
        return Promise.reject(new Error('Disk check unavailable'));
      }
      if (cmd === 'import_video') {
        return Promise.resolve(mockProject);
      }
      return Promise.resolve(null);
    });

    await useVideoStore.getState().importVideo('/path/to/video.mp4');

    const state = useVideoStore.getState();
    expect(state.diskSpaceWarning).toBeNull();
    expect(state.currentProject).toEqual(mockProject);
  });

  it('dismissDiskSpaceWarning should clear the warning', () => {
    useVideoStore.setState({
      diskSpaceWarning: {
        availableGb: 2.0,
        requiredGb: 6.0,
        filePath: '/path/to/video.mp4',
      },
    });

    useVideoStore.getState().dismissDiskSpaceWarning();

    expect(useVideoStore.getState().diskSpaceWarning).toBeNull();
  });

  it('continueDespiteWarning should clear warning and start import', async () => {
    const mockProject = {
      id: 'p1',
      file_path: '/path/to/video.mp4',
      file_name: 'video.mp4',
      duration_seconds: 60,
      created_at: 1000,
      updated_at: 1000,
    };

    mockInvoke.mockImplementation((cmd: string) => {
      if (cmd === 'import_video') {
        return Promise.resolve(mockProject);
      }
      return Promise.resolve(null);
    });

    useVideoStore.setState({
      diskSpaceWarning: {
        availableGb: 2.0,
        requiredGb: 6.0,
        filePath: '/path/to/video.mp4',
      },
    });

    useVideoStore.getState().continueDespiteWarning();

    // Warning should be cleared immediately
    expect(useVideoStore.getState().diskSpaceWarning).toBeNull();
    expect(useVideoStore.getState().isImporting).toBe(true);

    // Wait for import to finish
    await new Promise(r => setTimeout(r, 50));

    const state = useVideoStore.getState();
    expect(state.currentProject).toEqual(mockProject);
    expect(state.isImporting).toBe(false);
  });
});
