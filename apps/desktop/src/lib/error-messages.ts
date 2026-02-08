export function getImportErrorMessage(error: string): string {
  if (error.includes('FILE_NOT_FOUND') || error.includes('FileNotFound')) {
    return 'Fichier introuvable. Vérifiez que le fichier existe encore.';
  }

  if (error.includes('UNSUPPORTED_FORMAT') || error.includes('UnsupportedFormat')) {
    return 'Format non supporté. Splice accepte uniquement MP4, MOV et AVI avec codec H.264 ou H.265.';
  }

  if (error.includes('VIDEO_TOO_LARGE') || error.includes('VideoTooLarge')) {
    return 'Fichier trop volumineux. Limite: 50GB.';
  }

  // Story 1.5: New error mappings for codec validation
  if (error.includes('UNSUPPORTED_CODEC') || error.includes('UnsupportedVideoCodec')) {
    // Try to extract codec name from error
    const codecMatch = error.match(/codec:\s*"([^"]+)"/);
    const codec = codecMatch ? codecMatch[1].toUpperCase() : 'inconnu';
    return `Ce fichier utilise un codec non supporté (${codec}). Veuillez convertir en H.264 ou H.265.`;
  }

  if (error.includes('VIDEO_CORRUPTED') || error.includes('VideoCorrupted')) {
    return 'Ce fichier vidéo semble corrompu. Impossible de le lire.';
  }

  if (error.includes('FFMPEG_NOT_AVAILABLE') || error.includes('FfmpegNotAvailable')) {
    return 'Erreur système: FFmpeg introuvable. Veuillez réinstaller l\'application.';
  }

  return 'Impossible d\'importer la vidéo. Réessayez.';
}

/**
 * Story 9.1 AC #5: Sanitize network error messages for user display.
 * Ensures no stack traces or technical details leak to the UI (NFR30).
 * All messages returned are in French (NFR29).
 */
export function getNetworkErrorMessage(error: string): string {
  const lower = error.toLowerCase();

  // Connection / network errors
  if (
    lower.includes('network') ||
    lower.includes('connexion') ||
    lower.includes('connection') ||
    lower.includes('err_internet') ||
    lower.includes('net::err_')
  ) {
    return 'Erreur de connexion. Vérifiez votre connexion internet.';
  }

  // Timeout errors
  if (lower.includes('timeout') || lower.includes('timed out')) {
    return 'La connexion a expiré. Réessayez ultérieurement.';
  }

  // Server errors (5xx)
  if (lower.includes('server error') || lower.includes('500') || lower.includes('502') || lower.includes('503')) {
    return 'Le serveur est temporairement indisponible. Réessayez ultérieurement.';
  }

  // DNS resolution
  if (lower.includes('dns') || lower.includes('resolve') || lower.includes('host')) {
    return 'Impossible de joindre le serveur. Vérifiez votre connexion internet.';
  }

  // SSL/TLS errors
  if (lower.includes('ssl') || lower.includes('tls') || lower.includes('certificate')) {
    return 'Erreur de sécurité de la connexion. Réessayez ultérieurement.';
  }

  // Generic fallback — no technical details exposed
  return 'Une erreur réseau est survenue. Vérifiez votre connexion internet.';
}
