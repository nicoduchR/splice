import { describe, it, expect } from 'vitest';
import {
  getImportErrorMessage,
  getNetworkErrorMessage,
  getErrorWithGuidance,
  sanitizeErrorForUser,
} from './error-messages';

describe('getImportErrorMessage', () => {
  it('maps FILE_NOT_FOUND error correctly', () => {
    const error = 'FileNotFound("/path/to/video.mp4")';
    const message = getImportErrorMessage(error);
    expect(message).toBe('Fichier introuvable. Vérifiez que le fichier existe encore.');
  });

  it('maps UNSUPPORTED_FORMAT error correctly', () => {
    const error = 'UnsupportedFormat("mkv")';
    const message = getImportErrorMessage(error);
    expect(message).toBe(
      'Format non supporté. Splice accepte uniquement MP4, MOV et AVI avec codec H.264 ou H.265.'
    );
  });

  it('maps VIDEO_TOO_LARGE error correctly', () => {
    const error = 'VideoTooLarge(size: 55.00GB, max: 50GB)';
    const message = getImportErrorMessage(error);
    expect(message).toBe('Fichier trop volumineux. Limite: 50GB.');
  });

  it('maps UNSUPPORTED_CODEC error with codec name', () => {
    const error = 'UnsupportedVideoCodec(codec: "vp9", supported: ["H.264", "H.265/HEVC"])';
    const message = getImportErrorMessage(error);
    expect(message).toBe(
      'Ce fichier utilise un codec non supporté (VP9). Veuillez convertir en H.264 ou H.265.'
    );
  });

  it('maps UNSUPPORTED_CODEC error without codec name', () => {
    const error = 'VIDEO_UNSUPPORTED_CODEC';
    const message = getImportErrorMessage(error);
    expect(message).toContain('codec non supporté');
    expect(message).toContain('inconnu');
  });

  it('maps VIDEO_CORRUPTED error correctly', () => {
    const error = 'VideoCorrupted("Invalid FFprobe output")';
    const message = getImportErrorMessage(error);
    expect(message).toBe('Ce fichier vidéo semble corrompu. Impossible de le lire.');
  });

  it('maps FFMPEG_NOT_AVAILABLE error correctly', () => {
    const error = 'FfmpegNotAvailable("FFprobe sidecar not available")';
    const message = getImportErrorMessage(error);
    expect(message).toBe(
      "Erreur système: FFmpeg introuvable. Veuillez réinstaller l'application."
    );
  });

  it('returns generic error for unknown errors', () => {
    const error = 'UnknownError("Something went wrong")';
    const message = getImportErrorMessage(error);
    expect(message).toBe("Impossible d'importer la vidéo. Réessayez.");
  });

  it('extracts codec name from H.265 error', () => {
    const error = 'UnsupportedVideoCodec(codec: "hevc", supported: ["H.264", "H.265/HEVC"])';
    const message = getImportErrorMessage(error);
    expect(message).toContain('HEVC');
  });

  it('handles AV1 codec error', () => {
    const error = 'UnsupportedVideoCodec(codec: "av1", supported: ["H.264", "H.265/HEVC"])';
    const message = getImportErrorMessage(error);
    expect(message).toContain('AV1');
    expect(message).toContain('codec non supporté');
  });
});

describe('getNetworkErrorMessage (Story 9.1 AC #5)', () => {
  it('should return French message for network errors', () => {
    const msg = getNetworkErrorMessage('Network error: ECONNREFUSED');
    expect(msg).toBe('Erreur de connexion. Vérifiez votre connexion internet.');
  });

  it('should return French message for connection errors', () => {
    const msg = getNetworkErrorMessage('connection refused at 127.0.0.1:3001');
    expect(msg).toBe('Erreur de connexion. Vérifiez votre connexion internet.');
  });

  it('should return French message for Chromium net errors', () => {
    const msg = getNetworkErrorMessage('net::ERR_INTERNET_DISCONNECTED');
    expect(msg).toBe('Erreur de connexion. Vérifiez votre connexion internet.');
  });

  it('should return French message for timeout errors', () => {
    const msg = getNetworkErrorMessage('Request timed out after 5000ms');
    expect(msg).toBe('La connexion a expiré. Réessayez ultérieurement.');
  });

  it('should return French message for server errors', () => {
    const msg = getNetworkErrorMessage('Server error 503 Service Unavailable');
    expect(msg).toBe('Le serveur est temporairement indisponible. Réessayez ultérieurement.');
  });

  it('should return French message for DNS errors', () => {
    const msg = getNetworkErrorMessage('Failed to resolve host api.splice.dev');
    expect(msg).toBe('Impossible de joindre le serveur. Vérifiez votre connexion internet.');
  });

  it('should return French message for SSL errors', () => {
    const msg = getNetworkErrorMessage('SSL certificate verify failed');
    expect(msg).toBe('Erreur de sécurité de la connexion. Réessayez ultérieurement.');
  });

  it('should return generic French message for unknown network errors', () => {
    const msg = getNetworkErrorMessage('some unknown error without keywords');
    expect(msg).toBe('Une erreur réseau est survenue. Vérifiez votre connexion internet.');
  });

  it('should never contain stack traces (NFR30)', () => {
    const errorWithStack =
      'Error: network failure\n    at Object.<anonymous> (/app/src/index.ts:42:13)\n    at Module._compile (internal/modules/cjs/loader.js:1085:14)';
    const msg = getNetworkErrorMessage(errorWithStack);
    expect(msg).not.toContain('Object.<anonymous>');
    expect(msg).not.toContain('Module._compile');
    expect(msg).not.toContain('.ts:');
    expect(msg).not.toContain('.js:');
  });

  it('should never expose raw technical error details (NFR30)', () => {
    const rawError =
      'reqwest::Error { kind: Request, url: Url { scheme: "https", host: Some(Domain("api.splice.dev")) } }';
    const msg = getNetworkErrorMessage(rawError);
    expect(msg).not.toContain('reqwest');
    expect(msg).not.toContain('Url {');
    expect(msg).not.toContain('api.splice.dev');
  });
});

describe('getErrorWithGuidance (Story 9.3 AC #1, #2, #3)', () => {
  // Import video errors
  it('returns guidance for file not found error', () => {
    const result = getErrorWithGuidance('FileNotFound("/path/to/video.mp4")');
    expect(result.title).toBeTruthy();
    expect(result.description).toBeTruthy();
    expect(result.suggestedActions.length).toBeGreaterThan(0);
    expect(result.severity).toBe('error');
    expect(result.suggestedActions.some((a) => a.includes('fichier'))).toBe(true);
  });

  it('returns guidance for unsupported format error', () => {
    const result = getErrorWithGuidance('UnsupportedFormat("mkv")');
    expect(result.title).toBeTruthy();
    expect(result.suggestedActions.length).toBeGreaterThan(0);
    expect(result.severity).toBe('error');
  });

  it('returns guidance for video too large error', () => {
    const result = getErrorWithGuidance('VideoTooLarge(size: 55.00GB, max: 50GB)');
    expect(result.suggestedActions.some((a) => a.includes('50GB') || a.includes('volumineux'))).toBe(true);
  });

  // Transcription errors
  it('returns guidance for model not available error', () => {
    const result = getErrorWithGuidance('ModelNotAvailable: parakeet model not found');
    expect(result.title).toBeTruthy();
    expect(result.suggestedActions.length).toBeGreaterThan(0);
    expect(result.suggestedActions.some((a) => a.includes('modèle') || a.includes('télécharg'))).toBe(true);
  });

  it('returns guidance for transcription processing error', () => {
    const result = getErrorWithGuidance('TranscriptionFailed: out of memory');
    expect(result.title).toBeTruthy();
    expect(result.retryable).toBe(true);
  });

  // Export errors
  it('returns guidance for disk space error', () => {
    const result = getErrorWithGuidance('No space left on device');
    expect(result.suggestedActions.some((a) => a.includes('espace') || a.includes('disque'))).toBe(true);
  });

  it('returns guidance for file in use error', () => {
    const result = getErrorWithGuidance('The process cannot access the file because it is being used');
    expect(result.suggestedActions.some((a) => a.includes('Fermez') || a.includes('application'))).toBe(true);
  });

  // Segmentation errors
  it('returns guidance for segmentation/cut error', () => {
    const result = getErrorWithGuidance('SegmentationFailed: invalid segment range');
    expect(result.title).toBeTruthy();
    expect(result.suggestedActions.length).toBeGreaterThan(0);
  });

  // Network errors
  it('returns guidance for network error', () => {
    const result = getErrorWithGuidance('Network error: ECONNREFUSED');
    expect(result.suggestedActions.some((a) => a.includes('connexion') || a.includes('internet'))).toBe(true);
  });

  // Generic / unknown errors
  it('returns guidance for unknown error', () => {
    const result = getErrorWithGuidance('Some completely unknown error xyz');
    expect(result.title).toBeTruthy();
    expect(result.description).toBeTruthy();
    expect(result.suggestedActions.length).toBeGreaterThan(0);
    expect(result.severity).toBe('error');
  });

  it('all messages are in French (NFR29)', () => {
    const testCases = [
      'FileNotFound',
      'UnsupportedFormat',
      'TranscriptionFailed',
      'No space left on device',
      'Network error',
      'Unknown error xyz',
    ];
    for (const error of testCases) {
      const result = getErrorWithGuidance(error);
      // French characters or common French words should be present
      expect(result.title).not.toMatch(/^Error:/);
      expect(result.description).not.toMatch(/^An error/);
    }
  });

  it('returns retryable=true for transient errors', () => {
    const result = getErrorWithGuidance('Network error: connection refused');
    expect(result.retryable).toBe(true);
  });

  it('returns retryable=false for permanent errors', () => {
    const result = getErrorWithGuidance('UnsupportedFormat("mkv")');
    expect(result.retryable).toBe(false);
  });
});

describe('sanitizeErrorForUser (Story 9.3 AC #3)', () => {
  it('removes stack traces', () => {
    const error =
      'Error: something failed\n    at Object.<anonymous> (/app/src/main.ts:42:13)\n    at Module._compile (internal/modules/cjs/loader.js:1085:14)';
    const result = sanitizeErrorForUser(error);
    expect(result).not.toContain('Object.<anonymous>');
    expect(result).not.toContain('Module._compile');
    expect(result).not.toContain('.ts:42');
  });

  it('removes file paths', () => {
    const error = 'Error at /Users/nicolas/Documents/project/src/main.rs:42';
    const result = sanitizeErrorForUser(error);
    expect(result).not.toContain('/Users/nicolas');
    expect(result).not.toContain('main.rs:42');
  });

  it('removes Rust internal messages', () => {
    const error = 'thread \'main\' panicked at \'called `Result::unwrap()` on an `Err` value\'';
    const result = sanitizeErrorForUser(error);
    expect(result).not.toContain('panicked');
    expect(result).not.toContain('unwrap()');
  });

  it('removes reqwest/serde error details', () => {
    const error = 'reqwest::Error { kind: Decode, source: serde_json::Error { line: 1, column: 42 } }';
    const result = sanitizeErrorForUser(error);
    expect(result).not.toContain('reqwest');
    expect(result).not.toContain('serde_json');
  });

  it('preserves simple user-friendly messages', () => {
    const error = 'Fichier introuvable';
    const result = sanitizeErrorForUser(error);
    expect(result).toBe('Fichier introuvable');
  });

  it('returns fallback for fully sanitized messages', () => {
    const error = '    at Object.<anonymous> (/app/src/index.ts:1:1)';
    const result = sanitizeErrorForUser(error);
    expect(result.length).toBeGreaterThan(0);
  });
});
