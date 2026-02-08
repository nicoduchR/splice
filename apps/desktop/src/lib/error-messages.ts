export interface ErrorGuidance {
  title: string;
  description: string;
  suggestedActions: string[];
  severity: 'warning' | 'error';
  retryable: boolean;
}

/**
 * Story 9.3 AC #3: Remove stack traces, file paths, and internal technical details
 * from error messages before displaying to the user (NFR30).
 */
export function sanitizeErrorForUser(error: string): string {
  let sanitized = error;

  // Remove stack trace lines (e.g. "    at Object.<anonymous> (/path:line:col)")
  sanitized = sanitized.replace(/\s+at\s+.+\(.+\)/g, '');
  sanitized = sanitized.replace(/\s+at\s+\S+:\d+:\d+/g, '');

  // Remove absolute file paths (Unix and Windows)
  sanitized = sanitized.replace(/\/[\w\-./]+\.\w+:\d+/g, '');
  sanitized = sanitized.replace(/[A-Z]:\\[\w\-\\./]+\.\w+:\d+/g, '');
  sanitized = sanitized.replace(/\/Users\/\S+/g, '');
  sanitized = sanitized.replace(/\/home\/\S+/g, '');
  sanitized = sanitized.replace(/C:\\Users\\\S+/g, '');

  // Remove Rust panic messages
  sanitized = sanitized.replace(/thread\s+'[^']*'\s+panicked\s+at\s+'[^']*'/g, '');
  sanitized = sanitized.replace(/called\s+`Result::unwrap\(\)`\s+on\s+an\s+`Err`\s+value/g, '');

  // Remove Rust library internals (reqwest, serde, etc.)
  sanitized = sanitized.replace(/reqwest::\w+\s*\{[^}]*\}/g, '');
  sanitized = sanitized.replace(/serde_json::\w+\s*\{[^}]*\}/g, '');

  // Clean up whitespace
  sanitized = sanitized.replace(/\n\s*\n/g, '\n').trim();

  // If everything was removed, return a fallback
  if (!sanitized || sanitized.length < 3) {
    return 'Une erreur est survenue.';
  }

  return sanitized;
}

/**
 * Story 9.3 AC #1, #2: Returns structured error guidance with French messages,
 * suggested actions, severity, and retryable flag for all error categories.
 */
export function getErrorWithGuidance(error: string): ErrorGuidance {
  const lower = error.toLowerCase();

  // --- Import video errors ---
  if (lower.includes('file_not_found') || lower.includes('filenotfound')) {
    return {
      title: 'Fichier introuvable',
      description: 'Le fichier vidéo est introuvable. Il a peut-être été déplacé ou supprimé.',
      suggestedActions: [
        'Vérifiez que le fichier existe toujours à son emplacement d\'origine.',
        'Réimportez la vidéo si elle a été déplacée.',
      ],
      severity: 'error',
      retryable: false,
    };
  }

  if (lower.includes('unsupported_format') || lower.includes('unsupportedformat')) {
    return {
      title: 'Format non supporté',
      description: 'Ce format vidéo n\'est pas pris en charge par Splice.',
      suggestedActions: [
        'Convertissez votre vidéo en MP4 (H.264) avant de l\'importer.',
        'Les formats acceptés sont : MP4, MOV et AVI avec codec H.264 ou H.265.',
      ],
      severity: 'error',
      retryable: false,
    };
  }

  if (lower.includes('video_too_large') || lower.includes('videotoolarge')) {
    return {
      title: 'Fichier trop volumineux',
      description: 'La taille du fichier dépasse la limite autorisée.',
      suggestedActions: [
        'Choisissez une vidéo de moins de 50GB.',
        'Compressez la vidéo avant de l\'importer.',
      ],
      severity: 'error',
      retryable: false,
    };
  }

  if (lower.includes('unsupported_codec') || lower.includes('unsupportedvideocodec')) {
    return {
      title: 'Codec non supporté',
      description: 'Ce fichier utilise un codec vidéo non pris en charge.',
      suggestedActions: [
        'Convertissez la vidéo en H.264 ou H.265.',
        'Utilisez un logiciel comme HandBrake pour la conversion.',
      ],
      severity: 'error',
      retryable: false,
    };
  }

  if (lower.includes('video_corrupted') || lower.includes('videocorrupted')) {
    return {
      title: 'Fichier vidéo corrompu',
      description: 'Le fichier vidéo semble endommagé et ne peut pas être lu.',
      suggestedActions: [
        'Essayez de télécharger à nouveau le fichier vidéo.',
        'Vérifiez que le fichier se lit correctement dans un autre lecteur vidéo.',
      ],
      severity: 'error',
      retryable: false,
    };
  }

  if (lower.includes('ffmpeg_not_available') || lower.includes('ffmpegnotavailable')) {
    return {
      title: 'Composant système manquant',
      description: 'FFmpeg est introuvable. Ce composant est nécessaire au fonctionnement de Splice.',
      suggestedActions: [
        'Réinstallez l\'application pour restaurer les composants manquants.',
      ],
      severity: 'error',
      retryable: false,
    };
  }

  // --- Transcription errors ---
  if (lower.includes('modelnotavailable') || lower.includes('model_not_available') || lower.includes('model not found') || lower.includes('model not available')) {
    return {
      title: 'Modèle de transcription indisponible',
      description: 'Le modèle de transcription n\'a pas été trouvé sur votre appareil.',
      suggestedActions: [
        'Téléchargez le modèle dans les paramètres de l\'application.',
        'Vérifiez que le téléchargement du modèle s\'est terminé correctement.',
      ],
      severity: 'error',
      retryable: false,
    };
  }

  if (lower.includes('transcriptionfailed') || lower.includes('transcription_failed') || lower.includes('transcription error')) {
    return {
      title: 'Erreur de transcription',
      description: 'Une erreur est survenue pendant la transcription de la vidéo.',
      suggestedActions: [
        'Réessayez la transcription.',
        'Si le problème persiste, réimportez la vidéo.',
      ],
      severity: 'error',
      retryable: true,
    };
  }

  // --- Export errors ---
  if (lower.includes('no space left') || lower.includes('disk full') || lower.includes('not enough space') || lower.includes('espace insuffisant') || lower.includes('enospc')) {
    return {
      title: 'Espace disque insuffisant',
      description: 'Il n\'y a pas assez d\'espace disque pour terminer l\'opération.',
      suggestedActions: [
        'Libérez de l\'espace disque (au moins 5GB recommandés).',
        'Choisissez un emplacement de sauvegarde différent.',
      ],
      severity: 'error',
      retryable: true,
    };
  }

  if (lower.includes('being used') || lower.includes('in use') || lower.includes('access denied') || lower.includes('permission denied')) {
    return {
      title: 'Fichier en cours d\'utilisation',
      description: 'Le fichier est verrouillé par une autre application.',
      suggestedActions: [
        'Fermez les autres applications utilisant ce fichier.',
        'Réessayez après avoir fermé les applications concernées.',
      ],
      severity: 'warning',
      retryable: true,
    };
  }

  // --- Segmentation / cut errors ---
  if (lower.includes('segmentation') || lower.includes('segment') || lower.includes('cut_failed') || lower.includes('cutfailed')) {
    return {
      title: 'Erreur de découpe',
      description: 'Une erreur est survenue lors de la découpe de la vidéo.',
      suggestedActions: [
        'Vérifiez vos sélections et réessayez.',
        'Assurez-vous que la vidéo source est toujours disponible.',
      ],
      severity: 'error',
      retryable: true,
    };
  }

  // --- Network errors ---
  if (
    lower.includes('network') ||
    lower.includes('connexion') ||
    lower.includes('connection') ||
    lower.includes('timeout') ||
    lower.includes('timed out') ||
    lower.includes('err_internet') ||
    lower.includes('net::err_')
  ) {
    return {
      title: 'Erreur de connexion',
      description: 'Impossible de se connecter au serveur.',
      suggestedActions: [
        'Vérifiez votre connexion internet.',
        'Réessayez dans quelques instants.',
      ],
      severity: 'error',
      retryable: true,
    };
  }

  // --- Generic fallback ---
  return {
    title: 'Erreur inattendue',
    description: 'Une erreur inattendue s\'est produite.',
    suggestedActions: [
      'Redémarrez l\'application et réessayez.',
      'Si le problème persiste, utilisez « Copier les détails » et contactez le support.',
    ],
    severity: 'error',
    retryable: false,
  };
}

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

  if (error.toLowerCase().includes('no space left') || error.toLowerCase().includes('disk full') || error.toLowerCase().includes('enospc')) {
    return 'Espace disque insuffisant. Libérez de l\'espace et réessayez.';
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
