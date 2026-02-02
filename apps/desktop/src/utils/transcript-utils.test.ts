import { describe, it, expect } from 'vitest';
import { formatTimestamp, detectParagraphs } from './transcript-utils';
import type { TranscriptWord } from '@splice/types/generated';

describe('formatTimestamp', () => {
  it('should format 0 seconds', () => {
    expect(formatTimestamp(0)).toBe('[00:00:00]');
  });

  it('should format seconds with decimals', () => {
    expect(formatTimestamp(0.5)).toBe('[00:00:00]');
  });

  it('should format full minutes and seconds', () => {
    expect(formatTimestamp(83.456)).toBe('[00:01:23]');
  });

  it('should format timestamps over 1 hour', () => {
    expect(formatTimestamp(3665.789)).toBe('[01:01:05]');
  });

  it('should pad single digits', () => {
    expect(formatTimestamp(5.007)).toBe('[00:00:05]');
  });
});

describe('detectParagraphs', () => {
  it('should return [] for empty array', () => {
    expect(detectParagraphs([])).toEqual([]);
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

  it('should break after sentence-ending punctuation with 0.8s+ pause', () => {
    const words: TranscriptWord[] = [
      { index: 0, text: 'Hello.', start_time: 0, end_time: 0.5, confidence: 0.9 },
      // 1.0s pause after period — above 0.8s sentence threshold
      { index: 1, text: 'World', start_time: 1.5, end_time: 2.0, confidence: 0.95 },
    ];

    expect(detectParagraphs(words)).toEqual([0, 1]);
  });

  it('should not break after punctuation with short pause', () => {
    const words: TranscriptWord[] = [
      { index: 0, text: 'Hello.', start_time: 0, end_time: 0.5, confidence: 0.9 },
      // 0.2s pause — below 0.8s sentence threshold
      { index: 1, text: 'World', start_time: 0.7, end_time: 1.2, confidence: 0.95 },
    ];

    expect(detectParagraphs(words)).toEqual([0]);
  });

  it('should force break at max paragraph length', () => {
    // Create 90 words with no pauses
    const words: TranscriptWord[] = Array.from({ length: 90 }, (_, i) => ({
      index: i,
      text: 'word',
      start_time: i * 0.3,
      end_time: i * 0.3 + 0.25,
      confidence: 0.9,
    }));

    const result = detectParagraphs(words);
    expect(result).toEqual([0, 80]); // Break forced at word 80
  });
});
