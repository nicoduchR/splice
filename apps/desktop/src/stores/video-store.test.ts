import { describe, it, expect, beforeEach } from 'vitest';
import { useVideoStore } from './video-store';

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
