import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { VideoPlayer } from './VideoPlayer';
import { useVideoStore } from '../../stores/video-store';

// Mock Tauri API
vi.mock('@tauri-apps/api/core', () => ({
  convertFileSrc: (path: string) => `asset://localhost/${encodeURIComponent(path)}`,
  invoke: vi.fn(),
}));

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn().mockResolvedValue(() => {}),
}));

function resetStores() {
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

describe('VideoPlayer proxy support', () => {
  beforeEach(() => {
    resetStores();
  });

  it('should use proxyPath when available', () => {
    useVideoStore.setState({ proxyPath: '/proxy/test_proxy.mp4' });

    const { container } = render(
      <VideoPlayer filePath="/original/video.mp4" />
    );

    const video = container.querySelector('video');
    expect(video).toBeTruthy();
    // In test env (no __TAURI_INTERNALS__), the raw path is used as src
    expect(video?.getAttribute('src')).toBe('/proxy/test_proxy.mp4');
  });

  it('should fallback to filePath when proxyPath is null', () => {
    useVideoStore.setState({ proxyPath: null });

    const { container } = render(
      <VideoPlayer filePath="/original/video.mp4" />
    );

    const video = container.querySelector('video');
    expect(video).toBeTruthy();
    expect(video?.getAttribute('src')).toBe('/original/video.mp4');
  });

  it('should expose a timeline anchor target for skip links', () => {
    const { container } = render(
      <VideoPlayer filePath="/original/video.mp4" />
    );

    const scrubber = container.querySelector('#timeline[role="slider"]');
    expect(scrubber).toBeTruthy();
  });
});
