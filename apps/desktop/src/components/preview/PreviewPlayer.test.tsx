import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PreviewPlayer } from './PreviewPlayer';

// Mock Tauri API
vi.mock('@tauri-apps/api/core', () => ({
  convertFileSrc: (path: string) => `asset://localhost/${encodeURIComponent(path)}`,
  invoke: vi.fn(),
}));

// Mock HTMLMediaElement methods (jsdom exposes it on window)
beforeEach(() => {
  window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
  window.HTMLMediaElement.prototype.pause = vi.fn();
});

describe('PreviewPlayer', () => {
  it('renders all controls (play, seek, volume, fullscreen)', () => {
    render(<PreviewPlayer filePath="/test/final.mp4" />);

    expect(screen.getByRole('button', { name: 'Play' })).toBeTruthy();
    expect(screen.getByRole('slider', { name: 'Barre de progression vidéo' })).toBeTruthy();
    expect(screen.getByRole('slider', { name: 'Volume' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Plein écran' })).toBeTruthy();
  });

  it('renders video element with correct source (non-Tauri env)', () => {
    const { container } = render(<PreviewPlayer filePath="/test/final.mp4" />);
    const video = container.querySelector('video');
    expect(video).toBeTruthy();
    expect(video?.getAttribute('src')).toBe('/test/final.mp4');
  });

  it('toggles play/pause button on click', () => {
    render(<PreviewPlayer filePath="/test/final.mp4" />);

    const playBtn = screen.getByRole('button', { name: 'Play' });
    fireEvent.click(playBtn);

    expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalled();
  });

  it('shows Pause button when video is playing', () => {
    const { container } = render(<PreviewPlayer filePath="/test/final.mp4" />);
    const video = container.querySelector('video')!;

    // Simulate play event
    fireEvent.play(video);

    expect(screen.getByRole('button', { name: 'Pause' })).toBeTruthy();
  });

  it('updates timecode on timeUpdate', () => {
    const { container } = render(<PreviewPlayer filePath="/test/final.mp4" />);
    const video = container.querySelector('video')!;

    // Simulate loaded metadata with duration
    Object.defineProperty(video, 'duration', { value: 120, writable: true });
    fireEvent.loadedMetadata(video);

    // Simulate time update
    Object.defineProperty(video, 'currentTime', { value: 65, writable: true });
    fireEvent.timeUpdate(video);

    expect(screen.getByText('01:05 / 02:00')).toBeTruthy();
  });

  it('Space key toggles play/pause', () => {
    render(<PreviewPlayer filePath="/test/final.mp4" />);

    fireEvent.keyDown(window, { key: ' ' });
    expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalled();
  });

  it('ArrowRight key seeks forward 5s', () => {
    const { container } = render(<PreviewPlayer filePath="/test/final.mp4" />);
    const video = container.querySelector('video')!;

    Object.defineProperty(video, 'duration', { value: 120, writable: true });
    Object.defineProperty(video, 'currentTime', { value: 10, writable: true, configurable: true });
    fireEvent.loadedMetadata(video);

    fireEvent.keyDown(window, { key: 'ArrowRight' });

    // currentTime should have been set to 15
    expect(video.currentTime).toBe(15);
  });

  it('displays formatted timecode correctly', () => {
    const { container } = render(<PreviewPlayer filePath="/test/final.mp4" />);
    const video = container.querySelector('video')!;

    Object.defineProperty(video, 'duration', { value: 3700, writable: true });
    fireEvent.loadedMetadata(video);

    Object.defineProperty(video, 'currentTime', { value: 0, writable: true });
    fireEvent.timeUpdate(video);

    // Duration should show as 01:01:40
    expect(screen.getByText('00:00 / 01:01:40')).toBeTruthy();
  });

  it('renders mute/unmute button and volume slider', () => {
    render(<PreviewPlayer filePath="/test/final.mp4" />);

    const muteBtn = screen.getByRole('button', { name: 'Couper le son' });
    expect(muteBtn).toBeTruthy();

    fireEvent.click(muteBtn);
    expect(screen.getByRole('button', { name: 'Rétablir le son' })).toBeTruthy();
  });

  it('has proper ARIA attributes on seek bar', () => {
    render(<PreviewPlayer filePath="/test/final.mp4" />);

    const seekBar = screen.getByRole('slider', { name: 'Barre de progression vidéo' });
    expect(seekBar.getAttribute('aria-valuemin')).toBe('0');
    expect(seekBar.getAttribute('aria-valuemax')).toBe('0');
    expect(seekBar.getAttribute('aria-valuenow')).toBe('0');
  });
});

describe('PreviewPlayer navigation', () => {
  it('renders without crashing', () => {
    const { container } = render(<PreviewPlayer filePath="/test/final.mp4" />);
    expect(container.querySelector('video')).toBeTruthy();
  });
});
