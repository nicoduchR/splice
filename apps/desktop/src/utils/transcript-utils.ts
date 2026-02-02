import type { TranscriptWord } from '@splice/types/generated';

/**
 * Format un timestamp en secondes vers le format MM:SS.mmm
 * @param seconds - Timestamp en secondes (peut contenir des décimales)
 * @returns String formaté au format MM:SS.mmm (ex: "01:23.456")
 */
export function formatTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  const ss = String(secs).padStart(2, '0');

  return `[${hh}:${mm}:${ss}]`;
}

/**
 * Détecte les débuts de paragraphes basés sur les pauses/silences entre mots
 * @param words - Liste des mots du transcript
 * @returns Array d'indices marquant le début de chaque paragraphe
 */
export function detectParagraphs(words?: TranscriptWord[]): number[] {
  if (!words || words.length === 0) return [];

  const HARD_PAUSE_THRESHOLD = 1.5; // Long pause always starts new paragraph
  const SENTENCE_PAUSE_THRESHOLD = 0.8; // Shorter pause after sentence-ending punctuation
  const MAX_PARAGRAPH_WORDS = 80; // Force break on very long runs

  const paragraphStarts: number[] = [0];
  let wordsSinceBreak = 1;

  for (let i = 1; i < words.length; i++) {
    const gap = words[i].start_time - words[i - 1].end_time;
    const prevText = words[i - 1].text;
    const endsWithSentencePunctuation = /[.!?]$/.test(prevText);

    const isBreak =
      gap > HARD_PAUSE_THRESHOLD ||
      (endsWithSentencePunctuation && gap > SENTENCE_PAUSE_THRESHOLD) ||
      wordsSinceBreak >= MAX_PARAGRAPH_WORDS;

    if (isBreak) {
      paragraphStarts.push(i);
      wordsSinceBreak = 1;
    } else {
      wordsSinceBreak++;
    }
  }

  return paragraphStarts;
}
