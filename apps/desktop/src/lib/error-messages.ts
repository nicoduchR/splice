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
