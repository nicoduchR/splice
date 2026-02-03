/**
 * Format a file size in bytes to a human-readable string.
 * @param bytes - Size in bytes
 * @returns Formatted string (e.g., "385 MB", "2.5 GB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(0)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

/**
 * Format a duration in seconds to MM:SS or HH:MM:SS format.
 * @param seconds - Duration in seconds
 * @returns Formatted string (e.g., "12:45", "2:15:30")
 */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Format a duration in seconds for estimated time display.
 * @param seconds - Duration in seconds
 * @returns Formatted string (e.g., "~30 secondes", "~5 minutes")
 */
export function formatEstimatedDuration(seconds: number): string {
  if (seconds < 60) return `~${Math.ceil(seconds)} secondes`;
  const mins = Math.ceil(seconds / 60);
  return `~${mins} minute${mins > 1 ? 's' : ''}`;
}

/**
 * Detect the current operating system.
 * @returns 'macos' | 'windows' | 'linux'
 */
export function detectOS(): 'macos' | 'windows' | 'linux' {
  const platform = navigator.platform.toLowerCase();
  if (platform.includes('mac')) return 'macos';
  if (platform.includes('win')) return 'windows';
  return 'linux';
}

/**
 * Get the localized name for the file browser based on OS.
 * @returns "Finder" for macOS, "Explorateur" for Windows, "Fichiers" for Linux
 */
export function getFileBrowserName(): string {
  const os = detectOS();
  switch (os) {
    case 'macos':
      return 'Finder';
    case 'windows':
      return 'Explorateur';
    default:
      return 'Fichiers';
  }
}
