import { describe, it, expect } from 'vitest';
import { getImportErrorMessage } from './error-messages';

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
