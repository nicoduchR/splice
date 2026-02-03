import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatFileSize,
  formatDuration,
  formatEstimatedDuration,
  detectOS,
  getFileBrowserName,
} from './format-utils';

describe('formatFileSize', () => {
  it('formats bytes to KB', () => {
    expect(formatFileSize(512 * 1024)).toBe('512 KB');
  });

  it('formats bytes to MB', () => {
    expect(formatFileSize(385 * 1024 * 1024)).toBe('385 MB');
  });

  it('formats bytes to GB with decimal', () => {
    expect(formatFileSize(2.5 * 1024 ** 3)).toBe('2.5 GB');
  });

  it('formats small files correctly', () => {
    expect(formatFileSize(1024)).toBe('1 KB');
  });
});

describe('formatDuration', () => {
  it('formats seconds to MM:SS', () => {
    expect(formatDuration(12 * 60 + 45)).toBe('12:45');
  });

  it('formats longer durations to HH:MM:SS', () => {
    expect(formatDuration(2 * 3600 + 15 * 60 + 30)).toBe('2:15:30');
  });

  it('pads minutes and seconds with zeros', () => {
    expect(formatDuration(65)).toBe('1:05');
  });

  it('handles zero seconds', () => {
    expect(formatDuration(0)).toBe('0:00');
  });

  it('handles exactly one hour', () => {
    expect(formatDuration(3600)).toBe('1:00:00');
  });
});

describe('formatEstimatedDuration', () => {
  it('formats short durations in seconds', () => {
    expect(formatEstimatedDuration(30)).toBe('~30 secondes');
  });

  it('formats durations in minutes', () => {
    expect(formatEstimatedDuration(120)).toBe('~2 minutes');
  });

  it('uses singular minute', () => {
    expect(formatEstimatedDuration(60)).toBe('~1 minute');
  });

  it('rounds up seconds', () => {
    expect(formatEstimatedDuration(45)).toBe('~45 secondes');
  });
});

describe('detectOS', () => {
  const originalPlatform = navigator.platform;

  afterEach(() => {
    Object.defineProperty(navigator, 'platform', {
      value: originalPlatform,
      configurable: true,
    });
  });

  it('detects macOS', () => {
    Object.defineProperty(navigator, 'platform', {
      value: 'MacIntel',
      configurable: true,
    });
    expect(detectOS()).toBe('macos');
  });

  it('detects Windows', () => {
    Object.defineProperty(navigator, 'platform', {
      value: 'Win32',
      configurable: true,
    });
    expect(detectOS()).toBe('windows');
  });

  it('defaults to linux', () => {
    Object.defineProperty(navigator, 'platform', {
      value: 'Linux x86_64',
      configurable: true,
    });
    expect(detectOS()).toBe('linux');
  });
});

describe('getFileBrowserName', () => {
  const originalPlatform = navigator.platform;

  afterEach(() => {
    Object.defineProperty(navigator, 'platform', {
      value: originalPlatform,
      configurable: true,
    });
  });

  it('returns Finder for macOS', () => {
    Object.defineProperty(navigator, 'platform', {
      value: 'MacIntel',
      configurable: true,
    });
    expect(getFileBrowserName()).toBe('Finder');
  });

  it('returns Explorateur for Windows', () => {
    Object.defineProperty(navigator, 'platform', {
      value: 'Win32',
      configurable: true,
    });
    expect(getFileBrowserName()).toBe('Explorateur');
  });

  it('returns Fichiers for Linux', () => {
    Object.defineProperty(navigator, 'platform', {
      value: 'Linux',
      configurable: true,
    });
    expect(getFileBrowserName()).toBe('Fichiers');
  });
});
