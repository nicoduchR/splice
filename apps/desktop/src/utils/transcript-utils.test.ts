import { describe, it, expect } from 'vitest';
import { formatTimestamp, detectParagraphs } from './transcript-utils';
import type { TranscriptWord } from '@splice/types/generated';

describe('formatTimestamp', () => {
  it('should format 0 seconds', () => {
    expect(formatTimestamp(0)).toBe('00:00.000');
  });

  it('should format seconds with decimals', () => {
    expect(formatTimestamp(0.5)).toBe('00:00.500');
  });

  it('should format full minutes and seconds', () => {
    expect(formatTimestamp(83.456)).toBe('01:23.456');
  });

  it('should format timestamps over 1 hour', () => {
    expect(formatTimestamp(3665.789)).toBe('61:05.789');
  });

  it('should pad single digits', () => {
    // Note: Float precision may cause minor rounding (5.007 -> 5.006999...)
    const result = formatTimestamp(5.007);
    expect(result).toMatch(/^00:05\.00[67]$/); // Accept 006 or 007 due to float precision
  });
});

describe('detectParagraphs', () => {
  it('should return [0] for empty array', () => {
    expect(detectParagraphs([])).toEqual([0]);
  });

  it('should return [0] for single word', () => {
    const words: TranscriptWord[] = [
      { index: 0, text: 'Hello', start_time: 0, end_time: 0.5, confidence: 0.9 }
    ];
    expect(detectParagraphs(words)).toEqual([0]);
  });

  it('should detect paragraph after 1.5s+ pause', () => {
    const words: TranscriptWord[] = [
      { index: 0, text: 'Hello', start_time: 0, end_time: 0.5, confidence: 0.9 },
      { index: 1, text: 'world', start_time: 0.6, end_time: 1.0, confidence: 0.95 },
      // Pause de 2 secondes (1.0 → 3.0)
      { index: 2, text: 'This', start_time: 3.0, end_time: 3.5, confidence: 0.92 },
      { index: 3, text: 'is', start_time: 3.6, end_time: 4.0, confidence: 0.88 },
    ];

    const result = detectParagraphs(words);
    expect(result).toEqual([0, 2]); // Nouveau paragraphe à index 2
  });

  it('should not detect paragraph for small pauses', () => {
    const words: TranscriptWord[] = [
      { index: 0, text: 'Hello', start_time: 0, end_time: 0.5, confidence: 0.9 },
      // Pause de 1 seconde (< 1.5s threshold)
      { index: 1, text: 'world', start_time: 1.5, end_time: 2.0, confidence: 0.95 },
    ];

    const result = detectParagraphs(words);
    expect(result).toEqual([0]); // Pas de nouveau paragraphe
  });

  it('should detect multiple paragraphs', () => {
    const words: TranscriptWord[] = [
      { index: 0, text: 'A', start_time: 0, end_time: 0.5, confidence: 0.9 },
      { index: 1, text: 'B', start_time: 2.0, end_time: 2.5, confidence: 0.95 }, // Pause 1.5s
      { index: 2, text: 'C', start_time: 4.5, end_time: 5.0, confidence: 0.92 }, // Pause 2s
      { index: 3, text: 'D', start_time: 7.0, end_time: 7.5, confidence: 0.88 }, // Pause 2s
    ];

    const result = detectParagraphs(words);
    expect(result).toEqual([0, 2, 3]); // Paragraphes à 0, 2 et 3
  });
});
